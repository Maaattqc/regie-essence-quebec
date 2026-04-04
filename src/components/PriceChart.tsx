"use client";

import { memo, useEffect, useMemo, useState } from "react";

interface PricePoint {
  price: number;
  snapshot_date: string;
}

const W = 280;
const H = 50;
const PAD = 4;

export default memo(function PriceChart({
  stationName,
  address,
  gasType,
}: {
  stationName: string;
  address: string;
  gasType: string;
}) {
  const [data, setData] = useState<PricePoint[] | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    fetch(
      `/api/history?station=${encodeURIComponent(stationName)}&address=${encodeURIComponent(address)}&type=${encodeURIComponent(gasType)}&days=30`
    )
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData([]));
  }, [stationName, address, gasType]);

  const { points, min, max } = useMemo(() => {
    if (!data || data.length < 2) return { points: "", min: 0, max: 0 };
    const prices = data.map((d) => d.price);
    const lo = Math.min(...prices);
    const hi = Math.max(...prices);
    const range = hi - lo || 1;
    const pts = data
      .map((d, i) => {
        const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
        const y = H - PAD - ((d.price - lo) / range) * (H - PAD * 2);
        return `${x},${y}`;
      })
      .join(" ");
    return { points: pts, min: lo, max: hi };
  }, [data]);

  if (data === null)
    return <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Chargement...</div>;
  if (data.length < 2)
    return <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Pas assez de données</div>;

  const hoverData = hover !== null ? data[hover] : null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>
        <span>{data[0].snapshot_date}</span>
        <span>{data[data.length - 1].snapshot_date}</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const idx = Math.round((x / rect.width) * (data.length - 1));
          setHover(Math.max(0, Math.min(data.length - 1, idx)));
        }}
        onMouseLeave={() => setHover(null)}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          const rect = e.currentTarget.getBoundingClientRect();
          const x = touch.clientX - rect.left;
          const idx = Math.round((x / rect.width) * (data.length - 1));
          setHover(Math.max(0, Math.min(data.length - 1, idx)));
        }}
        onTouchEnd={() => setHover(null)}
        style={{ cursor: "crosshair", touchAction: "none" }}
      >
        <polyline
          points={points}
          fill="none"
          stroke="#4285f4"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {hover !== null && (
          <circle
            cx={PAD + (hover / (data.length - 1)) * (W - PAD * 2)}
            cy={H - PAD - ((data[hover].price - min) / (max - min || 1)) * (H - PAD * 2)}
            r={3}
            fill="#4285f4"
          />
        )}
      </svg>
      {hoverData && (
        <div style={{ fontSize: 11, textAlign: "center", color: "var(--text)" }}>
          {hoverData.snapshot_date} — <strong>{hoverData.price}¢</strong>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)" }}>
        <span>Min: {min}¢</span>
        <span>Max: {max}¢</span>
      </div>
    </div>
  );
});
