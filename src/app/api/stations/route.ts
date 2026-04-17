import { after, NextResponse } from "next/server";
import {
  getStationFeed,
  shouldQueueStationRefresh,
  syncStations,
} from "@/lib/station-sync";
import { rateLimit, getIP } from "@/lib/rateLimit";

export const maxDuration = 120;

export async function GET(request: Request) {
  if (request.headers.get("x-app-request") !== "1") {
    return NextResponse.json({ error: "Requête non autorisée" }, { status: 403 });
  }

  if (!(await rateLimit(getIP(request), "relaxed"))) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
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
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "Vary": "x-app-request, accept-language",
      },
    }
  );
}
