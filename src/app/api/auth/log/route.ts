import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIP } from "@/lib/rateLimit";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: NextRequest) {
  if (!rateLimit(getIP(request))) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  try {
    const { email, event, token } = await request.json();
    if (!email || typeof email !== "string" || !token) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    // Vérifier le token JWT Supabase pour confirmer l'identité
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user || user.email !== email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const action = event === "SIGNED_OUT" ? "Déconnexion" : "Connexion";
    await logActivity("auth", action, email, { event: event ?? "SIGNED_IN" });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
