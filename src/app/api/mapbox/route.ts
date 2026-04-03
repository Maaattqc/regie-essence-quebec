import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getIP } from "@/lib/rateLimit";
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
  if (!rateLimit(getIP(request))) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }
  const { type, ...rest } = parsed.data;
  const coords = "coords" in rest ? rest.coords : undefined;
  const origin = "origin" in rest ? rest.origin : undefined;
  const destination = "destination" in rest ? rest.destination : undefined;

  try {
    if (type === "matrix") {
      const res = await fetch(
        `${MAPBOX_BASE}/directions-matrix/v1/mapbox/driving/${coords}?sources=0&annotations=distance,duration&access_token=${MAPBOX_TOKEN}`,
      );
      if (!res.ok) return NextResponse.json({ error: "Erreur Mapbox" }, { status: 502 });
      return NextResponse.json(await res.json());
    }

    if (type === "directions") {
      const c = `${origin[1]},${origin[0]};${destination[1]},${destination[0]}`;
      const res = await fetch(
        `${MAPBOX_BASE}/directions/v5/mapbox/driving-traffic/${c}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`,
      );
      if (!res.ok) return NextResponse.json({ error: "Erreur Mapbox" }, { status: 502 });
      return NextResponse.json(await res.json());
    }

    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
