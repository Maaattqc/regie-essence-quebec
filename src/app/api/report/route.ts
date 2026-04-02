import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIP } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  if (!rateLimit(getIP(request))) {
    return NextResponse.json({ error: "Trop de requêtes, réessayez plus tard" }, { status: 429 });
  }
  const body = await request.json();
  const { station_name, address, first_name, last_name, email, message } = body;

  if (!station_name || !address || !first_name || !last_name || !email || !message) {
    return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.from("reports").insert({
    station_name,
    address,
    first_name,
    last_name,
    email,
    message,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
