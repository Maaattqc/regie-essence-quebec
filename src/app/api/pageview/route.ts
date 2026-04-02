import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit, getIP } from "@/lib/rateLimit";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: Request) {
  if (!rateLimit(getIP(request))) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  try {
    const { sessionId } = await request.json();
    if (!sessionId || typeof sessionId !== "string" || sessionId.length > 100 || !/^[a-f0-9-]+$/i.test(sessionId)) {
      return NextResponse.json({ error: "sessionId requis (UUID)" }, { status: 400 });
    }

    await supabaseAdmin.from("page_views").insert({ session_id: sessionId });
    await logActivity("visite", "Nouvelle session", undefined, { sessionId });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
