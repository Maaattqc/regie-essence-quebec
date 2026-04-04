import { after, NextResponse } from "next/server";
import { rateLimit, getIP } from "@/lib/rateLimit";
import { syncStations } from "@/lib/station-sync";
import { logActivity } from "@/lib/activity-log";

export const maxDuration = 120;

export async function GET(request: Request) {
  if (!(await rateLimit(getIP(request)))) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET non configuré" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const queuedAt = new Date().toISOString();

  after(async () => {
    const result = await syncStations({
      reason: "cron",
      force: true,
    });
    await logActivity("cron", result.changed ? "Sync terminé — nouvelles données" : `Sync terminé — ${result.reason}`, undefined, { datasetId: result.datasetId, reason: result.reason });
  });

  return NextResponse.json(
    {
      ok: true,
      queued: true,
      queuedAt,
    },
    { status: 202 }
  );
}
