import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { rateLimit, getIP } from "@/lib/rateLimit";

export async function GET(request: NextRequest) {
  if (!(await rateLimit(getIP(request)))) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }
  const { searchParams } = request.nextUrl;
  const stationName = searchParams.get("station");
  const address = searchParams.get("address");
  const gasType = searchParams.get("type") || "Régulier";
  const days = Math.min(Number(searchParams.get("days") || 30), 90);

  if (!stationName || !address) {
    return NextResponse.json({ error: "station and address required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("price_snapshots")
    .select("price, snapshot_date")
    .eq("station_name", stationName)
    .eq("address", address)
    .eq("gas_type", gasType)
    .gte("snapshot_date", new Date(Date.now() - days * 86400000).toISOString().split("T")[0])
    .order("snapshot_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  return NextResponse.json(data);
}
