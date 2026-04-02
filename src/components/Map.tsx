"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, ZoomControl, AttributionControl, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import type { Feature, Point } from "geojson";
import dynamic from "next/dynamic";
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
      <button onclick="window.__showHistory('${props.Name.replace(/'/g, "\\'")}','${props.Address.replace(/'/g, "\\'")}')"
        style="display:block;width:100%;margin-top:6px;padding:5px 0;background:#7c3aed;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600">
        Historique des prix
      </button>
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
    <div
      style={{
        position: "absolute", top: 175, right: 12, zIndex: 1000,
        background: "#fff", padding: "8px 12px", borderRadius: 8,
        boxShadow: "0 2px 6px rgba(0,0,0,.25)", fontSize: 12,
      }}
      {...dragProps}
    >
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

function priceIcon(
  props: StationProperties,
  gasType: GasTypeKey,
  min: number,
  max: number
) {
  const priceObj = props.Prices.find((p) => p.GasType === gasType && p.IsAvailable);
  const label = priceObj ? priceObj.Price.replace("\u00A2", "") : "—";
  const bg = priceObj ? getPriceColor(parsePrice(priceObj.Price), min, max) : "#999";

  return L.divIcon({
    html: `<div style="background:${bg};color:#fff;font-size:11px;font-weight:700;padding:2px 4px;border-radius:4px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.4);text-align:center">${label}</div>`,
    className: "",
    iconSize: [40, 20],
    iconAnchor: [20, 10],
  });
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

function StationsLayer({
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
          >
            <Popup>
              <div dangerouslySetInnerHTML={{ __html: formatPopup(props, lat, lng) }} />
            </Popup>
          </Marker>
        );
      })}
    </MarkerClusterGroup>
  );
}

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

  useEffect(() => {
    setInput(search);
  }, [search]);

  const suggestions = useMemo(() => {
    const q = input.trim();
    if (q.length < 2) return [];
    const norm = normalize(q);
    return cities.filter((c) => normalize(c).includes(norm)).slice(0, 8);
  }, [input, cities]);

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
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="Ville"
        style={{
          padding: "6px 10px",
          paddingRight: input ? 24 : 10,
          borderRadius: 6,
          border: "1px solid #ddd",
          fontSize: 13,
          fontWeight: 500,
          width: 200,
        }}
      />
      {input && (
        <span
          onMouseDown={handleClear}
          style={{
            position: "absolute",
            right: 6,
            top: "50%",
            transform: "translateY(-50%)",
            cursor: "pointer",
            color: "#999",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          x
        </span>
      )}
      {focused && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            background: "#fff",
            borderRadius: 6,
            boxShadow: "0 4px 12px rgba(0,0,0,.15)",
            maxHeight: 200,
            overflowY: "auto",
            zIndex: 1001,
          }}
        >
          {suggestions.map((city) => (
            <div
              key={city}
              onMouseDown={() => select(city)}
              style={{
                padding: "6px 10px",
                fontSize: 13,
                cursor: "pointer",
                borderBottom: "1px solid #f0f0f0",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f5f5f5")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {city} <span style={{ color: "#999" }}>({cityCounts[city] || 0})</span>
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
}) {
  return (
    <div className="filter-bar">
      <SearchWithSuggestions
        search={search}
        onSearchChange={onSearchChange}
        onConfirm={onSearchChange}
        cities={cities}
        cityCounts={cityCounts}
      />

      <select
        value={region}
        onChange={(e) => onRegionChange(e.target.value)}
        style={{
          padding: "6px 8px",
          borderRadius: 6,
          border: "1px solid #ddd",
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        <option value="">Toutes les régions ({totalStations})</option>
        {REGIONS.map((r) => (
          <option key={r} value={r}>
            {r} ({regionCounts[r] || 0})
          </option>
        ))}
      </select>

      <div style={{ width: 1, height: 24, background: "#ddd" }} />

      <div style={{ display: "flex", gap: 4 }}>
        {GAS_TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => onGasTypeChange(t.key)}
            style={{
              padding: "6px 14px",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
              background: gasType === t.key ? t.color : "transparent",
              color: gasType === t.key ? "#fff" : "#333",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ width: 1, height: 24, background: "#ddd" }} />

      <select
        value={brand}
        onChange={(e) => onBrandChange(e.target.value)}
        style={{
          padding: "6px 8px",
          borderRadius: 6,
          border: "1px solid #ddd",
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        <option value="">Toutes les compagnies ({totalStations})</option>
        {BRANDS.map((b) => (
          <option key={b} value={b}>
            {b} ({brandCounts[b] || 0})
          </option>
        ))}
      </select>

      <div style={{ width: 1, height: 24, background: "#ddd" }} />

      <button
        onClick={onToggleFavorites}
        style={{
          padding: "6px 14px",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 13,
          background: showFavorites ? "#ff9800" : "transparent",
          color: showFavorites ? "#fff" : "#333",
        }}
      >
        ★ Favoris
      </button>
    </div>
  );
}

function RegionPricePanel({
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
    <div
      style={{
        position: "absolute",
        top: 60,
        left: 12,
        zIndex: 1000,
        background: "#fff",
        borderRadius: 10,
        boxShadow: "0 4px 16px rgba(0,0,0,.2)",
        width: 280,
        maxHeight: "70vh",
        overflowY: "auto",
        padding: "12px 14px",
        fontSize: 13,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <strong>Prix moyen par région ({gasType})</strong>
        <span onClick={onClose} style={{ cursor: "pointer", fontWeight: 700, color: "#999" }}>x</span>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {regionAvgs.map(({ region, avg }, i) => (
            <tr key={region} style={{ background: i % 2 === 0 ? "#f9f9f9" : "#fff" }}>
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
}

export default function Map() {
  const [gasType, setGasType] = useState<GasTypeKey>("Régulier");
  const [brand, setBrand] = useState("");
  const [region, setRegion] = useState("");
  const [search, setSearch] = useState("");
  const [mapStyle, setMapStyle] = useState<"carte" | "satellite" | "dark">("carte");
  const [showRegionPanel, setShowRegionPanel] = useState(false);
  const [historyStation, setHistoryStation] = useState<{ name: string; address: string } | null>(null);
  const [radiusKm, setRadiusKm] = useState(0);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [data, setData] = useState<GeoJSON.FeatureCollection | null>(null);
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
    fetch(STATIONS_URL)
      .then((res) => res.json())
      .then((geojson) => setData(geojson))
      .catch(console.error);
    setFavs(getFavorites());
    (window as unknown as Record<string, unknown>).__toggleFav = (id: string) => {
      const updated = toggleFavorite(id);
      setFavs(new Set(updated));
    };
    (window as unknown as Record<string, unknown>).__showHistory = (name: string, address: string) => {
      setHistoryStation({ name, address });
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
    if (!navigator.geolocation) return;
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
      },
      () => {} // refusé ou erreur, on ne fait rien
    );
  }, [data]);

  function handleSearchChange(v: string) {
    setSearch(v);
    // Find region from city
    if (v && data) {
      const match = data.features.find((f) => {
        const city = extractCity((f as Feature<Point, StationProperties>).properties.Address);
        return city && normalize(city).includes(normalize(v));
      });
      if (match) setRegion((match as Feature<Point, StationProperties>).properties.Region);
    }
    if (v && data) {
      const coords: [number, number][] = [];
      data.features.forEach((f) => {
        const props = (f as Feature<Point, StationProperties>).properties;
        const city = extractCity(props.Address);
        if (city && normalize(city).includes(normalize(v))) {
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
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      let best: { lat: number; lng: number; price: number; props: StationProperties } | null = null;
      data.features.forEach((f) => {
        const feature = f as Feature<Point, StationProperties>;
        const props = feature.properties;
        const [lng, lat] = feature.geometry.coordinates;
        const dist = distanceKm(latitude, longitude, lat, lng);
        if (dist > 15) return;
        const p = props.Prices.find((pr) => pr.GasType === gasType && pr.IsAvailable);
        if (!p) return;
        const val = parsePrice(p.Price);
        if (!best || val < best.price) {
          best = { lat, lng, price: val, props };
        }
      });
      if (best) {
        setFlyTarget({ center: [(best as { lat: number }).lat, (best as { lng: number }).lng], zoom: 15 });
      }
    });
  }

  const cities = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    data.features.forEach((f) => {
      const addr = (f as Feature<Point, StationProperties>).properties.Address;
      const city = extractCity(addr);
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
          const city = extractCity(props.Address);
          if (!city || !normalize(city).includes(q)) return false;
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
      const city = extractCity(props.Address);
      if (city) cc[city] = (cc[city] || 0) + 1;
    });
    return { regionCounts: rc, brandCounts: bc, cityCounts: cc, totalStations: data.features.length };
  }, [data]);

  return (
    <div style={{ position: "relative", height: "100vh", width: "100vw" }}>
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
        <div
          style={{
            position: "absolute",
            top: 60,
            right: 12,
            zIndex: 1000,
            background: "#fff",
            padding: "8px 10px",
            borderRadius: 8,
            boxShadow: "0 2px 6px rgba(0,0,0,.25)",
            fontSize: 11,
            lineHeight: "18px",
          }}
        >
          {[
            { color: "#2d9a2d", label: "Très bas" },
            { color: "#6fbf3b", label: "Bas" },
            { color: "#f0c808", label: "Moyen" },
            { color: "#ef8a17", label: "Élevé" },
            { color: "#e63946", label: "Très élevé" },
          ].map((item) => (
            <div key={item.color} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: item.color,
                }}
              />
              {item.label}
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 30,
            left: 12,
            zIndex: 1000,
          }}
        >
          <button
            onClick={findCheapestNearby}
            style={{
              padding: "8px 14px",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
              background: "#2d9a2d",
              color: "#fff",
              boxShadow: "0 2px 6px rgba(0,0,0,.3)",
              marginBottom: 6,
            }}
          >
            Moins cher près de moi
          </button>
          <button
            onClick={() => setShowRegionPanel((v) => !v)}
            style={{
              padding: "8px 14px",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
              background: showRegionPanel ? "#333" : "#fff",
              color: showRegionPanel ? "#fff" : "#333",
              boxShadow: "0 2px 6px rgba(0,0,0,.3)",
              marginBottom: 6,
            }}
          >
            Prix par région
          </button>
          <button
            onClick={shareLink}
            style={{
              padding: "8px 14px",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
              background: "#fff",
              color: "#333",
              boxShadow: "0 2px 6px rgba(0,0,0,.3)",
              marginBottom: 6,
            }}
          >
            Partager
          </button>
          <div style={{ display: "flex", gap: 4, background: "#fff", borderRadius: 6, padding: 3, boxShadow: "0 2px 6px rgba(0,0,0,.3)" }}>
            {(["carte", "satellite", "dark"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setMapStyle(s)}
                style={{
                  padding: "5px 10px",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 12,
                  background: mapStyle === s ? "#333" : "transparent",
                  color: mapStyle === s ? "#fff" : "#333",
                }}
              >
                {s === "carte" ? "Carte" : s === "satellite" ? "Satellite" : "Dark"}
              </button>
            ))}
          </div>
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
        {!data && (
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            zIndex: 1000, background: "#fff", padding: "16px 24px", borderRadius: 10,
            boxShadow: "0 4px 12px rgba(0,0,0,.2)", fontSize: 14, fontWeight: 600,
          }}>
            Chargement des stations...
          </div>
        )}
        {filtered && <StationsLayer gasType={gasType} data={filtered} hasFilter={!!(search || region || brand || showFavorites || radiusKm > 0)} />}
      </MapContainer>
      {historyStation && (
        <div
          style={{
            position: "absolute",
            bottom: 60,
            right: 12,
            zIndex: 1000,
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 4px 16px rgba(0,0,0,.2)",
            width: 320,
            padding: "12px 14px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <strong style={{ fontSize: 13 }}>{historyStation.name}</strong>
              <div style={{ fontSize: 11, color: "#666" }}>{historyStation.address}</div>
            </div>
            <span
              onClick={() => setHistoryStation(null)}
              style={{ cursor: "pointer", fontWeight: 700, color: "#999", fontSize: 16 }}
            >
              x
            </span>
          </div>
          <PriceChart
            stationName={historyStation.name}
            address={historyStation.address}
            gasType={gasType}
          />
        </div>
      )}
    </div>
  );
}
