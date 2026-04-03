import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getIP } from "@/lib/rateLimit";

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN ?? "";
const MAPBOX_BASE = "https://api.mapbox.com";

// Proxy Mapbox Matrix API (distances multi-destinations)
export async function POST(request: NextRequest) {
  if (!rateLimit(getIP(request))) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { type, coords, origin, destination } = await request.json();

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
