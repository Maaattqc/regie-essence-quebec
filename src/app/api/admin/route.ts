import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit, getIP, getRequestId, checkCsrf } from "@/lib/rateLimit";
import { logActivity } from "@/lib/activity-log";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return null;
  const isAdminEmail = !!user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
  const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).single();
  if (!isAdminEmail && profile?.role !== "admin") return null;
  return user;
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return "***@***";
  const maskedName = name.length <= 2 ? "***" : `${name[0]}${"*".repeat(name.length - 1)}`;
  const maskedDomain = domain.length <= 2 ? "***" : `${domain[0]}${"*".repeat(domain.length - 1)}`;
  return `${maskedName}@${maskedDomain}`;
}

function maskName(name: string) {
  if (!name || name.length <= 2) return "***";
  return `${name[0]}${"*".repeat(name.length - 1)}`;
}

const VALID_LOG_CATEGORIES = ["sync", "cron", "auth", "report", "admin", "erreur", "suggestion"];

const MTZ = "America/Montreal";

/**
 * Retourne minuit Montréal (il y a `daysAgo` jours) en ISO UTC.
 * Sonde à midi pour calculer l'offset DST — midi n'est jamais ambigu lors des transitions.
 */
function montrealMidnight(daysAgo = 0): string {
  const todayMtl = new Date().toLocaleDateString("en-CA", { timeZone: MTZ }); // "YYYY-MM-DD"
  const [y, m, d] = todayMtl.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1, d - daysAgo));
  const yy = target.getUTCFullYear();
  const mm = String(target.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(target.getUTCDate()).padStart(2, "0");
  const noonUtc = new Date(`${yy}-${mm}-${dd}T12:00:00Z`);
  const offsetMs = noonUtc.getTime() - new Date(noonUtc.toLocaleString("en-US", { timeZone: MTZ })).getTime();
  return new Date(Date.UTC(yy, Number(mm) - 1, Number(dd)) + offsetMs).toISOString();
}

/** Retourne le 1er du mois courant à minuit Montréal en ISO UTC. */
function montrealMonthStart(): string {
  const todayMtl = new Date().toLocaleDateString("en-CA", { timeZone: MTZ });
  const [y, m] = todayMtl.split("-").map(Number);
  const mm = String(m).padStart(2, "0");
  const noonUtc = new Date(`${y}-${mm}-01T12:00:00Z`);
  const offsetMs = noonUtc.getTime() - new Date(noonUtc.toLocaleString("en-US", { timeZone: MTZ })).getTime();
  return new Date(Date.UTC(y, m - 1, 1) + offsetMs).toISOString();
}

// GET /api/admin?type=stats|users|reports
export async function GET(req: NextRequest) {
  if (!(await rateLimit(getIP(req)))) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  const user = await verifyAdmin(req);
  const isAdmin = !!user;

  const type = req.nextUrl.searchParams.get("type");

  // ── Me : statut admin de l'utilisateur courant ──
  if (type === "me") {
    return NextResponse.json({ isAdmin });
  }

  // ── Init : tout charger en une seule requête ──
  if (type === "init") {
    const todayStart = montrealMidnight(0);
    const weekStart = montrealMidnight(7);
    const monthStart = montrealMonthStart();

    const [
      { count: totalSnapshots },
      { data: latest },
      { count: totalReports },
      { count: totalUsers },
      { count: totalPageViews },
      { count: todayPageViews },
      { count: weekPageViews },
      { count: monthPageViews },
      { data: profiles },
      { data: reportsData },
      { data: suggestionsData },
      avgsResult,
    ] = await Promise.all([
      supabaseAdmin.from("price_snapshots").select("*", { count: "estimated", head: true }),
      supabaseAdmin.from("price_snapshots").select("snapshot_at").order("snapshot_at", { ascending: false }).limit(1),
      supabaseAdmin.from("reports").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("page_views").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
      supabaseAdmin.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", weekStart),
      supabaseAdmin.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", monthStart),
      supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }).limit(200),
      supabaseAdmin.from("reports").select("*").order("created_at", { ascending: false }).limit(500),
      supabaseAdmin.from("suggestions").select("*").order("created_at", { ascending: false }).limit(500),
      supabaseAdmin.rpc("get_avg_prices").then(res => res, () => ({ data: null })),
    ]);

    const avgs = avgsResult?.data ?? null;

    // Charger tous les emails en 1 appel Auth (remplace N×getUserById)
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const emailMap = new Map((authData?.users ?? []).map((u) => [u.id, u.email ?? ""]));
    const enrichedUsers = (profiles ?? []).map((p: Record<string, unknown>) => {
      const email = emailMap.get(p.id as string) ?? (p.email as string) ?? "";
      return { ...p, email: isAdmin ? email : maskEmail(email) };
    });

    const reports = (reportsData ?? []).map((r: Record<string, unknown>) =>
      isAdmin ? r : { ...r, email: typeof r.email === "string" ? maskEmail(r.email) : "***", first_name: typeof r.first_name === "string" ? maskName(r.first_name) : "***", last_name: typeof r.last_name === "string" ? maskName(r.last_name) : "***" }
    );
    const suggestions = (suggestionsData ?? []).map((s: Record<string, unknown>) =>
      isAdmin ? s : { ...s, email: typeof s.email === "string" ? maskEmail(s.email) : "***", first_name: typeof s.first_name === "string" ? maskName(s.first_name) : "***", last_name: typeof s.last_name === "string" ? maskName(s.last_name) : "***" }
    );

    return NextResponse.json({
      stats: {
        totalSnapshots: totalSnapshots ?? 0,
        lastSnapshot: latest?.[0]?.snapshot_at ?? "Aucun",
        totalReports: totalReports ?? 0,
        totalUsers: totalUsers ?? 0,
        avgRegulier: avgs?.regulier ?? 0,
        avgSuper: avgs?.super ?? 0,
        avgDiesel: avgs?.diesel ?? 0,
        totalPageViews: totalPageViews ?? 0,
        todayPageViews: todayPageViews ?? 0,
        weekPageViews: weekPageViews ?? 0,
        monthPageViews: monthPageViews ?? 0,
      },
      users: enrichedUsers,
      reports,
      suggestions,
    });
  }

  if (type === "stats") {
    const todayStart = montrealMidnight(0);
    const weekStart = montrealMidnight(7);
    const monthStart = montrealMonthStart();

    const [
      { count: totalSnapshots },
      { data: latest },
      { count: totalReports },
      { count: totalUsers },
      { count: totalPageViews },
      { count: todayPageViews },
      { count: weekPageViews },
      { count: monthPageViews },
    ] = await Promise.all([
      supabaseAdmin.from("price_snapshots").select("*", { count: "estimated", head: true }),
      supabaseAdmin.from("price_snapshots").select("snapshot_at").order("snapshot_at", { ascending: false }).limit(1),
      supabaseAdmin.from("reports").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("page_views").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
      supabaseAdmin.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", weekStart),
      supabaseAdmin.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", monthStart),
    ]);

    let avgs = null;
    try {
      const { data } = await supabaseAdmin.rpc("get_avg_prices");
      avgs = data;
    } catch (error) {
      await logActivity("erreur", "Échec get_avg_prices (stats)", undefined, { error: String(error) });
    }

    return NextResponse.json({
      totalSnapshots: totalSnapshots ?? 0,
      lastSnapshot: latest?.[0]?.snapshot_at ?? "Aucun",
      totalReports: totalReports ?? 0,
      totalUsers: totalUsers ?? 0,
      avgRegulier: avgs?.regulier ?? 0,
      avgSuper: avgs?.super ?? 0,
      avgDiesel: avgs?.diesel ?? 0,
      totalPageViews: totalPageViews ?? 0,
      todayPageViews: todayPageViews ?? 0,
      weekPageViews: weekPageViews ?? 0,
      monthPageViews: monthPageViews ?? 0,
    });
  }

  if (type === "users") {
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 50, 200);
    const offset = Number(req.nextUrl.searchParams.get("offset")) || 0;
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Charger tous les emails en 1 appel Auth (remplace N×getUserById)
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const emailMap = new Map((authData?.users ?? []).map((u) => [u.id, u.email ?? ""]));
    const enriched = (profiles ?? []).map((p) => {
      const email = emailMap.get(p.id) ?? p.email ?? "";
      return { ...p, email: isAdmin ? email : maskEmail(email) };
    });
    return NextResponse.json(enriched);
  }

  if (type === "reports") {
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 50, 500);
    const offset = Number(req.nextUrl.searchParams.get("offset")) || 0;
    const { data } = await supabaseAdmin
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    const reports = (data ?? []).map((r: Record<string, unknown>) =>
      isAdmin ? r : {
        ...r,
        email: typeof r.email === "string" ? maskEmail(r.email) : "***",
        first_name: typeof r.first_name === "string" ? maskName(r.first_name) : "***",
        last_name: typeof r.last_name === "string" ? maskName(r.last_name) : "***",
      }
    );
    return NextResponse.json(reports);
  }

  if (type === "snapshots") {
    // Résumé agrégé directement en SQL — rapide même sur 260k+ lignes
    const { data, error } = await supabaseAdmin.rpc("get_snapshot_summary");
    if (error || !data) return NextResponse.json([]);
    return NextResponse.json(data);
  }

  if (type === "snapshot_detail") {
    let snapshotAt = req.nextUrl.searchParams.get("snapshotAt");
    const date = req.nextUrl.searchParams.get("date");
    const latest = req.nextUrl.searchParams.get("latest");

    // Si latest=1, trouver le dernier snapshot_at
    if (latest && !snapshotAt && !date) {
      const { data: latestRow } = await supabaseAdmin
        .from("price_snapshots")
        .select("snapshot_at")
        .order("snapshot_at", { ascending: false })
        .limit(1);
      if (latestRow?.[0]) snapshotAt = latestRow[0].snapshot_at;
      else return NextResponse.json([]);
    }

    if (!snapshotAt && !date) return NextResponse.json({ error: "snapshotAt ou date requis" }, { status: 400 });

    // Valider format date
    if (snapshotAt && isNaN(new Date(snapshotAt).getTime())) return NextResponse.json({ error: "Format snapshotAt invalide" }, { status: 400 });
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "Format date invalide (YYYY-MM-DD)" }, { status: 400 });

    const allRows: unknown[] = [];
    const BATCH = 1000;
    let from = 0;

    while (true) {
      let query = supabaseAdmin
        .from("price_snapshots")
        .select("station_name, address, gas_type, price")
        .order("price", { ascending: true })
        .range(from, from + BATCH - 1);

      if (snapshotAt) {
        query = query.eq("snapshot_at", snapshotAt);
      } else {
        query = query.eq("snapshot_date", date!);
      }

      const { data } = await query;
      if (!data || data.length === 0) break;
      allRows.push(...data);
      if (data.length < BATCH) break;
      from += BATCH;
    }

    return NextResponse.json(allRows);
  }

  if (type === "logs") {
    const category = req.nextUrl.searchParams.get("category") || "";
    if (category && !VALID_LOG_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Catégorie invalide" }, { status: 400 });
    }
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 100, 200);
    let query = supabaseAdmin
      .from("activity_logs")
      .select("id, category, action, detail, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (category) query = query.eq("category", category);
    const { data } = await query;
    if (isAdmin) return NextResponse.json(data ?? []);
    // Masquer les emails dans le champ detail pour les non-admin
    const masked = (data ?? []).map((log: Record<string, unknown>) => ({
      ...log,
      detail: typeof log.detail === "string" && log.detail.includes("@")
        ? maskEmail(log.detail)
        : log.detail,
    }));
    return NextResponse.json(masked);
  }

  if (type === "alerts") {
    const { count: highPrices } = await supabaseAdmin
      .from("price_snapshots")
      .select("*", { count: "exact", head: true })
      .gt("price", 250);
    const { count: lowPrices } = await supabaseAdmin
      .from("price_snapshots")
      .select("*", { count: "exact", head: true })
      .lt("price", 80)
      .gt("price", 0);
    return NextResponse.json({ highPrices: highPrices ?? 0, lowPrices: lowPrices ?? 0 });
  }

  if (type === "traffic") {
    const range = req.nextUrl.searchParams.get("range") || "day";
    const bucketMode = range === "day" ? "hour" : range === "month" ? "month" : "day";
    const since = range === "day"
      ? montrealMidnight(1) // depuis minuit hier
      : montrealMidnight(range === "week" ? 7 : 365);

    const [{ data: bucketData }, { data: pageData }] = await Promise.all([
      supabaseAdmin.rpc("get_traffic_stats", { since, bucket_mode: bucketMode }),
      supabaseAdmin.rpc("get_traffic_pages", { since }),
    ]);

    const midnightTodayUtc = new Date(montrealMidnight(0)).getTime();
    const buckets: Record<string, number> = {};

    (bucketData ?? []).forEach((row: { bucket: string; cnt: number }) => {
      // bucket est en heure locale Montréal (retourné par AT TIME ZONE)
      const bucketDate = new Date(row.bucket);
      let key: string;
      if (range === "day") {
        const h = bucketDate.getUTCHours();
        // Comparer le timestamp UTC réel : bucket Montréal 10h = UTC row.bucket "2026-04-04T10:00:00Z"
        // midnightTodayUtc = minuit Montréal en vrai UTC (ex: 04:00 UTC)
        // Les buckets Postgres sont en heure locale Montréal stockées comme UTC offset-naive
        // Donc on compare les heures locales : bucket du jour >= minuit Montréal du jour
        const bucketMtlDate = new Date(bucketDate.getUTCFullYear(), bucketDate.getUTCMonth(), bucketDate.getUTCDate());
        const todayMtl = new Date(new Date(midnightTodayUtc).toLocaleString("en-US", { timeZone: "America/Montreal" }));
        todayMtl.setHours(0, 0, 0, 0);
        const isToday = bucketMtlDate.getTime() >= todayMtl.getTime();
        key = isToday ? `${h}h` : `H ${h}h`;
      } else if (range === "month") {
        key = bucketDate.toLocaleDateString("fr-CA", { month: "short", year: "numeric", timeZone: "UTC" });
      } else {
        key = bucketDate.toLocaleDateString("fr-CA", { month: "short", day: "numeric", timeZone: "UTC" });
      }
      buckets[key] = (buckets[key] ?? 0) + Number(row.cnt);
    });

    // Remplir les heures vides pour le graphique
    if (range === "day") {
      const nowMtl = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Montreal" }));
      const currentHour = nowMtl.getHours();
      for (let h = 0; h < 24; h++) {
        const key = `H ${h}h`;
        if (!(key in buckets)) buckets[key] = 0;
      }
      for (let h = 0; h < currentHour; h++) {
        const key = `${h}h`;
        if (!(key in buckets)) buckets[key] = 0;
      }
    }

    const chart = (range === "day"
      ? Object.entries(buckets).sort((a, b) => {
          const aYesterday = a[0].startsWith("H ");
          const bYesterday = b[0].startsWith("H ");
          if (aYesterday !== bYesterday) return aYesterday ? -1 : 1;
          return parseInt(a[0].replace("H ", "")) - parseInt(b[0].replace("H ", ""));
        })
      : Object.entries(buckets)
    ).map(([label, count]) => ({ label, count }));

    const VALID_PAGES = new Set(["/", "/admin", "/login", "/faq", "/a-propos", "/confidentialite", "/changelog", "/tech"]);
    const pages = (pageData ?? [])
      .filter((row: { page: string }) => VALID_PAGES.has(row.page))
      .map((row: { page: string; cnt: number }) => ({
        page: row.page,
        count: Number(row.cnt),
      }));

    return NextResponse.json({ chart, pages });
  }

  if (type === "auth_logs") {
    const { data } = await supabaseAdmin
      .from("activity_logs")
      .select("id, action, detail, metadata, created_at")
      .eq("category", "auth")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!isAdmin) {
      const masked = (data ?? []).map((log: Record<string, unknown>) => ({
        ...log,
        detail: typeof log.detail === "string" && log.detail.includes("@") ? maskEmail(log.detail) : log.detail,
      }));
      return NextResponse.json(masked);
    }
    return NextResponse.json(data ?? []);
  }

  if (type === "suggestions") {
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 50, 500);
    const offset = Number(req.nextUrl.searchParams.get("offset")) || 0;
    const { data } = await supabaseAdmin
      .from("suggestions")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    const suggestions = (data ?? []).map((s: Record<string, unknown>) =>
      isAdmin ? s : {
        ...s,
        email: typeof s.email === "string" ? maskEmail(s.email) : "***",
        first_name: typeof s.first_name === "string" ? maskName(s.first_name) : "***",
        last_name: typeof s.last_name === "string" ? maskName(s.last_name) : "***",
      }
    );
    return NextResponse.json(suggestions);
  }

  return NextResponse.json({ error: "type requis" }, { status: 400 });
}

// PATCH /api/admin  body: { action: "report_status", id, status } | { action: "toggle_role", id } | { action: "suggestion_status", id, status }
export async function PATCH(req: NextRequest) {
  if (!checkCsrf(req)) return NextResponse.json({ error: "Requête invalide" }, { status: 403 });
  if (!(await rateLimit(getIP(req)))) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const requestId = getRequestId(req);
  const body = await req.json();

  const VALID_REPORT_STATUSES = ["pending", "resolved", "rejected", "in_progress"];
  const VALID_SUGGESTION_STATUSES = ["pending", "approved", "rejected", "in_progress"];

  if (body.action === "report_status") {
    const { id, status } = body;
    if (!id || !status) return NextResponse.json({ error: "id et status requis" }, { status: 400 });
    if (!VALID_REPORT_STATUSES.includes(status)) return NextResponse.json({ error: `Status invalide. Valeurs permises : ${VALID_REPORT_STATUSES.join(", ")}` }, { status: 400 });
    await supabaseAdmin.from("reports").update({ status }).eq("id", id);
    await logActivity("admin", `Signalement #${id} → ${status}`, undefined, { reportId: id, status, by: user.email, requestId });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "toggle_role") {
    const { id, currentRole } = body;
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    const newRole = currentRole === "admin" ? "user" : "admin";
    await supabaseAdmin.from("profiles").update({ role: newRole }).eq("id", id);
    await logActivity("admin", `Rôle changé → ${newRole}`, undefined, { userId: id, newRole, by: user.email, requestId });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "suggestion_status") {
    const { id, status, admin_comment } = body;
    if (!id || !status) return NextResponse.json({ error: "id et status requis" }, { status: 400 });
    if (!VALID_SUGGESTION_STATUSES.includes(status)) return NextResponse.json({ error: `Status invalide. Valeurs permises : ${VALID_SUGGESTION_STATUSES.join(", ")}` }, { status: 400 });
    if (admin_comment !== undefined && (typeof admin_comment !== "string" || admin_comment.length > 1000)) {
      return NextResponse.json({ error: "admin_comment invalide" }, { status: 400 });
    }
    const update: Record<string, unknown> = { status };
    if (admin_comment !== undefined) update.admin_comment = admin_comment;
    await supabaseAdmin.from("suggestions").update(update).eq("id", id);
    await logActivity("admin", `Suggestion #${id} → ${status}`, admin_comment ?? undefined, { suggestionId: id, status, by: user.email, requestId });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "report_comment") {
    const { id, admin_comment } = body;
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    if (admin_comment !== undefined && (typeof admin_comment !== "string" || admin_comment.length > 1000)) {
      return NextResponse.json({ error: "admin_comment invalide" }, { status: 400 });
    }
    await supabaseAdmin.from("reports").update({ admin_comment }).eq("id", id);
    await logActivity("admin", `Commentaire signalement #${id}`, admin_comment ?? undefined, { reportId: id, by: user.email, requestId });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "action inconnue" }, { status: 400 });
}
