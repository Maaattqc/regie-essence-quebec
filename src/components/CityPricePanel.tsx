"use client";

import { memo, useMemo, useState } from "react";
import type { Feature, Point } from "geojson";
import { AnimatePresence, motion } from "framer-motion";
import { X, TrendingDown, TrendingUp, Minus, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type StationProperties,
  type GasTypeKey,
  GAS_TYPES,
  getPriceColor,
  normalize,
  parsePrice,
} from "@/lib/stations";

type SortKey = "price-asc" | "price-desc" | "name-asc" | "name-desc" | "delta-asc" | "delta-desc" | "count-desc";

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "price-asc", label: "Prix ↑" },
  { value: "price-desc", label: "Prix ↓" },
  { value: "name-asc", label: "Ville A→Z" },
  { value: "name-desc", label: "Ville Z→A" },
  { value: "delta-asc", label: "Moins cher vs moy." },
  { value: "delta-desc", label: "Plus cher vs moy." },
  { value: "count-desc", label: "Nb stations ↓" },
];

const CityPricePanel = memo(function CityPricePanel({
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
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("price-asc");
  const [activeType, setActiveType] = useState<GasTypeKey>(mapGasType);
  const [regionFilter, setRegionFilter] = useState("");

  const { cityStats, provAvg, regions } = useMemo(() => {
    const map: Record<string, { city: string; region: string; total: number; count: number; min: number; max: number }> = {};
    const regionSet = new Set<string>();

    data.features.forEach((feature) => {
      const props = (feature as Feature<Point, StationProperties>).properties;
      const city = props._city;
      const price = props.Prices.find((pr) => pr.GasType === activeType && pr.IsAvailable);
      if (!city || !price) return;
      regionSet.add(props.Region);
      const v = parsePrice(price.Price);
      const key = `${city}||${props.Region}`;
      if (!map[key]) map[key] = { city, region: props.Region, total: 0, count: 0, min: Infinity, max: -Infinity };
      map[key].total += v;
      map[key].count++;
      if (v < map[key].min) map[key].min = v;
      if (v > map[key].max) map[key].max = v;
    });

    const entries = Object.values(map).filter((e) => e.count > 0).map((e) => ({
      ...e,
      avg: e.total / e.count,
      searchKey: normalize(`${e.city} ${e.region}`),
    }));

    const provTotal = entries.reduce((s, e) => s + e.avg * e.count, 0);
    const provCount = entries.reduce((s, e) => s + e.count, 0);
    const provAvg = provCount > 0 ? provTotal / provCount : 0;
    const absMin = entries.length ? Math.min(...entries.map((e) => e.avg)) : 0;
    const absMax = entries.length ? Math.max(...entries.map((e) => e.avg)) : 0;

    return {
      cityStats: entries.map((e) => ({
        ...e,
        delta: e.avg - provAvg,
        color: getPriceColor(e.avg, absMin, absMax),
        barPct: absMax === absMin ? 50 : ((e.avg - absMin) / (absMax - absMin)) * 100,
      })),
      provAvg,
      regions: [...regionSet].sort((a, b) => a.localeCompare(b, "fr")),
    };
  }, [data, activeType]);

  const displayed = useMemo(() => {
    const q = normalize(query.trim());
    let list = q ? cityStats.filter((e) => e.searchKey.includes(q)) : cityStats;
    if (regionFilter) list = list.filter((e) => e.region === regionFilter);

    const sorted = [...list];
    switch (sortBy) {
      case "price-desc": sorted.sort((a, b) => b.avg - a.avg); break;
      case "name-asc": sorted.sort((a, b) => a.city.localeCompare(b.city, "fr")); break;
      case "name-desc": sorted.sort((a, b) => b.city.localeCompare(a.city, "fr")); break;
      case "delta-asc": sorted.sort((a, b) => a.delta - b.delta); break;
      case "delta-desc": sorted.sort((a, b) => b.delta - a.delta); break;
      case "count-desc": sorted.sort((a, b) => b.count - a.count); break;
      default: sorted.sort((a, b) => a.avg - b.avg);
    }
    return sorted;
  }, [cityStats, query, sortBy, regionFilter]);

  const typeColor = GAS_TYPES.find((t) => t.key === activeType)?.color ?? "#003DA5";
  const cheapest = [...cityStats].sort((a, b) => a.avg - b.avg).slice(0, 3);

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
            className="panel w-full max-w-[600px] max-h-[85vh] flex flex-col"
            style={{ position: "relative" }}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.18 }}
          >
            {/* Header */}
            <div className="mb-3 flex items-start justify-between gap-2 shrink-0">
              <div>
                <div className="text-[15px] font-bold">Prix par ville</div>
                <div className="text-[11px] text-[var(--text-muted)]">{displayed.length} / {cityStats.length} ville{cityStats.length > 1 ? "s" : ""}</div>
              </div>
              <Button variant="ghost" size="icon-xs" onClick={onClose}><X className="size-3.5" /></Button>
            </div>

            {/* Gas type tabs */}
            <div className="flex gap-1 mb-3 p-0.5 bg-[var(--bg-hover)] rounded-lg shrink-0">
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

            {/* Summary */}
            {provAvg > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-3 shrink-0">
                <div className="rounded-lg border border-[var(--divider)] p-2.5">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-1">Moyenne provinciale</div>
                  <div className="text-[18px] font-bold" style={{ color: typeColor }}>{provAvg.toFixed(1)}¢/L</div>
                  <div className="text-[11px] text-[var(--text-muted)]">{cityStats.reduce((s, e) => s + e.count, 0)} stations · {cityStats.length} villes</div>
                </div>
                <div className="rounded-lg border border-[var(--divider)] p-2.5">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-1">Top 3 moins chères</div>
                  {cheapest.map((e) => (
                    <div key={`${e.city}-${e.region}`} className="flex justify-between text-[12px]">
                      <span className="truncate text-[var(--text-secondary)]">{e.city}</span>
                      <span className="font-semibold text-green-600 dark:text-green-400 shrink-0 ml-2">{e.avg.toFixed(1)}¢</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="mb-3 flex flex-col gap-2 sm:flex-row shrink-0">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher une ville..."
                className="h-7 text-[12px] max-w-[140px]"
              />
              <select
                className="h-9 rounded-md border border-[var(--divider)] bg-[var(--bg-input)] px-2 text-[13px] font-medium text-[var(--text)] flex-1"
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
              >
                <option value="">Toutes les régions</option>
                {regions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <div className="flex items-center gap-1.5 shrink-0">
                <ArrowUpDown className="size-3.5 text-[var(--text-muted)]" />
                <select
                  className="h-8 rounded-md border border-[var(--divider)] bg-[var(--bg-input)] px-2 text-[13px] text-[var(--text)]"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                >
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 flex flex-col gap-1 pr-0.5">
              {displayed.length === 0 ? (
                <div className="py-8 text-center text-[13px] text-[var(--text-muted)]">Aucune ville trouvée.</div>
              ) : displayed.map(({ city, region, count, avg, min, max, delta, color, barPct }) => (
                <div key={`${city}-${region}`} className="rounded-lg border border-[var(--divider)] px-3 py-2 hover:bg-[var(--bg-hover)] transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                      <span className="text-[13px] font-semibold truncate">{city}</span>
                      <span className="text-[11px] text-[var(--text-muted)] truncate hidden sm:block">{region}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[13px] font-bold" style={{ color }}>{avg.toFixed(1)}¢</span>
                      <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${delta < -0.5 ? "text-green-600 dark:text-green-400" : delta > 0.5 ? "text-red-500" : "text-[var(--text-muted)]"}`}>
                        {delta < -0.5 ? <TrendingDown className="size-3" /> : delta > 0.5 ? <TrendingUp className="size-3" /> : <Minus className="size-3" />}
                        {delta > 0 ? "+" : ""}{delta.toFixed(1)}¢
                      </span>
                    </div>
                  </div>
                  <div className="h-1 bg-[var(--bg-hover)] rounded-full mb-1.5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${barPct}%`, background: color }} />
                  </div>
                  <div className="flex gap-3 text-[11px] text-[var(--text-muted)]">
                    <span>{count} station{count > 1 ? "s" : ""}</span>
                    <span>Min <strong className="text-green-600 dark:text-green-400">{min.toFixed(1)}¢</strong></span>
                    <span>Max <strong className="text-red-500">{max.toFixed(1)}¢</strong></span>
                    {min !== max && <span>Écart <strong>{(max - min).toFixed(1)}¢</strong></span>}
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

export default CityPricePanel;
