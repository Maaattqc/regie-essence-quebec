import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIP } from "@/lib/rateLimit";

const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  if (!rateLimit(getIP(request))) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { searchParams } = request.nextUrl;
  const station = searchParams.get("station");
  const address = searchParams.get("address");

  if (!station || !address) {
    return NextResponse.json({ error: "station et address requis" }, { status: 400 });
  }

  const { data, error } = await supabasePublic
    .from("reviews")
    .select("id, rating, comment, created_at, user_id")
    .eq("station_name", station)
    .eq("address", address)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch emails for display
  const userIds = [...new Set((data || []).map((r) => r.user_id))];
  const emails: Record<string, string> = {};
  for (const uid of userIds) {
    const { data: user } = await supabaseAdmin.auth.admin.getUserById(uid);
    if (user?.user?.email) emails[uid] = user.user.email.split("@")[0];
  }

  const reviews = (data || []).map((r) => ({
    ...r,
    author: emails[r.user_id] || "Anonyme",
  }));

  // Average
  const avg = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return NextResponse.json({ reviews, avg, count: reviews.length });
}

export async function POST(request: NextRequest) {
  if (!rateLimit(getIP(request))) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();
  const { station_name, address, rating, comment } = body;

  if (!station_name || !address || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("reviews").upsert({
    user_id: user.id,
    station_name,
    address,
    rating,
    comment: comment || null,
  }, {
    onConflict: "user_id,station_name,address",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
