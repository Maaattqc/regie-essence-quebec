"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface PricePoint {
  price: number;
  snapshot_date: string;
}

export default function PriceChart({
  stationName,
  address,
  gasType,
}: {
  stationName: string;
  address: string;
  gasType: string;
}) {
  const [data, setData] = useState<PricePoint[] | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({
      station: stationName,
      address,
      type: gasType,
      days: "30",
    });
    fetch(`/api/history?${params}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData([]));
  }, [stationName, address, gasType]);

  if (data === null) return <div style={{ fontSize: 11, color: "#999" }}>Chargement...</div>;
  if (data.length < 2) return <div style={{ fontSize: 11, color: "#999" }}>Pas assez de données</div>;

  return (
    <div style={{ width: "100%", height: 60 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <YAxis domain={["dataMin - 2", "dataMax + 2"]} hide />
          <Tooltip
            formatter={(v) => [`${v}¢`, "Prix"]}
            labelFormatter={(l) => String(l)}
            contentStyle={{ fontSize: 11 }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#4285f4"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
