"use client";

import { memo, useMemo, useState, useCallback, type ReactNode } from "react";
import type { Feature, Point } from "geojson";
import { AnimatePresence, motion } from "framer-motion";
import { X, TrendingDown, TrendingUp, Minus, ArrowUpDown, Search, SlidersHorizontal, GitCompareArrows, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  type StationProperties,
  type GasTypeKey,
  GAS_TYPES,
  parsePrice,
  getPriceColor,
  normalize,
} from "@/lib/stations";

type ViewMode = "region" | "city" | "compare";
type SortKey = "price-asc" | "price-desc" | "name-asc" | "name-desc" | "delta-asc" | "delta-desc" | "count-desc";

const DeltaBadge = memo(function DeltaBadge({ delta }: { delta: number }) {
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${delta < -0.5 ? "text-green-600 dark:text-green-400" : delta > 0.5 ? "text-red-500" : "text-[var(--text-muted)]"}`}>
      {delta < -0.5 ? <TrendingDown className="size-3" /> : delta > 0.5 ? <TrendingUp className="size-3" /> : <Minus className="size-3" />}
      {delta > 0 ? "+" : ""}{delta.toFixed(1)}¢
    </span>
  );
});

const PriceRow = memo(function PriceRow({ entry, rank, activeType, provAvg, absMin, absMax, isSelected, onToggle }: {
  entry: MultiTypeEntry;
  rank?: number;
  activeType: GasTypeKey;
  provAvg: number;
  absMin: number;
  absMax: number;
  isSelected: boolean;
  onToggle: (key: string) => void;
}) {
  const { t } = useLanguage();
  const p = entry.prices[activeType];
  if (!p) return null as ReactNode;
  const delta = p.avg - provAvg;
  const color = getPriceColor(p.avg, absMin, absMax);
  const barPct = absMax === absMin ? 50 : ((p.avg - absMin) / (absMax - absMin)) * 100;
  const key = entry.region ? `${entry.name}||${entry.region}` : entry.name;

  return (
    <div
      className={`rounded-lg border px-3 py-2 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer ${isSelected ? "border-[#457b9d] bg-[#457b9d]/5" : "border-[var(--divider)]"}`}
      onClick={() => onToggle(key)}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          {rank != null && <span className="text-[11px] text-[var(--text-muted)] font-mono w-4 shrink-0">#{rank}</span>}
          <span className="w-2.5 h-2.5 rounded-full shrink-0 relative" style={{ background: color }}>
            {isSelected && <Check className="size-2.5 text-white absolute inset-0" />}
          </span>
          <span className="text-[13px] font-semibold truncate">{entry.name}</span>
          {entry.region && <span className="text-[11px] text-[var(--text-muted)] truncate hidden sm:block">{entry.region}</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[12px] font-bold" style={{ color }}>{p.avg.toFixed(1)}¢</span>
          <DeltaBadge delta={delta} />
        </div>
      </div>
      <div className="flex gap-2 mb-1.5">
        {GAS_TYPES.map((gt) => {
          const gp = entry.prices[gt.key];
          return (
            <div key={gt.key} className="flex items-center gap-1 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: gt.color }} />
              <span className="text-[var(--text-muted)]">{gt.label.slice(0, 3)}</span>
              <span className="font-semibold" style={{ color: gp ? gt.color : "var(--text-muted)" }}>
                {gp ? `${gp.avg.toFixed(1)}¢` : "—"}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-1.5 bg-[var(--bg-hover)] rounded-full mb-1.5 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${barPct}%`, background: color }} />
      </div>
      <div className="flex gap-3 text-[11px] text-[var(--text-muted)]">
        <span>{entry.count} {t.pricePanel.station(entry.count)}</span>
        <span>{t.pricePanel.min} <strong className="text-green-600 dark:text-green-400">{p.min.toFixed(1)}¢</strong></span>
        <span>{t.pricePanel.max} <strong className="text-red-500">{p.max.toFixed(1)}¢</strong></span>
        {p.min !== p.max && <span>{t.pricePanel.gap} <strong>{(p.max - p.min).toFixed(1)}¢</strong></span>}
      </div>
    </div>
  );
});

// SORT_OPTIONS is now built dynamically inside PricePanel using t translations

export type MultiTypeEntry = {
  name: string;
  region?: string;
  count: number;
  searchKey: string;
  prices: Record<GasTypeKey, { avg: number; min: number; max: number; count: number } | null>;
};

export function computeMultiType(data: GeoJSON.FeatureCollection, mode: "region" | "city"): { entries: MultiTypeEntry[]; regions: string[] } {
  const map: Record<string, { name: string; region?: string; byType: Record<string, { total: number; count: number; min: number; max: number }> }> = {};
  const regionSet = new Set<string>();

  data.features.forEach((f) => {
    const props = (f as Feature<Point, StationProperties>).properties;
    const key = mode === "region" ? props.Region : `${props._city}||${props.Region}`;
    const name = mode === "region" ? props.Region : props._city;
    if (!name) return;
    regionSet.add(props.Region);

    if (!map[key]) map[key] = { name, region: mode === "city" ? props.Region : undefined, byType: {} };

    for (const pr of props.Prices) {
      if (!pr.IsAvailable) continue;
      const v = parsePrice(pr.Price);
      if (!map[key].byType[pr.GasType]) map[key].byType[pr.GasType] = { total: 0, count: 0, min: Infinity, max: -Infinity };
      const t = map[key].byType[pr.GasType];
      t.total += v;
      t.count++;
      if (v < t.min) t.min = v;
      if (v > t.max) t.max = v;
    }
  });

  const entries: MultiTypeEntry[] = Object.values(map).map((e) => {
    const prices: MultiTypeEntry["prices"] = {} as MultiTypeEntry["prices"];
    let totalCount = 0;
    for (const gt of GAS_TYPES) {
      const t = e.byType[gt.key];
      if (t && t.count > 0) {
        prices[gt.key] = { avg: t.total / t.count, min: t.min, max: t.max, count: t.count };
        totalCount = Math.max(totalCount, t.count);
      } else {
        prices[gt.key] = null;
      }
    }
    return {
      name: e.name,
      region: e.region,
      count: totalCount,
      searchKey: normalize(`${e.name} ${e.region ?? ""}`),
      prices,
    };
  });

  return { entries, regions: [...regionSet].sort((a, b) => a.localeCompare(b, "fr")) };
}

const PricePanel = memo(function PricePanel({
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
  const { t } = useLanguage();
  const [view, setView] = useState<ViewMode>("region");
  const [activeType, setActiveType] = useState<GasTypeKey>(mapGasType);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("price-asc");
  const [regionFilter, setRegionFilter] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 300]);
  const [showFilters, setShowFilters] = useState(false);
  const [compareSet, setCompareSet] = useState<Set<string>>(new Set());

  const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
    { value: "price-asc", label: t.pricePanel.sortPriceAsc },
    { value: "price-desc", label: t.pricePanel.sortPriceDesc },
    { value: "name-asc", label: t.pricePanel.sortNameAZ },
    { value: "name-desc", label: t.pricePanel.sortNameZA },
    { value: "delta-asc", label: t.pricePanel.sortCheapestVsAvg },
    { value: "delta-desc", label: t.pricePanel.sortExpensiveVsAvg },
    { value: "count-desc", label: t.pricePanel.sortStations },
  ];

  const toggleCompare = useCallback((key: string) => {
    setCompareSet((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // ── Multi-type data ──
  const regionData = useMemo(() => computeMultiType(data, "region"), [data]);
  const cityData = useMemo(() => computeMultiType(data, "city"), [data]);

  // ── Provincial averages per type ──
  const provAvgs = useMemo(() => {
    const result: Record<GasTypeKey, number> = {} as Record<GasTypeKey, number>;
    for (const gt of GAS_TYPES) {
      const entries = regionData.entries.filter((e) => e.prices[gt.key]);
      const total = entries.reduce((s, e) => s + (e.prices[gt.key]?.avg ?? 0) * (e.prices[gt.key]?.count ?? 0), 0);
      const count = entries.reduce((s, e) => s + (e.prices[gt.key]?.count ?? 0), 0);
      result[gt.key] = count > 0 ? total / count : 0;
    }
    return result;
  }, [regionData]);

  // ── Global min/max for active type (for color scale) ──
  const sourceEntries = view === "city" ? cityData.entries : regionData.entries;
  const allAvgs = sourceEntries.map((e) => e.prices[activeType]?.avg).filter((v): v is number => v != null);
  const absMin = allAvgs.length ? Math.min(...allAvgs) : 0;
  const absMax = allAvgs.length ? Math.max(...allAvgs) : 0;

  // ── Filtered + sorted list ──
  const displayed = useMemo(() => {
    const src = view === "city" ? cityData.entries : regionData.entries;
    const q = normalize(query.trim());

    const list = src.filter((e) => {
      const p = e.prices[activeType];
      if (!p) return false;
      if (q && !e.searchKey.includes(q)) return false;
      if (view === "city" && regionFilter && e.region !== regionFilter) return false;
      if (p.avg < priceRange[0] || p.avg > priceRange[1]) return false;
      return true;
    });

    const sorted = [...list];
    const provAvg = provAvgs[activeType];
    switch (sortBy) {
      case "price-desc": sorted.sort((a, b) => (b.prices[activeType]?.avg ?? 0) - (a.prices[activeType]?.avg ?? 0)); break;
      case "name-asc": sorted.sort((a, b) => a.name.localeCompare(b.name, "fr")); break;
      case "name-desc": sorted.sort((a, b) => b.name.localeCompare(a.name, "fr")); break;
      case "delta-asc": sorted.sort((a, b) => ((a.prices[activeType]?.avg ?? 0) - provAvg) - ((b.prices[activeType]?.avg ?? 0) - provAvg)); break;
      case "delta-desc": sorted.sort((a, b) => ((b.prices[activeType]?.avg ?? 0) - provAvg) - ((a.prices[activeType]?.avg ?? 0) - provAvg)); break;
      case "count-desc": sorted.sort((a, b) => b.count - a.count); break;
      default: sorted.sort((a, b) => (a.prices[activeType]?.avg ?? 0) - (b.prices[activeType]?.avg ?? 0));
    }
    return sorted;
  }, [view, cityData, regionData, query, regionFilter, sortBy, activeType, priceRange, provAvgs]);

  // ── Compare items ──
  const compareItems = useMemo(() => {
    const src = [...regionData.entries, ...cityData.entries];
    return src.filter((e) => compareSet.has(e.region ? `${e.name}||${e.region}` : e.name));
  }, [compareSet, regionData, cityData]);

  const provAvg = provAvgs[activeType];
  const regions = view === "city" ? cityData.regions : regionData.regions;
  const totalEntries = view === "city" ? cityData.entries.length : regionData.entries.length;

  // ── Update price range when data changes ──
  const effectiveMin = Math.floor(absMin);
  const effectiveMax = Math.ceil(absMax);

  function entryKey(e: MultiTypeEntry) {
    return e.region ? `${e.name}||${e.region}` : e.name;
  }

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
            className="panel w-full max-w-[620px] max-h-[88vh] flex flex-col"
            style={{ position: "relative" }}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.18 }}
          >
            {/* Header */}
            <div className="mb-3 flex items-start justify-between gap-2 shrink-0">
              <div>
                <div className="text-[15px] font-bold">{t.pricePanel.title}</div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  {view === "compare"
                    ? t.pricePanel.selected(compareItems.length)
                    : view === "region"
                      ? t.pricePanel.displayedRegions(displayed.length, totalEntries)
                      : t.pricePanel.displayedCities(displayed.length, totalEntries)
                  }
                </div>
              </div>
              <Button variant="ghost" size="icon-xs" onClick={onClose}><X className="size-3.5" /></Button>
            </div>

            {/* View toggle */}
            <div className="flex gap-1 mb-3 p-0.5 bg-[var(--bg-hover)] rounded-lg shrink-0">
              {([["region", t.pricePanel.byRegion], ["city", t.pricePanel.byCity], ["compare", t.pricePanel.compare(compareSet.size)]] as const).map(([v, label]) => (
                <button
                  key={v}
                  className={`flex-1 py-1.5 px-2 rounded-md text-[12px] font-semibold transition-all ${view === v ? "bg-[#457b9d] text-white" : "text-[var(--text-secondary)] bg-transparent"}`}
                  onClick={() => setView(v)}
                >
                  {v === "compare" && <GitCompareArrows className="size-3 inline mr-1" />}
                  {label}
                </button>
              ))}
            </div>

            {/* Provincial averages — all 3 types */}
            <div className="flex gap-2 mb-3 shrink-0">
              {GAS_TYPES.map((gt) => (
                <div
                  key={gt.key}
                  className={`flex-1 rounded-lg border p-2 text-center cursor-pointer transition-all ${activeType === gt.key ? "border-2" : "border-[var(--divider)]"}`}
                  style={activeType === gt.key ? { borderColor: gt.color } : undefined}
                  onClick={() => setActiveType(gt.key)}
                >
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">{t.gasTypes[gt.key]}</div>
                  <div className="text-[15px] font-bold" style={{ color: gt.color }}>{provAvgs[gt.key].toFixed(1)}¢</div>
                </div>
              ))}
            </div>

            {/* Search + Filters */}
            {view !== "compare" && (
              <div className="mb-3 flex flex-col gap-2 shrink-0">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-[var(--text-muted)]" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={view === "region" ? t.pricePanel.searchRegion : t.pricePanel.searchCity}
                      className="h-8 text-[13px] pl-7"
                      autoComplete="off"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-8 px-2 ${showFilters ? "!bg-[#457b9d] !text-white" : ""}`}
                    onClick={() => setShowFilters((v) => !v)}
                  >
                    <SlidersHorizontal className="size-3.5" />
                  </Button>
                </div>
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden flex flex-col gap-2"
                    >
                      {view === "city" && (
                        <select
                          className="h-8 rounded-md border border-[var(--divider)] bg-[var(--bg-input)] px-2 text-[13px] text-[var(--text)]"
                          value={regionFilter}
                          onChange={(e) => setRegionFilter(e.target.value)}
                        >
                          <option value="">{t.pricePanel.allRegions}</option>
                          {regions.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      )}
                      <div>
                        <div className="text-[11px] text-[var(--text-muted)] mb-1">
                          {t.pricePanel.priceRange(Number(priceRange[0].toFixed(0)), Number(priceRange[1].toFixed(0)))}
                        </div>
                        <Slider
                          min={effectiveMin}
                          max={effectiveMax}
                          step={1}
                          value={priceRange}
                          onValueChange={(v) => setPriceRange(v as [number, number])}
                          className="w-full"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ArrowUpDown className="size-3.5 text-[var(--text-muted)]" />
                        <select
                          className="h-8 flex-1 rounded-md border border-[var(--divider)] bg-[var(--bg-input)] px-2 text-[13px] text-[var(--text)]"
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as SortKey)}
                        >
                          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* List / Compare */}
            <div className="overflow-y-auto flex-1 flex flex-col gap-1 pr-0.5">
              {view === "compare" ? (
                compareItems.length === 0 ? (
                  <div className="py-8 text-center text-[13px] text-[var(--text-muted)]">
                    {t.pricePanel.clickToCompare}
                  </div>
                ) : (
                  <>
                    {/* Compare table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-[12px]">
                        <thead>
                          <tr className="border-b border-[var(--divider)]">
                            <th className="text-left py-2 px-2 font-semibold text-[var(--text-muted)]">{t.pricePanel.location}</th>
                            {GAS_TYPES.map((gt) => (
                              <th key={gt.key} className="text-center py-2 px-2 font-semibold" style={{ color: gt.color }}>{gt.label}</th>
                            ))}
                            <th className="text-center py-2 px-2 font-semibold text-[var(--text-muted)]">{t.pricePanel.stations}</th>
                            <th className="w-8" />
                          </tr>
                        </thead>
                        <tbody>
                          {compareItems.map((entry) => {
                            const key = entryKey(entry);
                            return (
                              <tr key={key} className="border-b border-[var(--divider)] hover:bg-[var(--bg-hover)]">
                                <td className="py-2 px-2 font-semibold">
                                  {entry.name}
                                  {entry.region && <span className="text-[10px] text-[var(--text-muted)] ml-1">{entry.region}</span>}
                                </td>
                                {GAS_TYPES.map((gt) => {
                                  const p = entry.prices[gt.key];
                                  return (
                                    <td key={gt.key} className="text-center py-2 px-2">
                                      {p ? (
                                        <div>
                                          <div className="font-bold" style={{ color: gt.color }}>{p.avg.toFixed(1)}¢</div>
                                          <div className="text-[10px] text-[var(--text-muted)]">{p.min.toFixed(1)} - {p.max.toFixed(1)}</div>
                                        </div>
                                      ) : (
                                        <span className="text-[var(--text-muted)]">—</span>
                                      )}
                                    </td>
                                  );
                                })}
                                <td className="text-center py-2 px-2 text-[var(--text-muted)]">{entry.count}</td>
                                <td className="py-2 px-1">
                                  <button onClick={() => toggleCompare(key)} className="text-red-400 hover:text-red-600">
                                    <X className="size-3" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {/* Cheapest highlight */}
                    {compareItems.length >= 2 && (
                      <div className="mt-2 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-3">
                        <div className="text-[11px] font-semibold text-green-700 dark:text-green-400 mb-1">{t.pricePanel.cheapestFor(GAS_TYPES.find((gt) => gt.key === activeType)?.label ?? "")}</div>
                        {(() => {
                          const sorted = [...compareItems]
                            .filter((e) => e.prices[activeType])
                            .sort((a, b) => (a.prices[activeType]?.avg ?? 999) - (b.prices[activeType]?.avg ?? 999));
                          const best = sorted[0];
                          const worst = sorted[sorted.length - 1];
                          if (!best || !worst) return null;
                          const diff = (worst.prices[activeType]?.avg ?? 0) - (best.prices[activeType]?.avg ?? 0);
                          return (
                            <div className="text-[12px]">
                              <strong>{best.name}</strong> à <strong className="text-green-600 dark:text-green-400">{best.prices[activeType]?.avg.toFixed(1)}¢</strong>
                              {diff > 0 && <span className="text-[var(--text-muted)]"> — {t.pricePanel.cheaper(diff.toFixed(1), worst.name)}</span>}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </>
                )
              ) : displayed.length === 0 ? (
                <div className="py-8 text-center text-[13px] text-[var(--text-muted)]">{t.pricePanel.noResults}</div>
              ) : (
                displayed.map((entry, i) => (
                  <PriceRow key={entryKey(entry)} entry={entry} rank={view === "region" ? i + 1 : undefined} activeType={activeType} provAvg={provAvg} absMin={absMin} absMax={absMax} isSelected={compareSet.has(entryKey(entry))} onToggle={toggleCompare} />
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default PricePanel;
