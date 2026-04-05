import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity } from "@/lib/activity-log";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET non configuré" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const results: Record<string, string> = {};

  // Purger les activity_logs > 90 jours
  const logsThreshold = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { error: logsError } = await supabaseAdmin
    .from("activity_logs")
    .delete()
    .lt("created_at", logsThreshold);
  results.activity_logs = logsError ? logsError.message : "ok";

  // Purger les signalements résolus/rejetés > 12 mois
  const reportsThreshold = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
  const { error: reportsError } = await supabaseAdmin
    .from("reports")
    .delete()
    .in("status", ["resolved", "rejected"])
    .lt("created_at", reportsThreshold);
  results.reports = reportsError ? reportsError.message : "ok";

  // Purger les page_views > 90 jours
  const { error: viewsError } = await supabaseAdmin
    .from("page_views")
    .delete()
    .lt("created_at", logsThreshold);
  results.page_views = viewsError ? viewsError.message : "ok";

  await logActivity("cron", "Nettoyage données expirées", undefined, results);

  return NextResponse.json({ ok: true, results });
}
