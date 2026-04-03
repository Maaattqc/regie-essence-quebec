import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit, getIP } from "@/lib/rateLimit";
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

const VALID_LOG_CATEGORIES = ["sync", "cron", "auth", "report", "admin", "visite", "erreur", "suggestion"];

// GET /api/admin?type=stats|users|reports
export async function GET(req: NextRequest) {
  if (!rateLimit(getIP(req))) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  const user = await verifyAdmin(req);
  const isAdmin = !!user;

  const type = req.nextUrl.searchParams.get("type");

  // ── Init : tout charger en une seule requête ──
  if (type === "init") {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

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

    // Enrichir les profils avec les emails
    const profileList = profiles || [];
    const enrichedUsers: Record<string, unknown>[] = [];
    const UBATCH = 10;
    for (let i = 0; i < profileList.length; i += UBATCH) {
      const batch = profileList.slice(i, i + UBATCH);
      const results = await Promise.all(
        batch.map(async (p: Record<string, unknown>) => {
          try {
            const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(p.id as string);
            const email = authUser?.email ?? (p.email as string) ?? "";
            return { ...p, email: isAdmin ? email : maskEmail(email) };
          } catch {
            return { ...p, email: isAdmin ? ((p.email as string) ?? "") : "***@***" };
          }
        })
      );
      enrichedUsers.push(...results);
    }

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
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

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
    } catch {}

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
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    // Batch email lookup (limit concurrent calls)
    const list = profiles || [];
    const enriched: Record<string, unknown>[] = [];
    const BATCH = 10;
    for (let i = 0; i < list.length; i += BATCH) {
      const batch = list.slice(i, i + BATCH);
      const results = await Promise.all(
        batch.map(async (p) => {
          try {
            const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(p.id);
            const email = authUser?.email ?? p.email ?? "";
            return { ...p, email: isAdmin ? email : maskEmail(email) };
          } catch {
            return { ...p, email: isAdmin ? (p.email ?? "") : "***@***" };
          }
        })
      );
      enriched.push(...results);
    }
    return NextResponse.json(enriched);
  }

  if (type === "reports") {
    const { data } = await supabaseAdmin
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
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
    let days = 1;
    if (range === "week") days = 7;
    else if (range === "month") days = 30;
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const { data } = await supabaseAdmin
      .from("page_views")
      .select("created_at, page")
      .gte("created_at", since)
      .order("created_at", { ascending: true });
    // Grouper par heure (jour) ou par jour (semaine/mois)
    const buckets: Record<string, number> = {};
    const pageBuckets: Record<string, number> = {};
    (data ?? []).forEach((row: { created_at: string; page?: string }) => {
      const d = new Date(row.created_at);
      const key = range === "day"
        ? `${d.getHours()}h`
        : d.toLocaleDateString("fr-CA", { month: "short", day: "numeric" });
      buckets[key] = (buckets[key] ?? 0) + 1;
      const pg = row.page || "/";
      pageBuckets[pg] = (pageBuckets[pg] ?? 0) + 1;
    });
    const chart = Object.entries(buckets).map(([label, count]) => ({ label, count }));
    const pages = Object.entries(pageBuckets)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count);
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
    const { data } = await supabaseAdmin
      .from("suggestions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
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
  if (!rateLimit(getIP(req))) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const body = await req.json();

  if (body.action === "report_status") {
    const { id, status } = body;
    if (!id || !status) return NextResponse.json({ error: "id et status requis" }, { status: 400 });
    await supabaseAdmin.from("reports").update({ status }).eq("id", id);
    await logActivity("admin", `Signalement #${id} → ${status}`, undefined, { reportId: id, status, by: user.email });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "toggle_role") {
    const { id, currentRole } = body;
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    const newRole = currentRole === "admin" ? "user" : "admin";
    await supabaseAdmin.from("profiles").update({ role: newRole }).eq("id", id);
    await logActivity("admin", `Rôle changé → ${newRole}`, undefined, { userId: id, newRole, by: user.email });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "suggestion_status") {
    const { id, status, admin_comment } = body;
    if (!id || !status) return NextResponse.json({ error: "id et status requis" }, { status: 400 });
    const update: Record<string, unknown> = { status };
    if (admin_comment !== undefined) update.admin_comment = admin_comment;
    await supabaseAdmin.from("suggestions").update(update).eq("id", id);
    await logActivity("admin", `Suggestion #${id} → ${status}`, admin_comment ?? undefined, { suggestionId: id, status, by: user.email });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "report_comment") {
    const { id, admin_comment } = body;
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    await supabaseAdmin.from("reports").update({ admin_comment }).eq("id", id);
    await logActivity("admin", `Commentaire signalement #${id}`, admin_comment ?? undefined, { reportId: id, by: user.email });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "action inconnue" }, { status: 400 });
}
