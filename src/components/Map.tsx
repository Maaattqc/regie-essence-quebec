"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, ZoomControl, AttributionControl, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import type { Feature, Point } from "geojson";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  X, Star, StarOff, History, Flag, Send, Mail, ArrowLeft,
  Sun, Moon, Share2, BarChart3, Crosshair,
} from "lucide-react";
import { reportSchema } from "@/lib/schemas";
import {
  type StationProperties,
  type StationPrice,
  type GasTypeKey,
  GAS_TYPES,
  BRANDS,
  REGIONS,
  REGION_CENTERS,
  QUEBEC_CENTER,
  QUEBEC_ZOOM,
  STATIONS_URL,
  stationId,
  parsePrice,
  getPriceColor,
  distanceKm,
  normalize,
  deduplicateCities,
  getFavorites,
  toggleFavorite,
  reverseGeocode,
} from "@/lib/stations";
import "leaflet/dist/leaflet.css";

const PriceChart = dynamic(() => import("./PriceChart"), { ssr: false });

// Fix Chrome subpixel rendering gaps between tiles
(L.Browser as Record<string, unknown>).any3d = false;

function formatPopup(props: StationProperties, lat: number, lng: number) {
  const prices = props.Prices.filter((p) => p.IsAvailable)
    .map((p) => `<tr><td>${p.GasType}</td><td><strong>${p.Price}</strong></td></tr>`)
    .join("");

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const sid = stationId(props);
  const isFav = getFavorites().has(sid);

  return `
    <div style="min-width:180px">
      <strong>${props.Name}</strong><br/>
      <small>${props.brand} — ${props.Region}</small><br/>
      <small>${props.Address}</small>
      <table style="margin-top:6px;width:100%">${prices}</table>
      <div style="display:flex;gap:6px;margin-top:8px">
        <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer"
          style="flex:1;padding:5px 0;background:#4285f4;color:#fff;text-align:center;border-radius:4px;text-decoration:none;font-size:12px;font-weight:600">
          Itinéraire
        </a>
        <button onclick="window.__toggleFav('${sid.replace(/'/g, "\\'")}')"
          style="flex:1;padding:5px 0;background:${isFav ? "#ff9800" : "#eee"};color:${isFav ? "#fff" : "#333"};border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600">
          ${isFav ? "Favori ★" : "Favori ☆"}
        </button>
      </div>
      <div style="display:flex;gap:6px;margin-top:6px">
        <button onclick="window.__showHistory('${props.Name.replace(/'/g, "\\'")}','${props.Address.replace(/'/g, "\\'")}')"
          style="flex:1;padding:5px 0;background:#7c3aed;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600">
          Historique
        </button>
        <button onclick="window.__showReviews('${props.Name.replace(/'/g, "\\'")}','${props.Address.replace(/'/g, "\\'")}')"
          style="flex:1;padding:5px 0;background:#0ea5e9;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600">
          Commentaires
        </button>
        <button onclick="window.__showReport('${props.Name.replace(/'/g, "\\'")}','${props.Address.replace(/'/g, "\\'")}')"
          style="flex:1;padding:5px 0;background:#e63946;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600">
          Signaler
        </button>
      </div>
    </div>
  `;
}

function useDisableMapDrag() {
  const map = useMap();
  return {
    onMouseDown: () => map.dragging.disable(),
    onMouseUp: () => map.dragging.enable(),
    onTouchStart: () => map.dragging.disable(),
    onTouchEnd: () => map.dragging.enable(),
  };
}

function RadiusSlider({ radiusKm, onChange }: { radiusKm: number; onChange: (v: number) => void }) {
  const dragProps = useDisableMapDrag();
  return (
    <div className="radius-panel" {...dragProps}>
      <div className="text-xs font-semibold mb-1">
        Rayon : {radiusKm === 0 ? "Tout" : `${radiusKm} km`}
      </div>
      <Slider
        min={0}
        max={50}
        step={5}
        value={[radiusKm]}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
        className="w-[120px]"
      />
    </div>
  );
}

function FlyTo({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom);
  }, [map, center, zoom]);
  return null;
}

const iconCache: Record<string, L.DivIcon> = {};

function priceIcon(
  props: StationProperties,
  gasType: GasTypeKey,
  min: number,
  max: number
) {
  const priceObj = props.Prices.find((p) => p.GasType === gasType && p.IsAvailable);
  const label = priceObj ? priceObj.Price.replace("\u00A2", "") : "—";
  const bg = priceObj ? getPriceColor(parsePrice(priceObj.Price), min, max) : "#999";

  const cacheKey = `${label}-${bg}`;
  let icon = iconCache[cacheKey];
  if (!icon) {
    icon = L.divIcon({
      html: `<div style="background:${bg};color:#fff;font-size:11px;font-weight:700;padding:2px 4px;border-radius:4px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.4);text-align:center">${label}</div>`,
      className: "",
      iconSize: [40, 20],
      iconAnchor: [20, 10],
    });
    iconCache[cacheKey] = icon;
  }
  return icon;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createClusterIcon(cluster: any, gasType: GasTypeKey, min: number, max: number) {
  const markers = cluster.getAllChildMarkers();
  const count = markers.length;
  let total = 0;
  let priceCount = 0;
  markers.forEach((m: L.Marker) => {
    const props = (m.options as unknown as Record<string, StationProperties>).__props;
    if (props) {
      const p = props.Prices.find((pr: StationPrice) => pr.GasType === gasType && pr.IsAvailable);
      if (p) { total += parsePrice(p.Price); priceCount++; }
    }
  });
  const avg = priceCount > 0 ? total / priceCount : 0;
  const avgLabel = avg > 0 ? avg.toFixed(1) : "—";
  const bg = avg > 0 ? getPriceColor(avg, min, max) : "#999";

  const size = count > 50 ? 52 : count > 20 ? 46 : 40;

  return L.divIcon({
    html: `<div style="background:${bg};color:#fff;width:${size}px;height:${size}px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid #fff;line-height:1.1"><span style="font-size:12px">${avgLabel}</span><span style="font-size:9px;opacity:.85">(${count})</span></div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const StationsLayer = memo(function StationsLayer({
  gasType,
  data,
  hasFilter,
}: {
  gasType: GasTypeKey;
  data: GeoJSON.FeatureCollection;
  hasFilter: boolean;
}) {
  const { min, max } = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    data.features.forEach((f) => {
      const props = (f as Feature<Point, StationProperties>).properties;
      const p = props.Prices.find((pr) => pr.GasType === gasType && pr.IsAvailable);
      if (p) {
        const v = parsePrice(p.Price);
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    });
    return { min: lo === Infinity ? 0 : lo, max: hi === -Infinity ? 0 : hi };
  }, [data, gasType]);

  return (
    <MarkerClusterGroup
      key={gasType + min + max + data.features.length + (hasFilter ? "no" : "yes")}
      chunkedLoading
      maxClusterRadius={hasFilter ? 0 : 60}
      iconCreateFunction={(cluster: unknown) => createClusterIcon(cluster, gasType, min, max)}
    >
      {data.features.map((f, i) => {
        const feature = f as Feature<Point, StationProperties>;
        const [lng, lat] = feature.geometry.coordinates;
        const props = feature.properties;
        return (
          <Marker
            key={i}
            position={[lat, lng]}
            icon={priceIcon(props, gasType, min, max)}
            {...{ __props: props } as unknown as Record<string, unknown>}
            eventHandlers={{
              popupopen: (e) => {
                const popup = e.target.getPopup();
                if (popup) popup.setContent(formatPopup(props, lat, lng));
              },
            }}
          >
            <Popup><span /></Popup>
          </Marker>
        );
      })}
    </MarkerClusterGroup>
  );
});

function SearchWithSuggestions({
  search,
  onSearchChange,
  onConfirm,
  cities,
  cityCounts,
}: {
  search: string;
  onSearchChange: (s: string) => void;
  onConfirm: (s: string) => void;
  cities: string[];
  cityCounts: Record<string, number>;
}) {
  const [input, setInput] = useState(search);
  const [focused, setFocused] = useState(false);
  const [debouncedInput, setDebouncedInput] = useState(input);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInput(search);
    setDebouncedInput(search);
  }, [search]);

  const handleInput = useCallback((v: string) => {
    setInput(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedInput(v), 200);
  }, []);

  const suggestions = useMemo(() => {
    const q = debouncedInput.trim();
    if (q.length < 2) return [];
    const norm = normalize(q);
    return cities.filter((c) => normalize(c).includes(norm)).slice(0, 8);
  }, [debouncedInput, cities]);

  function select(city: string) {
    setInput(city);
    onSearchChange(city);
    onConfirm(city);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      onSearchChange(input);
      onConfirm(input);
      (e.target as HTMLInputElement).blur();
    }
  }

  function handleClear() {
    setInput("");
    onSearchChange("");
    onConfirm("");
  }

  return (
    <div style={{ position: "relative" }}>
      <Input
        type="text"
        value={input}
        onChange={(e) => handleInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="Ville"
        className="h-7 w-[180px] border-white/25 bg-white/12 text-white text-[13px] font-medium placeholder:text-white/50 focus-visible:bg-white/20 focus-visible:border-white/50 focus-visible:ring-0"
        style={{ paddingRight: input ? 24 : 10 }}
      />
      {input && (
        <span className="search-clear" onMouseDown={handleClear}>
          <X className="size-3" />
        </span>
      )}
      {focused && suggestions.length > 0 && (
        <div className="suggestions">
          {suggestions.map((city) => (
            <div
              key={city}
              className="suggestion-item"
              onMouseDown={() => select(city)}
            >
              {city} <span style={{ color: "var(--text-muted)" }}>({cityCounts[city] || 0})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterBar({
  gasType,
  onGasTypeChange,
  brand,
  onBrandChange,
  region,
  onRegionChange,
  search,
  onSearchChange,
  cities,
  showFavorites,
  onToggleFavorites,
  regionCounts,
  brandCounts,
  cityCounts,
  totalStations,
  onLoginClick,
  onChangelogClick,
  currentUser,
  onLogout,
}: {
  gasType: GasTypeKey;
  onGasTypeChange: (t: GasTypeKey) => void;
  brand: string;
  onBrandChange: (b: string) => void;
  region: string;
  onRegionChange: (r: string) => void;
  search: string;
  onSearchChange: (s: string) => void;
  cities: string[];
  showFavorites: boolean;
  onToggleFavorites: () => void;
  regionCounts: Record<string, number>;
  brandCounts: Record<string, number>;
  cityCounts: Record<string, number>;
  totalStations: number;
  onLoginClick: () => void;
  onChangelogClick: () => void;
  currentUser: { email: string } | null;
  onLogout: () => void;
}) {
  return (
    <header className="gov-header">
      <div className="gov-bar">
        <div className="gov-bar-title">
          <span className="gov-bar-fleur">&#9884;</span>
          <div>
            Régie Essence Québec
            <div className="gov-bar-subtitle">Prix en temps réel des stations-service</div>
          </div>
        </div>
        <div className="gov-bar-filters">
          <SearchWithSuggestions
            search={search}
            onSearchChange={onSearchChange}
            onConfirm={onSearchChange}
            cities={cities}
            cityCounts={cityCounts}
          />
          <select
            className="gov-select"
            value={region}
            onChange={(e) => onRegionChange(e.target.value)}
          >
            <option value="">Toutes les régions ({totalStations})</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r} ({regionCounts[r] || 0})
              </option>
            ))}
          </select>
          <div className="flex gap-0.5">
            {GAS_TYPES.map((t) => (
              <Button
                key={t.key}
                variant={gasType === t.key ? "default" : "ghost"}
                size="sm"
                className={`text-[13px] font-semibold text-white border border-white/25 ${
                  gasType === t.key
                    ? "border-transparent"
                    : "bg-white/12 hover:bg-white/20 hover:text-white"
                }`}
                style={gasType === t.key ? { background: t.color } : undefined}
                onClick={() => onGasTypeChange(t.key)}
              >
                {t.label}
              </Button>
            ))}
          </div>
          <select
            className="gov-select"
            value={brand}
            onChange={(e) => onBrandChange(e.target.value)}
          >
            <option value="">Toutes les compagnies ({totalStations})</option>
            {BRANDS.map((b) => (
              <option key={b} value={b}>
                {b} ({brandCounts[b] || 0})
              </option>
            ))}
          </select>
          <Button
            variant={showFavorites ? "default" : "ghost"}
            size="sm"
            className={`text-[13px] font-semibold text-white border border-white/25 ${
              showFavorites
                ? "border-transparent bg-[#ff9800] hover:bg-[#ff9800]/80"
                : "bg-white/12 hover:bg-white/20 hover:text-white"
            }`}
            onClick={onToggleFavorites}
          >
            {showFavorites ? <Star className="size-3.5 fill-current" /> : <StarOff className="size-3.5" />}
            Favoris
          </Button>
        </div>
        <div className="gov-bar-right">
          <Badge variant="secondary" className="bg-white/15 text-white border-0 text-xs font-semibold tracking-wide">
            EN DIRECT
          </Badge>
          <Button variant="link" size="sm" className="text-white/85 hover:text-white text-[13px] font-medium no-underline hover:no-underline" onClick={onChangelogClick}>
            Changelog
          </Button>
          {currentUser ? (
            <>
              <span className="text-white/70 text-[12px]">{currentUser.email.split("@")[0]}</span>
              <Button variant="link" size="sm" className="text-white/85 hover:text-white text-[13px] font-medium no-underline hover:no-underline" onClick={onLogout}>
                Déconnexion
              </Button>
            </>
          ) : (
            <Button variant="link" size="sm" className="text-white/85 hover:text-white text-[13px] font-medium no-underline hover:no-underline" onClick={onLoginClick}>
              Connexion
            </Button>
          )}
        </div>
        <div className="gov-bar-accent" />
      </div>
    </header>
  );
}

const RegionPricePanel = memo(function RegionPricePanel({
  data,
  gasType,
  visible,
  onClose,
}: {
  data: GeoJSON.FeatureCollection;
  gasType: GasTypeKey;
  visible: boolean;
  onClose: () => void;
}) {
  const regionAvgs = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    data.features.forEach((f) => {
      const props = (f as Feature<Point, StationProperties>).properties;
      const p = props.Prices.find((pr) => pr.GasType === gasType && pr.IsAvailable);
      if (!p) return;
      if (!map[props.Region]) map[props.Region] = { total: 0, count: 0 };
      map[props.Region].total += parsePrice(p.Price);
      map[props.Region].count++;
    });
    return Object.entries(map)
      .map(([region, { total, count }]) => ({ region, avg: total / count }))
      .sort((a, b) => a.avg - b.avg);
  }, [data, gasType]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="panel"
          style={{ top: 60, left: 12, width: 280, maxHeight: "70vh", overflowY: "auto" }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex justify-between items-center mb-2">
            <strong>Prix moyen par région ({gasType})</strong>
            <Button variant="ghost" size="icon-xs" onClick={onClose}>
              <X className="size-3.5" />
            </Button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {regionAvgs.map(({ region, avg }, i) => (
                <tr key={region} style={{ background: i % 2 === 0 ? "var(--row-alt)" : "transparent" }}>
                  <td style={{ padding: "4px 6px" }}>{region}</td>
                  <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 600 }}>
                    {avg.toFixed(1)}¢
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

function ReportModal({
  stationName,
  address,
  onClose,
}: {
  stationName: string;
  address: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const payload = { station_name: stationName, address, ...form };
    const validation = reportSchema.safeParse(payload);
    if (!validation.success) {
      const errs: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const key = String(issue.path[0]);
        if (!errs[key]) errs[key] = issue.message;
      });
      setFieldErrors(errs);
      return;
    }

    setSending(true);
    const res = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setSent(true);
    } else {
      const data = await res.json();
      setError(data.error || "Erreur");
    }
    setSending(false);
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="size-4 text-destructive" />
            Signaler une inexactitude
          </DialogTitle>
          <DialogDescription>
            <strong>{stationName}</strong> — {address}
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <motion.div
            className="text-center py-5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p className="text-[15px] font-semibold">Merci pour votre signalement !</p>
            <p className="text-[13px] text-muted-foreground">Nous allons examiner votre demande.</p>
            <Button onClick={onClose} className="mt-3">Fermer</Button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Prénom"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  aria-invalid={!!fieldErrors.first_name}
                />
                {fieldErrors.first_name && <p className="text-xs text-destructive mt-0.5">{fieldErrors.first_name}</p>}
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Nom"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  aria-invalid={!!fieldErrors.last_name}
                />
                {fieldErrors.last_name && <p className="text-xs text-destructive mt-0.5">{fieldErrors.last_name}</p>}
              </div>
            </div>
            <div>
              <Input
                type="email"
                placeholder="Courriel"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email && <p className="text-xs text-destructive mt-0.5">{fieldErrors.email}</p>}
            </div>
            <div>
              <textarea
                className="flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none resize-y"
                placeholder="Décrivez l'inexactitude..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                aria-invalid={!!fieldErrors.message}
                rows={4}
              />
              {fieldErrors.message && <p className="text-xs text-destructive mt-0.5">{fieldErrors.message}</p>}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={sending} variant="destructive">
              <Send className="size-3.5" />
              {sending ? "Envoi..." : "Envoyer le signalement"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function LoginModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code" | "done">("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function getSupabase() {
    const { createClient } = await import("@supabase/supabase-js");
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = await getSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setStep("code");
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = await getSupabase();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    setLoading(false);
    if (error) setError(error.message);
    else setStep("done");
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <img src="/quebec-logo.svg" alt="Québec" className="login-modal-logo" />

        {step === "email" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="size-4" />
                Connexion
              </DialogTitle>
              <DialogDescription>
                Entrez votre courriel pour recevoir un code de connexion
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSendCode} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Adresse courriel</label>
                <Input
                  type="email"
                  placeholder="exemple@courriel.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading}>
                {loading ? "Envoi..." : "Envoyer le code"}
              </Button>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Aucun mot de passe requis. Un code à 6 chiffres sera envoyé à votre courriel.
              </p>
            </form>
          </>
        )}

        {step === "code" && (
          <>
            <DialogHeader>
              <DialogTitle>Vérification</DialogTitle>
              <DialogDescription>
                Un code a été envoyé à <strong>{email}</strong>
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleVerifyCode} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Code de vérification</label>
                <Input
                  className="text-center text-2xl tracking-[0.3em] font-mono"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading || code.length < 6}>
                {loading ? "Vérification..." : "Vérifier le code"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => { setStep("email"); setError(""); setCode(""); }}
              >
                <ArrowLeft className="size-3" />
                Changer de courriel
              </Button>
            </form>
          </>
        )}

        {step === "done" && (
          <motion.div
            className="text-center py-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p className="text-[15px] font-semibold mb-1">Connexion réussie !</p>
            <p className="text-[13px] text-muted-foreground">
              Vous êtes maintenant connecté.
            </p>
            <Button onClick={onClose} className="mt-4">Fermer</Button>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ChangelogCommit {
  sha: string;
  date: string;
  message: string;
  author: string;
}

function ChangelogModal({ onClose }: { onClose: () => void }) {
  const [commits, setCommits] = useState<ChangelogCommit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/changelog")
      .then((r) => r.json())
      .then((d) => setCommits(d))
      .catch(() => setCommits([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[40rem] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="size-4" />
            Changelog
          </DialogTitle>
        </DialogHeader>
        <div>
          {loading ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : commits.length === 0 ? (
            <p className="text-muted-foreground">Aucun commit trouvé.</p>
          ) : (
            <div className="changelog-list">
              {commits.map((c) => (
                <div key={c.sha} className="changelog-item">
                  <div className="changelog-date">
                    {new Date(c.date).toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" })}
                    {" — "}{c.author}
                  </div>
                  <div className="changelog-msg">{c.message}</div>
                  <div className="changelog-sha">{c.sha.slice(0, 7)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface Comment {
  id: number;
  content: string;
  parent_id: number | null;
  likes: number;
  dislikes: number;
  created_at: string;
  author: string;
  user_id: string;
  my_vote: number;
}

function CommentItem({ c, replies, allComments, onReply, onVote }: { c: Comment; replies: Comment[]; allComments: Comment[]; onReply: (id: number) => void; onVote: (id: number, vote: number) => void }) {
  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `il y a ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `il y a ${hrs}h`;
    return `il y a ${Math.floor(hrs / 24)}j`;
  };
  return (
    <div style={{ padding: "0.5rem 0" }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
        <div style={{ width: "1.75rem", height: "1.75rem", borderRadius: "50%", background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0, color: "var(--text-secondary)" }}>
          {c.author[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.75rem" }}>
            <strong>{c.author}</strong>
            <span style={{ color: "var(--text-muted)", marginLeft: "0.375rem" }}>{timeAgo(c.created_at)}</span>
          </div>
          <p style={{ fontSize: "0.8125rem", margin: "0.25rem 0 0.375rem", lineHeight: 1.4, color: "var(--text)" }}>{c.content}</p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.75rem" }}>
            <button onClick={() => onVote(c.id, 1)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem", color: c.my_vote === 1 ? "#0ea5e9" : "var(--text-muted)", padding: 0 }}>
              &#128077; {c.likes > 0 && c.likes}
            </button>
            <button onClick={() => onVote(c.id, -1)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem", color: c.my_vote === -1 ? "#e63946" : "var(--text-muted)", padding: 0 }}>
              &#128078; {c.dislikes > 0 && c.dislikes}
            </button>
            <button onClick={() => onReply(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0, fontWeight: 600, fontSize: "0.75rem" }}>
              Répondre
            </button>
          </div>
          {replies.length > 0 && (
            <div style={{ marginLeft: "0.5rem", borderLeft: "2px solid var(--divider)", paddingLeft: "0.75rem", marginTop: "0.375rem" }}>
              {replies.map((r) => (
                <CommentItem key={r.id} c={r} replies={allComments.filter((x) => x.parent_id === r.id)} allComments={allComments} onReply={onReply} onVote={onVote} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CommentsModal({ stationName, address, onClose }: { stationName: string; address: string; onClose: () => void }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function getToken() {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  async function loadComments() {
    const token = await getToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`/api/reviews?station=${encodeURIComponent(stationName)}&address=${encodeURIComponent(address)}`, { headers });
    const data = await res.json();
    setComments(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { loadComments(); }, [stationName, address]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setError("");
    setSending(true);
    const token = await getToken();
    if (!token) { setError("Connectez-vous pour commenter"); setSending(false); return; }
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ station_name: stationName, address, content: newComment, parent_id: replyTo }),
    });
    if (res.ok) { setNewComment(""); setReplyTo(null); loadComments(); }
    else { const d = await res.json(); setError(d.error || "Erreur"); }
    setSending(false);
  }

  async function handleVote(commentId: number, vote: number) {
    const token = await getToken();
    if (!token) { setError("Connectez-vous pour voter"); return; }
    // Optimistic update
    setComments((prev) => prev.map((c) => {
      if (c.id !== commentId) return c;
      const wasVote = c.my_vote;
      if (wasVote === vote) {
        // Toggle off
        return { ...c, my_vote: 0, likes: c.likes - (vote === 1 ? 1 : 0), dislikes: c.dislikes - (vote === -1 ? 1 : 0) };
      }
      return {
        ...c,
        my_vote: vote,
        likes: c.likes + (vote === 1 ? 1 : 0) - (wasVote === 1 ? 1 : 0),
        dislikes: c.dislikes + (vote === -1 ? 1 : 0) - (wasVote === -1 ? 1 : 0),
      };
    }));
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "vote", comment_id: commentId, vote }),
    });
  }

  const topLevel = comments.filter((c) => !c.parent_id);
  const getReplies = (id: number) => comments.filter((c) => c.parent_id === id);
  const replyAuthor = replyTo ? comments.find((c) => c.id === replyTo)?.author : null;

  return (
    <div className="report-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "30rem", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexShrink: 0 }}>
          <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, margin: 0 }}>Commentaires — {stationName}</h2>
          <span className="panel-close" onClick={onClose}>x</span>
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>{comments.length} commentaire{comments.length !== 1 ? "s" : ""}</div>

        <form onSubmit={handleSubmit} style={{ flexShrink: 0, marginBottom: "0.75rem" }}>
          {replyTo && (
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              Répondre à <strong>{replyAuthor}</strong>
              <button type="button" onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0, fontSize: "0.75rem" }}>x</button>
            </div>
          )}
          <div style={{ display: "flex", gap: "0.375rem" }}>
            <input
              className="login-input"
              placeholder="Ajouter un commentaire..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              style={{ flex: 1, marginBottom: 0 }}
            />
            <button className="login-btn" type="submit" disabled={sending || !newComment.trim()} style={{ width: "auto", padding: "0 0.75rem", fontSize: "0.8125rem" }}>
              {sending ? "..." : "Publier"}
            </button>
          </div>
          {error && <p className="login-error" style={{ marginTop: "0.25rem" }}>{error}</p>}
        </form>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>Chargement...</p>
          ) : topLevel.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>Aucun commentaire. Soyez le premier !</p>
          ) : (
            topLevel.map((c) => (
              <CommentItem key={c.id} c={c} replies={getReplies(c.id)} allComments={comments} onReply={setReplyTo} onVote={handleVote} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SiteThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <Button
      variant="outline"
      size="sm"
      className="mt-1.5 shadow-md bg-[var(--bg-panel)] text-[var(--text)] border-0 font-semibold text-[13px]"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
      {isDark ? "Mode clair" : "Mode sombre"}
    </Button>
  );
}

export default function Map() {
  const [gasType, setGasType] = useState<GasTypeKey>("Régulier");
  const [brand, setBrand] = useState("");
  const [region, setRegion] = useState("");
  const [search, setSearch] = useState("");
  const [mapStyle, setMapStyle] = useState<"carte" | "satellite" | "dark">("carte");
  const [showRegionPanel, setShowRegionPanel] = useState(false);
  const [historyStation, setHistoryStation] = useState<{ name: string; address: string } | null>(null);
  const [reportStation, setReportStation] = useState<{ name: string; address: string } | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [commentStation, setCommentStation] = useState<{ name: string; address: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<{ email: string } | null>(null);
  const [cheapestResults, setCheapestResults] = useState<{ stations: { lat: number; lng: number; price: number; name: string; dist: number }[]; message: string } | null>(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [data, setData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [geoReady, setGeoReady] = useState(false);
  const [flyTarget, setFlyTarget] = useState<{ center: [number, number]; zoom: number } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("ville")) setSearch(params.get("ville")!);
    if (params.get("region")) setRegion(params.get("region")!);
    if (params.get("type")) setGasType(params.get("type") as GasTypeKey);
    if (params.get("brand")) setBrand(params.get("brand")!);
    if (params.get("style")) setMapStyle(params.get("style") as "carte" | "satellite" | "dark");
  }, []);

  useEffect(() => {
    import("@supabase/supabase-js").then(({ createClient }) => {
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      sb.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.email) setCurrentUser({ email: session.user.email });
      });
      sb.auth.onAuthStateChange((_event, session) => {
        setCurrentUser(session?.user?.email ? { email: session.user.email } : null);
      });
    });
  }, []);

  useEffect(() => {
    const cached = sessionStorage.getItem("stations");
    const promise = cached
      ? Promise.resolve(JSON.parse(cached))
      : fetch(STATIONS_URL).then((res) => res.json()).then((geojson) => {
          try { sessionStorage.setItem("stations", JSON.stringify(geojson)); } catch {}
          return geojson;
        });
    promise.then((geojson: GeoJSON.FeatureCollection) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        geojson.features.forEach((f: any) => {
          const addr = f.properties.Address as string;
          const idx = addr.lastIndexOf(",");
          if (idx !== -1) {
            const raw = addr.slice(idx + 1).trim();
            const city = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
            f.properties._city = city;
            f.properties._cityNorm = normalize(city);
          }
        });
        setData(geojson);
      }).catch(console.error);
    setFavs(getFavorites());
    (window as unknown as Record<string, unknown>).__toggleFav = (id: string) => {
      const updated = toggleFavorite(id);
      setFavs(new Set(updated));
    };
    (window as unknown as Record<string, unknown>).__showHistory = (name: string, address: string) => {
      setHistoryStation({ name, address });
    };
    (window as unknown as Record<string, unknown>).__showReport = (name: string, address: string) => {
      setReportStation({ name, address });
    };
    (window as unknown as Record<string, unknown>).__showReviews = (name: string, address: string) => {
      setCommentStation({ name, address });
    };
    const onFavChange = () => setFavs(getFavorites());
    window.addEventListener("favorites-changed", onFavChange);
    return () => window.removeEventListener("favorites-changed", onFavChange);
  }, []);

  function shareLink() {
    const params = new URLSearchParams();
    if (search) params.set("ville", search);
    if (region) params.set("region", region);
    if (gasType !== "Régulier") params.set("type", gasType);
    if (brand) params.set("brand", brand);
    if (mapStyle !== "carte") params.set("style", mapStyle);
    const url = `${window.location.origin}${window.location.pathname}${params.toString() ? "?" + params : ""}`;
    navigator.clipboard.writeText(url);
    alert("Lien copié !");
  }

  useEffect(() => {
    if (!navigator.geolocation) { setGeoReady(true); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPos([latitude, longitude]);
        setFlyTarget({ center: [latitude, longitude], zoom: 12 });
        if (data) {
          let nearestRegion = "";
          let nearestDist = Infinity;
          data.features.forEach((f) => {
            const feature = f as Feature<Point, StationProperties>;
            const [lng, lat] = feature.geometry.coordinates;
            const d = distanceKm(latitude, longitude, lat, lng);
            if (d < nearestDist) {
              nearestDist = d;
              nearestRegion = feature.properties.Region;
            }
          });
          if (nearestRegion) setRegion(nearestRegion);
        }
        const city = await reverseGeocode(latitude, longitude);
        if (city) setSearch(city);
        setGeoReady(true);
      },
      () => setGeoReady(true)
    );
  }, [data]);

  function handleSearchChange(v: string) {
    setSearch(v);
    const vNorm = normalize(v);
    if (v && data) {
      const match = data.features.find((f) => {
        const props = (f as Feature<Point, StationProperties>).properties;
        return props._cityNorm && props._cityNorm.includes(vNorm);
      });
      if (match) setRegion((match as Feature<Point, StationProperties>).properties.Region);
    }
    if (v && data) {
      const coords: [number, number][] = [];
      data.features.forEach((f) => {
        const props = (f as Feature<Point, StationProperties>).properties;
        if (props._cityNorm && props._cityNorm.includes(vNorm)) {
          const [lng, lat] = (f as Feature<Point>).geometry.coordinates;
          coords.push([lat, lng]);
        }
      });
      if (coords.length > 0) {
        const avgLat = coords.reduce((s, c) => s + c[0], 0) / coords.length;
        const avgLng = coords.reduce((s, c) => s + c[1], 0) / coords.length;
        setFlyTarget({ center: [avgLat, avgLng], zoom: 12 });
      }
    } else {
      setFlyTarget(null);
    }
  }
  function handleRegionChange(v: string) {
    setRegion(v);
    setSearch("");
    if (v && REGION_CENTERS[v]) {
      setFlyTarget({ center: REGION_CENTERS[v], zoom: 9 });
    } else {
      setFlyTarget(null);
    }
  }
  function handleBrandChange(v: string) {
    setBrand(v);
  }

  function findCheapestNearby() {
    if (!data) return;
    const doSearch = (latitude: number, longitude: number) => {
      const r = radiusKm > 0 ? radiusKm : 5;
      const candidates: { lat: number; lng: number; price: number; name: string; dist: number }[] = [];
      data.features.forEach((f) => {
        const feature = f as Feature<Point, StationProperties>;
        const props = feature.properties;
        const [lng, lat] = feature.geometry.coordinates;
        const dist = distanceKm(latitude, longitude, lat, lng);
        if (dist > r) return;
        const p = props.Prices.find((pr) => pr.GasType === gasType && pr.IsAvailable);
        if (!p) return;
        candidates.push({ lat, lng, price: parsePrice(p.Price), name: props.Name, dist });
      });
      if (candidates.length === 0) {
        setCheapestResults({ stations: [], message: `Aucune station trouvée dans un rayon de ${r} km` });
        return;
      }
      const bestPrice = Math.min(...candidates.map((c) => c.price));
      const closest = candidates.filter((c) => c.price === bestPrice).sort((a, b) => a.dist - b.dist)[0];
      const msg = `${closest.name} — ${bestPrice.toFixed(1)}¢ à environ ${closest.dist.toFixed(1)} km`;
      setCheapestResults({ stations: [closest], message: msg });
      setFlyTarget({ center: [closest.lat, closest.lng], zoom: 15 });
    };
    if (userPos) {
      doSearch(userPos[0], userPos[1]);
    } else {
      navigator.geolocation.getCurrentPosition((p) => doSearch(p.coords.latitude, p.coords.longitude));
    }
  }

  const cities = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    data.features.forEach((f) => {
      const city = (f as Feature<Point, StationProperties>).properties._city;
      if (city) set.add(city);
    });
    return deduplicateCities(set);
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return null;
    if (!brand && !region && !search && !showFavorites && !(radiusKm > 0 && userPos)) return data;

    const q = normalize(search.trim());

    return {
      ...data,
      features: data.features.filter((f) => {
        const props = (f as Feature<Point, StationProperties>).properties;
        if (showFavorites && !favs.has(stationId(props))) return false;
        if (radiusKm > 0 && userPos) {
          const [lng, lat] = (f as Feature<Point>).geometry.coordinates;
          if (distanceKm(userPos[0], userPos[1], lat, lng) > radiusKm) return false;
        }
        if (brand && props.brand !== brand) return false;
        if (region && props.Region !== region) return false;
        if (q) {
          if (!props._cityNorm || !props._cityNorm.includes(q)) return false;
        }
        return true;
      }),
    } as GeoJSON.FeatureCollection;
  }, [data, brand, region, search, showFavorites, favs, radiusKm, userPos]);

  const { regionCounts, brandCounts, cityCounts, totalStations } = useMemo(() => {
    if (!data) return { regionCounts: {}, brandCounts: {}, cityCounts: {}, totalStations: 0 };
    const rc: Record<string, number> = {};
    const bc: Record<string, number> = {};
    const cc: Record<string, number> = {};
    data.features.forEach((f) => {
      const props = (f as Feature<Point, StationProperties>).properties;
      rc[props.Region] = (rc[props.Region] || 0) + 1;
      bc[props.brand] = (bc[props.brand] || 0) + 1;
      if (props._city) cc[props._city] = (cc[props._city] || 0) + 1;
    });
    return { regionCounts: rc, brandCounts: bc, cityCounts: cc, totalStations: data.features.length };
  }, [data]);

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <FilterBar
        gasType={gasType}
        onGasTypeChange={setGasType}
        brand={brand}
        onBrandChange={handleBrandChange}
        region={region}
        onRegionChange={handleRegionChange}
        search={search}
        onSearchChange={handleSearchChange}
        cities={cities}
        showFavorites={showFavorites}
        onToggleFavorites={() => setShowFavorites((v) => !v)}
        regionCounts={regionCounts}
        brandCounts={brandCounts}
        cityCounts={cityCounts}
        totalStations={totalStations}
        onLoginClick={() => setShowLogin(true)}
        onChangelogClick={() => setShowChangelog(true)}
        currentUser={currentUser}
        onLogout={async () => {
          const { createClient } = await import("@supabase/supabase-js");
          const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
          await sb.auth.signOut();
          setCurrentUser(null);
        }}
      />
      <MapContainer
        center={QUEBEC_CENTER}
        zoom={QUEBEC_ZOOM}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          key={mapStyle}
          attribution={
            mapStyle === "satellite"
              ? '&copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
              : mapStyle === "dark"
              ? '&copy; <a href="https://carto.com/">CARTO</a>'
              : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }
          url={
            mapStyle === "satellite"
              ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              : mapStyle === "dark"
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
        />
        <ZoomControl position="bottomright" />
        <div className="legend">
          {[
            { color: "#2d9a2d", label: "Très bas" },
            { color: "#6fbf3b", label: "Bas" },
            { color: "#f0c808", label: "Moyen" },
            { color: "#ef8a17", label: "Élevé" },
            { color: "#e63946", label: "Très élevé" },
          ].map((item) => (
            <div key={item.color} className="legend-item">
              <span className="legend-dot" style={{ background: item.color }} />
              {item.label}
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", bottom: 30, left: 12, zIndex: 1000 }}>
          <div className="mb-1.5">
            <Button
              variant={cheapestResults ? "outline" : "default"}
              size="sm"
              className={`w-full shadow-md font-semibold text-[13px] ${!cheapestResults ? "bg-[#2d9a2d] hover:bg-[#2d9a2d]/90 text-white" : "bg-[var(--bg-panel)] text-[var(--text)]"}`}
              onClick={() => { if (cheapestResults) setCheapestResults(null); else findCheapestNearby(); }}
            >
              <Crosshair className="size-3.5" />
              {cheapestResults ? "Masquer" : "Meilleur prix proche"}
            </Button>
            <AnimatePresence>
              {cheapestResults?.message && (
                <motion.div
                  className="bg-[var(--bg-panel)] text-[var(--text)] p-1.5 rounded text-[11px] mt-1 leading-tight shadow-md"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                >
                  {cheapestResults.message}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mb-1.5 w-full shadow-md bg-[var(--bg-panel)] text-[var(--text)] border-0 font-semibold text-[13px]"
            onClick={() => setShowRegionPanel((v) => !v)}
          >
            <BarChart3 className="size-3.5" />
            Prix par région
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="mb-1.5 w-full shadow-md bg-[var(--bg-panel)] text-[var(--text)] border-0 font-semibold text-[13px]"
            onClick={shareLink}
          >
            <Share2 className="size-3.5" />
            Partager
          </Button>
          <div className="map-style-group">
            {(["carte", "satellite", "dark"] as const).map((s) => (
              <button
                key={s}
                className={`map-style-btn ${mapStyle === s ? "map-style-btn-active" : ""}`}
                onClick={() => setMapStyle(s)}
              >
                {s === "carte" ? "Carte" : s === "satellite" ? "Satellite" : "Dark"}
              </button>
            ))}
          </div>
          <SiteThemeToggle />
        </div>
        <AttributionControl position="bottomleft" />
        {userPos && (
          <RadiusSlider radiusKm={radiusKm} onChange={setRadiusKm} />
        )}
        {userPos && radiusKm > 0 && (
          <Circle
            center={userPos}
            radius={radiusKm * 1000}
            pathOptions={{ color: "#4285f4", fillColor: "#4285f4", fillOpacity: 0.08, weight: 2 }}
          />
        )}
        {data && (
          <RegionPricePanel
            data={data}
            gasType={gasType}
            visible={showRegionPanel}
            onClose={() => setShowRegionPanel(false)}
          />
        )}
        {flyTarget && <FlyTo center={flyTarget.center} zoom={flyTarget.zoom} />}
        <AnimatePresence>
          {(!data || !geoReady) && (
            <motion.div
              className="loading-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {!data ? "Chargement des stations..." : "Géolocalisation..."}
            </motion.div>
          )}
        </AnimatePresence>
        {filtered && geoReady && <StationsLayer gasType={gasType} data={filtered} hasFilter={!!(search || region || brand || showFavorites || radiusKm > 0)} />}
        {cheapestResults?.stations.map((s, i) => (
          <Marker
            key={`cheapest-${i}`}
            position={[s.lat, s.lng]}
            icon={L.divIcon({
              html: `<div class="cheapest-pulse"><div class="cheapest-label">${s.price.toFixed(1)}¢<br><small>${s.name}</small><br><small>~${s.dist.toFixed(1)} km</small></div></div>`,
              className: "",
              iconSize: [140, 70],
              iconAnchor: [70, 35],
            })}
          />
        ))}
      </MapContainer>
      <AnimatePresence>
        {historyStation && (
          <motion.div
            className="panel"
            style={{ bottom: 60, right: 12, width: 320 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center mb-2">
              <div>
                <strong className="text-[13px]">{historyStation.name}</strong>
                <div className="text-[11px] text-muted-foreground">{historyStation.address}</div>
              </div>
              <Button variant="ghost" size="icon-xs" onClick={() => setHistoryStation(null)}>
                <X className="size-3.5" />
              </Button>
            </div>
            <PriceChart
              stationName={historyStation.name}
              address={historyStation.address}
              gasType={gasType}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {reportStation && (
        <ReportModal
          stationName={reportStation.name}
          address={reportStation.address}
          onClose={() => setReportStation(null)}
        />
      )}
      {commentStation && (
        <CommentsModal stationName={commentStation.name} address={commentStation.address} onClose={() => setCommentStation(null)} />
      )}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
    </div>
  );
}
