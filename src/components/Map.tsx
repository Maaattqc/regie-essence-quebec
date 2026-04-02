"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, ZoomControl, AttributionControl, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import type { Feature, Point } from "geojson";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import "leaflet/dist/leaflet.css";

const PriceChart = dynamic(() => import("./PriceChart"), { ssr: false });

// Fix Chrome subpixel rendering gaps between tiles
// https://github.com/Leaflet/Leaflet/issues/3575
(L.Browser as Record<string, unknown>).any3d = false;

const QUEBEC_CENTER: [number, number] = [52.0, -72.0];
const QUEBEC_ZOOM = 5;
const STATIONS_URL = "https://regieessencequebec.ca/stations.geojson.gz";

const REGION_CENTERS: Record<string, [number, number]> = {
  "Abitibi-Témiscamingue": [48.1705, -78.5117],
  "Bas-Saint-Laurent": [48.2038, -68.6293],
  "Capitale-Nationale": [46.9028, -71.2655],
  "Centre-du-Québec": [46.0535, -72.2469],
  "Chaudière-Appalaches": [46.5273, -70.9849],
  "Côte-Nord": [49.5469, -67.3614],
  "Estrie": [45.3859, -72.1444],
  "Gaspésie-Îles-de-la-Madeleine": [48.3045, -64.9487],
  "Lanaudière": [45.9302, -73.5505],
  "Laurentides": [45.8279, -74.1920],
  "Laval": [45.5789, -73.7406],
  "Mauricie": [46.5544, -72.7076],
  "Montérégie": [45.4674, -73.4465],
  "Montréal": [45.5289, -73.6453],
  "Municipalités hors MRC \\ CMM": [45.5266, -73.6502],
  "Nord-du-Québec": [50.0194, -75.9221],
  "Outaouais": [45.6084, -75.6577],
  "Saguenay-Lac-Saint-Jean": [48.5114, -71.5597],
};

const GAS_TYPES = [
  { key: "Régulier", label: "Régulier", color: "#d32f2f" },
  { key: "Super", label: "Super", color: "#f9a825" },
  { key: "Diesel", label: "Diesel", color: "#2e7d32" },
] as const;

type GasTypeKey = (typeof GAS_TYPES)[number]["key"];

const BRANDS = [
  "AMI", "Aucun", "Axco", "Beausoir", "Belzile", "Bélisle", "Canadian Tire",
  "Costco", "Couche-Tard", "Crevier", "Eko", "Esso", "Gaz-O-Bar", "Harnois",
  "Irving", "Le Relais", "Les Huiles Berthier Inc", "MacEwen", "Miraco",
  "Mobil", "Nutrinor Énergies", "Paddock", "Paquet", "Petro Abitemis",
  "Petro-Canada", "Petrol St-Félix", "Petroplus", "Pétro-T",
  "Pétroles Maurice", "Quickie", "R.L.", "SDBJ", "Shell", "Sonerco", "Sonic",
  "Stinson", "Ultramar",
];

const REGIONS = [
  "Abitibi-Témiscamingue", "Bas-Saint-Laurent", "Capitale-Nationale",
  "Centre-du-Québec", "Chaudière-Appalaches", "Côte-Nord", "Estrie",
  "Gaspésie-Îles-de-la-Madeleine", "Lanaudière", "Laurentides", "Laval",
  "Mauricie", "Montréal", "Montérégie",
  "Municipalités hors MRC \\ CMM", "Nord-du-Québec", "Outaouais",
  "Saguenay-Lac-Saint-Jean",
];

interface StationPrice {
  GasType: string;
  Price: string;
  IsAvailable: boolean;
}

interface StationProperties {
  Name: string;
  brand: string;
  Address: string;
  PostalCode: string;
  Region: string;
  Prices: StationPrice[];
  _city?: string;
  _cityNorm?: string;
}

function stationId(props: StationProperties): string {
  return `${props.Name}|${props.Address}`;
}

function getFavorites(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem("favorites") || "[]"));
  } catch { return new Set(); }
}

function toggleFavorite(id: string): Set<string> {
  const favs = getFavorites();
  if (favs.has(id)) favs.delete(id); else favs.add(id);
  localStorage.setItem("favorites", JSON.stringify([...favs]));
  window.dispatchEvent(new Event("favorites-changed"));
  return favs;
}

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
        <button onclick="window.__showReport('${props.Name.replace(/'/g, "\\'")}','${props.Address.replace(/'/g, "\\'")}')"
          style="flex:1;padding:5px 0;background:#e63946;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600">
          Signaler
        </button>
      </div>
    </div>
  `;
}

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
      <div style={{ fontWeight: 600, marginBottom: 4 }}>
        Rayon : {radiusKm === 0 ? "Tout" : `${radiusKm} km`}
      </div>
      <input
        type="range" min={0} max={50} step={5} value={radiusKm}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: 120 }}
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

async function reverseGeocode(
  lat: number,
  lon: number
): Promise<string | null> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`
  );
  const data = await res.json();
  return (
    data.address?.city ||
    data.address?.town ||
    data.address?.village ||
    data.address?.municipality ||
    null
  );
}

const PRICE_COLORS = ["#2d9a2d", "#6fbf3b", "#f0c808", "#ef8a17", "#e63946"];

function parsePrice(priceStr: string): number {
  return parseFloat(priceStr.replace("\u00A2", ""));
}

function getPriceColor(value: number, min: number, max: number): string {
  if (min === max) return PRICE_COLORS[2]; // jaune si tous pareil
  const ratio = (value - min) / (max - min);
  const idx = Math.min(Math.floor(ratio * 5), 4);
  return PRICE_COLORS[idx];
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

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function extractCity(address: string): string | null {
  const idx = address.lastIndexOf(",");
  if (idx === -1) return null;
  const city = address.slice(idx + 1).trim();
  return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
}

function deduplicateCities(raw: Set<string>): string[] {
  const sorted = [...raw].sort((a, b) => a.length - b.length);
  const kept: string[] = [];
  const normalizedKept: string[] = [];

  for (const city of sorted) {
    const norm = normalize(city);
    const isDuplicate = normalizedKept.some(
      (existing) => norm.startsWith(existing) && norm !== existing
    );
    if (!isDuplicate) {
      kept.push(city);
      normalizedKept.push(norm);
    }
  }

  return kept.sort((a, b) => a.localeCompare(b, "fr"));
}

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
      <input
        className="gov-input"
        type="text"
        value={input}
        onChange={(e) => handleInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="Ville"
        style={{ paddingRight: input ? 24 : 10 }}
      />
      {input && (
        <span className="search-clear" onMouseDown={handleClear} style={{ color: "rgba(255,255,255,0.6)" }}>x</span>
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
          <div style={{ display: "flex", gap: 2 }}>
            {GAS_TYPES.map((t) => (
              <button
                key={t.key}
                className={`gov-gas-btn ${gasType === t.key ? "gov-gas-btn-active" : ""}`}
                onClick={() => onGasTypeChange(t.key)}
                style={gasType === t.key ? { background: t.color } : undefined}
              >
                {t.label}
              </button>
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
          <button
            className={`gov-gas-btn ${showFavorites ? "gov-gas-btn-active" : ""}`}
            onClick={onToggleFavorites}
            style={showFavorites ? { background: "#ff9800" } : undefined}
          >
            Favoris
          </button>
        </div>
        <div className="gov-bar-right">
          <span className="gov-bar-badge">EN DIRECT</span>
          <button onClick={onChangelogClick} className="gov-bar-link" style={{ background: "none", border: "none", cursor: "pointer" }}>Changelog</button>
          <button onClick={onLoginClick} className="gov-bar-link" style={{ background: "none", border: "none", cursor: "pointer" }}>Connexion</button>
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

  if (!visible) return null;

  return (
    <div className="panel" style={{ top: 60, left: 12, width: 280, maxHeight: "70vh", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <strong>Prix moyen par région ({gasType})</strong>
        <span className="panel-close" onClick={onClose}>x</span>
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
    </div>
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    const res = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ station_name: stationName, address, ...form }),
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
    <div className="report-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Signaler une inexactitude</h2>
          <span className="panel-close" onClick={onClose}>x</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
          <strong>{stationName}</strong><br />{address}
        </div>

        {sent ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ fontSize: 15, fontWeight: 600 }}>Merci pour votre signalement !</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Nous allons examiner votre demande.</p>
            <button className="login-btn" onClick={onClose} style={{ marginTop: 12 }}>Fermer</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                className="login-input"
                placeholder="Prénom"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                required
                style={{ flex: 1 }}
              />
              <input
                className="login-input"
                placeholder="Nom"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                required
                style={{ flex: 1 }}
              />
            </div>
            <input
              className="login-input"
              type="email"
              placeholder="Courriel"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <textarea
              className="login-input"
              placeholder="Décrivez l'inexactitude..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
              rows={4}
              style={{ resize: "vertical" }}
            />
            {error && <p className="login-error">{error}</p>}
            <button className="login-btn" type="submit" disabled={sending}>
              {sending ? "Envoi..." : "Envoyer le signalement"}
            </button>
          </form>
        )}
      </div>
    </div>
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
    <div className="report-overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <span className="panel-close" onClick={onClose} style={{ position: "absolute", top: "1rem", right: "1rem" }}>x</span>

        <img src="/quebec-logo.svg" alt="Québec" className="login-modal-logo" />

        {step === "email" && (
          <>
            <p className="login-modal-subtitle">Entrez votre courriel pour recevoir un code de connexion</p>
            <form onSubmit={handleSendCode}>
              <label className="login-label">Adresse courriel</label>
              <input
                className="login-input"
                type="email"
                placeholder="exemple@courriel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              {error && <p className="login-error">{error}</p>}
              <button className="login-btn" type="submit" disabled={loading}>
                {loading ? "Envoi..." : "Envoyer le code"}
              </button>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "1rem", lineHeight: 1.4 }}>
                Aucun mot de passe requis. Un code à 6 chiffres sera envoyé à votre courriel.
              </p>
            </form>
          </>
        )}

        {step === "code" && (
          <>
            <p className="login-modal-subtitle">Un code a été envoyé à <strong>{email}</strong></p>
            <form onSubmit={handleVerifyCode}>
              <label className="login-label">Code de vérification</label>
              <input
                className="login-input login-code-input"
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
              {error && <p className="login-error">{error}</p>}
              <button className="login-btn" type="submit" disabled={loading || code.length < 6}>
                {loading ? "Vérification..." : "Vérifier le code"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("email"); setError(""); setCode(""); }}
                style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.8125rem", cursor: "pointer", marginTop: "0.75rem", display: "block", width: "100%", textAlign: "center" }}
              >
                Changer de courriel
              </button>
            </form>
          </>
        )}

        {step === "done" && (
          <div className="login-success">
            <p style={{ fontSize: "0.9375rem", fontWeight: 600, margin: "0 0 0.5rem" }}>Connexion réussie !</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: 0 }}>
              Vous êtes maintenant connecté.
            </p>
            <button className="login-btn" onClick={onClose} style={{ marginTop: "1rem" }}>Fermer</button>
          </div>
        )}
      </div>
    </div>
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
    <div className="report-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "40rem", maxHeight: "80vh", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexShrink: 0 }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>Changelog</h2>
          <span className="panel-close" onClick={onClose}>x</span>
        </div>
        <div>
          {loading ? (
            <p style={{ color: "var(--text-muted)" }}>Chargement...</p>
          ) : commits.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>Aucun commit trouvé.</p>
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
      </div>
    </div>
  );
}

function SiteThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      className="map-btn map-btn-default"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      style={{ marginTop: 6 }}
    >
      {isDark ? "Mode clair" : "Mode sombre"}
    </button>
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
  const [cheapestResults, setCheapestResults] = useState<{ stations: { lat: number; lng: number; price: number; name: string; dist: number }[]; message: string } | null>(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [data, setData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [geoReady, setGeoReady] = useState(false);
  const [flyTarget, setFlyTarget] = useState<{ center: [number, number]; zoom: number } | null>(null);

  // Load URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("ville")) setSearch(params.get("ville")!);
    if (params.get("region")) setRegion(params.get("region")!);
    if (params.get("type")) setGasType(params.get("type") as GasTypeKey);
    if (params.get("brand")) setBrand(params.get("brand")!);
    if (params.get("style")) setMapStyle(params.get("style") as "carte" | "satellite" | "dark");
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
        // Pre-compute city and normalized city for each feature
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
        // Set region from nearest station
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
        // Set city
        const city = await reverseGeocode(latitude, longitude);
        if (city) setSearch(city);
        setGeoReady(true);
      },
      () => setGeoReady(true) // refusé ou erreur, on affiche tout
    );
  }, [data]);

  function handleSearchChange(v: string) {
    setSearch(v);
    const vNorm = normalize(v);
    // Find region from city
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
      const best = candidates.filter((c) => c.price === bestPrice).sort((a, b) => a.dist - b.dist);
      const closest = best[0];
      const msg = best.length === 1
        ? `${closest.name} — ${bestPrice.toFixed(1)}¢ à ${closest.dist.toFixed(1)} km`
        : `${best.length} stations à ${bestPrice.toFixed(1)}¢ — la plus proche à ${closest.dist.toFixed(1)} km`;
      setCheapestResults({ stations: best, message: msg });
      setFlyTarget({ center: [closest.lat, closest.lng], zoom: 14 });
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
          <div style={{ marginBottom: "0.375rem" }}>
            <button className="map-btn map-btn-primary" onClick={() => { if (cheapestResults) setCheapestResults(null); else findCheapestNearby(); }} style={{ display: "block", width: "100%" }}>
              {cheapestResults ? "Masquer" : "Trouver le meilleur prix proche"}
            </button>
            {cheapestResults?.message && (
              <div style={{ background: "var(--bg-panel)", color: "var(--text)", padding: "0.375rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.6875rem", marginTop: "0.25rem", lineHeight: 1.3, boxShadow: "0 2px 6px var(--shadow-light)" }}>
                {cheapestResults.message}
              </div>
            )}
          </div>
          <button className="map-btn map-btn-default" onClick={() => setShowRegionPanel((v) => !v)} style={{ marginBottom: 6, display: "block" }}>
            Prix par région
          </button>
          <button className="map-btn map-btn-default" onClick={shareLink} style={{ marginBottom: 6, display: "block" }}>
            Partager
          </button>
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
        {(!data || !geoReady) && (
          <div className="loading-overlay">
            {!data ? "Chargement des stations..." : "Géolocalisation..."}
          </div>
        )}
        {filtered && geoReady && <StationsLayer gasType={gasType} data={filtered} hasFilter={!!(search || region || brand || showFavorites || radiusKm > 0)} />}
        {cheapestResults?.stations.map((s, i) => (
          <Marker
            key={`cheapest-${i}`}
            position={[s.lat, s.lng]}
            icon={L.divIcon({
              html: `<div class="cheapest-pulse"><div class="cheapest-label">${s.price.toFixed(1)}¢<br><small>${s.name}</small><br><small>${s.dist.toFixed(1)} km</small></div></div>`,
              className: "",
              iconSize: [140, 70],
              iconAnchor: [70, 35],
            })}
          />
        ))}
      </MapContainer>
      {historyStation && (
        <div className="panel" style={{ bottom: 60, right: 12, width: 320 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <strong style={{ fontSize: 13 }}>{historyStation.name}</strong>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{historyStation.address}</div>
            </div>
            <span className="panel-close" onClick={() => setHistoryStation(null)}>x</span>
          </div>
          <PriceChart
            stationName={historyStation.name}
            address={historyStation.address}
            gasType={gasType}
          />
        </div>
      )}
      {reportStation && (
        <ReportModal
          stationName={reportStation.name}
          address={reportStation.address}
          onClose={() => setReportStation(null)}
        />
      )}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
    </div>
  );
}
