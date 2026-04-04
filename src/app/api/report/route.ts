import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit, getIP } from "@/lib/rateLimit";
import { reportSchema } from "@/lib/schemas";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: NextRequest) {
  if (!(await rateLimit(getIP(request), "strict"))) {
    return NextResponse.json(
      { error: "Trop de requêtes, réessayez plus tard" },
      { status: 429 },
    );
  }

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

  await logActivity("report", "Nouveau signalement", result.data.station_name, { address: result.data.address });

  return NextResponse.json({ ok: true });
}
