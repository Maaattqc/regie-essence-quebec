import { after, NextResponse } from "next/server";
import { rateLimit, getIP } from "@/lib/rateLimit";
import { syncStations } from "@/lib/station-sync";
import { logActivity } from "@/lib/activity-log";

export const maxDuration = 120;

export async function GET(request: Request) {
  if (!rateLimit(getIP(request))) {
    return NextResponse.json({ error: "Trop de requetes" }, { status: 429 });
  }

  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
