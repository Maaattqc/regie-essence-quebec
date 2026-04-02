import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

// GET /api/admin?type=stats|users|reports
export async function GET(req: NextRequest) {
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const type = req.nextUrl.searchParams.get("type");

  if (type === "stats") {
    const { count: totalSnapshots } = await supabaseAdmin
      .from("price_snapshots")
      .select("*", { count: "exact", head: true });

    const { data: latest } = await supabaseAdmin
      .from("price_snapshots")
      .select("snapshot_date")
      .order("snapshot_date", { ascending: false })
      .limit(1);

    const { count: totalReports } = await supabaseAdmin
      .from("reports")
      .select("*", { count: "exact", head: true });

    const { count: totalUsers } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true });

    let avgs = null;
    try {
      const { data } = await supabaseAdmin.rpc("get_avg_prices");
      avgs = data;
    } catch {}

    return NextResponse.json({
      totalSnapshots: totalSnapshots ?? 0,
      lastSnapshot: latest?.[0]?.snapshot_date ?? "Aucun",
      totalReports: totalReports ?? 0,
      totalUsers: totalUsers ?? 0,
      avgRegulier: avgs?.regulier ?? 0,
      avgSuper: avgs?.super ?? 0,
      avgDiesel: avgs?.diesel ?? 0,
    });
  }

  if (type === "users") {
    // Get profiles
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    // Enrich with emails from auth
    const enriched = await Promise.all(
      (profiles || []).map(async (p) => {
        const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(p.id);
        return { ...p, email: authUser?.email ?? p.email ?? "" };
      })
    );
    return NextResponse.json(enriched);
  }

  if (type === "reports") {
    const { data } = await supabaseAdmin
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    return NextResponse.json(data ?? []);
  }

  if (type === "snapshots") {
    const { data } = await supabaseAdmin
      .from("price_snapshots")
      .select("snapshot_date, gas_type, price")
      .order("snapshot_date", { ascending: false });

    if (!data) return NextResponse.json([]);

    // Group by date then gas_type
    const byDate = new Map<string, { date: string; types: Record<string, { nb: number; sum: number; min: number; max: number }> }>();
    for (const row of data) {
      if (!byDate.has(row.snapshot_date)) {
        byDate.set(row.snapshot_date, { date: row.snapshot_date, types: {} });
      }
      const entry = byDate.get(row.snapshot_date)!;
      if (!entry.types[row.gas_type]) {
        entry.types[row.gas_type] = { nb: 0, sum: 0, min: Infinity, max: -Infinity };
      }
      const t = entry.types[row.gas_type];
      t.nb++;
      t.sum += Number(row.price);
      if (Number(row.price) < t.min) t.min = Number(row.price);
      if (Number(row.price) > t.max) t.max = Number(row.price);
    }

    const result = Array.from(byDate.values()).map(({ date, types }) => ({
      date,
      totalStations: Object.values(types).reduce((s, t) => s + t.nb, 0),
      types: Object.fromEntries(
        Object.entries(types).map(([k, t]) => [k, {
          nb: t.nb,
          avg: Math.round(t.sum / t.nb * 10) / 10,
          min: t.min,
          max: t.max,
        }])
      ),
    }));

    return NextResponse.json(result);
  }

  if (type === "snapshot_detail") {
    const date = req.nextUrl.searchParams.get("date");
    if (!date) return NextResponse.json({ error: "date requis" }, { status: 400 });

    const { data } = await supabaseAdmin
      .from("price_snapshots")
      .select("station_name, address, gas_type, price")
      .eq("snapshot_date", date)
      .order("price", { ascending: true });

    return NextResponse.json(data ?? []);
  }

  return NextResponse.json({ error: "type requis" }, { status: 400 });
}

// PATCH /api/admin  body: { action: "report_status", id, status } | { action: "toggle_role", id }
export async function PATCH(req: NextRequest) {
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const body = await req.json();

  if (body.action === "report_status") {
    const { id, status } = body;
    if (!id || !status) return NextResponse.json({ error: "id et status requis" }, { status: 400 });
    await supabaseAdmin.from("reports").update({ status }).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "toggle_role") {
    const { id, currentRole } = body;
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    const newRole = currentRole === "admin" ? "user" : "admin";
    await supabaseAdmin.from("profiles").update({ role: newRole }).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "action inconnue" }, { status: 400 });
}
