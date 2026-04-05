import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit, getIP, getRequestId, checkCsrf } from "@/lib/rateLimit";
import { logActivity } from "@/lib/activity-log";
import { suggestionSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  if (!checkCsrf(request)) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 403 });
  }
  if (!(await rateLimit(getIP(request), "strict"))) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }
  const requestId = getRequestId(request);

  const body = await request.json();
  const result = suggestionSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 },
    );
  }

  const { error } = await supabaseAdmin.from("suggestions").insert(result.data);

  if (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  await logActivity("suggestion", "Nouvelle suggestion", undefined, { requestId });

  return NextResponse.json({ ok: true });
}
