import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit, getIP, getRequestId, checkCsrf } from "@/lib/rateLimit";
import { reportSchema } from "@/lib/schemas";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: NextRequest) {
  if (!checkCsrf(request)) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 403 });
  }
  if (!(await rateLimit(getIP(request), "strict"))) {
    return NextResponse.json(
      { error: "Trop de requêtes, réessayez plus tard" },
      { status: 429 },
    );
  }

  const requestId = getRequestId(request);
  const body = await request.json();
  const result = reportSchema.safeParse(body);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return NextResponse.json(
      { error: firstIssue?.message ?? "Données invalides" },
      { status: 400 },
    );
  }

  const { error } = await supabaseAdmin.from("reports").insert(result.data);

  if (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  await logActivity("report", "Nouveau signalement", result.data.station_name, { address: result.data.address, requestId });

  return NextResponse.json({ ok: true });
}
