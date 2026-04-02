"use client";

import { memo, useMemo, useState } from "react";
import type { Feature, Point } from "geojson";
import { AnimatePresence, motion } from "framer-motion";
import { X, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type StationProperties,
  type GasTypeKey,
  GAS_TYPES,
  parsePrice,
  getPriceColor,
} from "@/lib/stations";

const RegionPricePanel = memo(function RegionPricePanel({
  data,
  gasType: mapGasType,
  visible,
  onClose,
}: {
  data: GeoJSON.FeatureCollection;
  gasType: GasTypeKey;
  visible: boolean;
  onClose: () => void;
}) {
  const [activeType, setActiveType] = useState<GasTypeKey>(mapGasType);

  const stats = useMemo(() => {
    const map: Record<string, { total: number; count: number; min: number; max: number }> = {};

    data.features.forEach((f) => {
      const props = (f as Feature<Point, StationProperties>).properties;
      const price = props.Prices.find((pr) => pr.GasType === activeType && pr.IsAvailable);
      if (!price) return;
      const v = parsePrice(price.Price);
      if (!map[props.Region]) map[props.Region] = { total: 0, count: 0, min: Infinity, max: -Infinity };
      map[props.Region].total += v;
      map[props.Region].count++;
      if (v < map[props.Region].min) map[props.Region].min = v;
      if (v > map[props.Region].max) map[props.Region].max = v;
    });

    const entries = Object.entries(map)
      .filter(([, s]) => s.count > 0)
      .map(([region, s]) => ({
        region,
        avg: s.total / s.count,
        min: s.min,
        max: s.max,
        count: s.count,
      }))
      .sort((a, b) => a.avg - b.avg);

    if (!entries.length) return { entries: [], provAvg: 0, absMin: 0, absMax: 0 };

    const provTotal = entries.reduce((s, e) => s + e.avg * e.count, 0);
    const provCount = entries.reduce((s, e) => s + e.count, 0);
    const provAvg = provTotal / provCount;
    const absMin = entries[0].avg;
    const absMax = entries[entries.length - 1].avg;

    return {
      entries: entries.map((e, i) => ({
        ...e,
        rank: i + 1,
        delta: e.avg - provAvg,
        color: getPriceColor(e.avg, absMin, absMax),
        barPct: absMax === absMin ? 50 : ((e.avg - absMin) / (absMax - absMin)) * 100,
      })),
      provAvg,
      absMin,
      absMax,
    };
  }, [data, activeType]);

  const typeColor = GAS_TYPES.find((t) => t.key === activeType)?.color ?? "#003DA5";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <button type="button" aria-label="Fermer" className="absolute inset-0 bg-black/25" onClick={onClose} />
          <motion.div
            className="panel w-full max-w-[480px] max-h-[82vh] overflow-y-auto"
            style={{ position: "relative" }}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.18 }}
          >
            {/* Header */}
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <div className="text-[15px] font-bold">Prix par région</div>
                <div className="text-[11px] text-[var(--text-muted)]">{stats.entries.length} régions · {stats.entries.reduce((s, e) => s + e.count, 0)} stations</div>
              </div>
              <Button variant="ghost" size="icon-xs" onClick={onClose}><X className="size-3.5" /></Button>
            </div>

            {/* Gas type tabs */}
            <div className="flex gap-1 mb-4 p-0.5 bg-[var(--bg-hover)] rounded-lg">
              {GAS_TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveType(t.key)}
                  className="flex-1 py-1 px-2 rounded-md text-[12px] font-semibold transition-all"
                  style={activeType === t.key
                    ? { background: t.color, color: "#fff" }
                    : { background: "transparent", color: "var(--text-secondary)" }
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Summary cards */}
            {stats.provAvg > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="rounded-lg border border-[var(--divider)] p-2.5 text-center">
                  <div className="text-[10px] text-[var(--text-muted)] mb-0.5 uppercase tracking-wide">Moy. provinciale</div>
                  <div className="text-[16px] font-bold" style={{ color: typeColor }}>{stats.provAvg.toFixed(1)}¢</div>
                </div>
                <div className="rounded-lg border border-[var(--divider)] bg-green-50 dark:bg-green-950/30 p-2.5 text-center">
                  <div className="text-[10px] text-[var(--text-muted)] mb-0.5 uppercase tracking-wide">La moins chère</div>
                  <div className="text-[13px] font-bold text-green-700 dark:text-green-400">{stats.absMin.toFixed(1)}¢</div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate">{stats.entries[0]?.region}</div>
                </div>
                <div className="rounded-lg border border-[var(--divider)] bg-red-50 dark:bg-red-950/30 p-2.5 text-center">
                  <div className="text-[10px] text-[var(--text-muted)] mb-0.5 uppercase tracking-wide">La plus chère</div>
                  <div className="text-[13px] font-bold text-red-600 dark:text-red-400">{stats.absMax.toFixed(1)}¢</div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate">{stats.entries[stats.entries.length - 1]?.region}</div>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="flex flex-col gap-1">
              {stats.entries.map(({ region, avg, min, max, count, rank, delta, color, barPct }) => (
                <div key={region} className="rounded-lg border border-[var(--divider)] px-3 py-2 hover:bg-[var(--bg-hover)] transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] text-[var(--text-muted)] font-mono w-4 shrink-0">#{rank}</span>
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                      <span className="text-[13px] font-semibold truncate">{region}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[12px] font-bold" style={{ color }}>{avg.toFixed(1)}¢</span>
                      <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${delta < -0.5 ? "text-green-600 dark:text-green-400" : delta > 0.5 ? "text-red-500" : "text-[var(--text-muted)]"}`}>
                        {delta < -0.5 ? <TrendingDown className="size-3" /> : delta > 0.5 ? <TrendingUp className="size-3" /> : <Minus className="size-3" />}
                        {delta > 0 ? "+" : ""}{delta.toFixed(1)}¢
                      </span>
                    </div>
                  </div>
                  {/* Bar */}
                  <div className="h-1.5 bg-[var(--bg-hover)] rounded-full mb-1.5 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${barPct}%`, background: color }} />
                  </div>
                  {/* Sub-stats */}
                  <div className="flex gap-3 text-[11px] text-[var(--text-muted)]">
                    <span>{count} station{count > 1 ? "s" : ""}</span>
                    <span>Min <strong className="text-green-600 dark:text-green-400">{min.toFixed(1)}¢</strong></span>
                    <span>Max <strong className="text-red-500">{max.toFixed(1)}¢</strong></span>
                    <span>Écart <strong>{(max - min).toFixed(1)}¢</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default RegionPricePanel;
