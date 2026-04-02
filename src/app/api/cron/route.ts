import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit, getIP } from "@/lib/rateLimit";

const STATIONS_URL = "https://regieessencequebec.ca/stations.geojson.gz";

interface StationPrice {
  GasType: string;
  Price: string;
  IsAvailable: boolean;
}

interface StationFeature {
  properties: {
    Name: string;
    Address: string;
    Prices: StationPrice[];
  };
}

export async function GET(request: Request) {
  if (!rateLimit(getIP(request))) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }
  // Verify cron secret in production
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(STATIONS_URL);
  const geojson = await res.json();

  const rows: {
    station_name: string;
    address: string;
    gas_type: string;
    price: number;
  }[] = [];

  geojson.features.forEach((f: StationFeature) => {
    const { Name, Address, Prices } = f.properties;
    Prices.forEach((p) => {
      if (!p.IsAvailable) return;
      const price = parseFloat(p.Price.replace("\u00A2", ""));
      if (isNaN(price)) return;
      rows.push({
        station_name: Name,
        address: Address,
        gas_type: p.GasType,
        price,
      });
    });
  });

  // Upsert in batches of 500
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await supabaseAdmin
      .from("price_snapshots")
      .upsert(batch, {
        onConflict: "station_name,address,gas_type,snapshot_date",
      });
    if (error) {
      return NextResponse.json({ error: error.message, inserted }, { status: 500 });
    }
    inserted += batch.length;
  }

  return NextResponse.json({ ok: true, inserted, date: new Date().toISOString() });
}
