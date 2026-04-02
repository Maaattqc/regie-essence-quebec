import { after, NextResponse } from "next/server";
import {
  getStationFeed,
  shouldQueueStationRefresh,
  syncStations,
} from "@/lib/station-sync";
import { rateLimit, getIP } from "@/lib/rateLimit";

export const maxDuration = 120;

export async function GET(request: Request) {
  if (!rateLimit(getIP(request))) {
    return NextResponse.json({ error: "Trop de requetes" }, { status: 429 });
  }

  const feed = await getStationFeed();

  if (shouldQueueStationRefresh(feed.meta)) {
    after(async () => {
      await syncStations({
        reason: feed.data ? "serve-stale" : "serve-empty",
      });
    });
  }

  if (!feed.data) {
    return NextResponse.json(
      {
        ok: false,
        data: null,
        meta: feed.meta,
      },
      {
        status: 202,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      data: feed.data,
      meta: feed.meta,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
