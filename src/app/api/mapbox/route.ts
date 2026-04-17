import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getIP, checkCsrf, redis } from "@/lib/rateLimit";
import { logActivity } from "@/lib/activity-log";
import { z } from "zod";

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN ?? "";
const MAPBOX_BASE = "https://api.mapbox.com";
const MATRIX_CACHE_TTL = 900; // 15 minutes

const bodySchema = z.union([
  z.object({ type: z.literal("matrix"), coords: z.string().max(2000).regex(/^[-0-9.,;]+$/) }),
  z.object({
    type: z.literal("directions"),
    origin: z.tuple([z.number(), z.number()]),
    destination: z.tuple([z.number(), z.number()]),
  }),
]);

/** Arrondir chaque coordonnée à 4 décimales (~10m) pour regrouper les positions proches. */
function quantizeCoords(coords: string): string {
  return coords
    .split(";")
    .map((pair) => {
      const [lng, lat] = pair.split(",").map(Number);
      return `${lng.toFixed(4)},${lat.toFixed(4)}`;
    })
    .join(";");
}

// Proxy Mapbox Matrix API (distances multi-destinations)
export async function POST(request: NextRequest) {
  if (request.headers.get("x-app-request") !== "1") {
    return NextResponse.json({ error: "Requête non autorisée" }, { status: 403 });
  }
  if (!checkCsrf(request)) return NextResponse.json({ error: "Requête invalide" }, { status: 403 });

  if (!(await rateLimit(getIP(request), "mapbox"))) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }
  const body = parsed.data;

  try {
    if (body.type === "matrix") {
      const coordsCount = body.coords.split(";").length;
      if (coordsCount > 20) {
        return NextResponse.json({ error: "Trop de coordonnées" }, { status: 400 });
      }

      // Cache serveur Redis pour les requêtes Matrix
      const quantized = quantizeCoords(body.coords);
      const cacheKey = `mapbox:matrix:${quantized}`;

      if (redis) {
        const cached = await redis.get<string>(cacheKey);
        if (cached) {
          const data = typeof cached === "string" ? JSON.parse(cached) : cached;
          return NextResponse.json(data, { headers: { "X-Mapbox-Cache": "HIT" } });
        }
      }

      const res = await fetch(
        `${MAPBOX_BASE}/directions-matrix/v1/mapbox/driving/${body.coords}?sources=0&annotations=distance,duration&access_token=${MAPBOX_TOKEN}`,
      );
      if (!res.ok) return NextResponse.json({ error: "Erreur Mapbox" }, { status: 502 });
      const data = await res.json();

      if (redis) {
        await redis.set(cacheKey, JSON.stringify(data), { ex: MATRIX_CACHE_TTL });
      }

      return NextResponse.json(data, { headers: { "X-Mapbox-Cache": "MISS" } });
    }

    if (body.type === "directions") {
      const c = `${body.origin[1]},${body.origin[0]};${body.destination[1]},${body.destination[0]}`;
      const res = await fetch(
        `${MAPBOX_BASE}/directions/v5/mapbox/driving-traffic/${c}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`,
      );
      if (!res.ok) return NextResponse.json({ error: "Erreur Mapbox" }, { status: 502 });
      return NextResponse.json(await res.json());
    }

    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  } catch (error) {
    await logActivity("erreur", "Échec proxy Mapbox", undefined, { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
