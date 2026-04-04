import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getIP } from "@/lib/rateLimit";
import { logActivity } from "@/lib/activity-log";
import { z } from "zod";

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN ?? "";
const MAPBOX_BASE = "https://api.mapbox.com";

const bodySchema = z.union([
  z.object({ type: z.literal("matrix"), coords: z.string().max(2000) }),
  z.object({
    type: z.literal("directions"),
    origin: z.tuple([z.number(), z.number()]),
    destination: z.tuple([z.number(), z.number()]),
  }),
]);

// Proxy Mapbox Matrix API (distances multi-destinations)
export async function POST(request: NextRequest) {
  if (!(await rateLimit(getIP(request)))) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }
  const body = parsed.data;

  try {
    if (body.type === "matrix") {
      const res = await fetch(
        `${MAPBOX_BASE}/directions-matrix/v1/mapbox/driving/${body.coords}?sources=0&annotations=distance,duration&access_token=${MAPBOX_TOKEN}`,
      );
      if (!res.ok) return NextResponse.json({ error: "Erreur Mapbox" }, { status: 502 });
      return NextResponse.json(await res.json());
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
    console.error("[mapbox] Échec proxy Mapbox:", error);
    await logActivity("erreur", "Échec proxy Mapbox", undefined, { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
