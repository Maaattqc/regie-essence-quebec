"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, ZoomControl, AttributionControl, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import type { Feature, Point } from "geojson";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  X, Share2, BarChart3, Building2, Crosshair, Users,
} from "lucide-react";
import FilterBar from "@/components/FilterBar";
import { createBrowserClient } from "@/lib/auth";
import LoginModal from "@/components/LoginModal";
import ChangelogModal from "@/components/ChangelogModal";
import ReportModal from "@/components/ReportModal";
import CommentsModal from "@/components/CommentsModal";
import CityPricePanel from "@/components/CityPricePanel";
import RegionPricePanel from "@/components/RegionPricePanel";
import {
  type StationProperties,
  type StationPrice,
  type GasTypeKey,
  REGION_CENTERS,
  QUEBEC_CENTER,
  QUEBEC_ZOOM,
  stationId,
  parsePrice,
  getPriceColor,
  distanceKm,
  normalize,
  extractCity,
  deduplicateCities,
  getFavorites,
  toggleFavorite,
  reverseGeocode,
} from "@/lib/stations";
import "leaflet/dist/leaflet.css";

const PriceChart = dynamic(() => import("./PriceChart"), { ssr: false });
const STATIONS_CACHE_KEY = "stations-api-cache";

// Fix Chrome subpixel rendering gaps between tiles
(L.Browser as Record<string, unknown>).any3d = false;

interface StationsApiPayload {
  ok: boolean;
  data: GeoJSON.FeatureCollection | null;
}

function decorateStationGeoJson(geojson: GeoJSON.FeatureCollection) {
  geojson.features.forEach((feature) => {
    const station = feature as Feature<Point, StationProperties>;
    const city = extractCity(station.properties.Address);

    if (!city) {
      return;
    }

    station.properties._city = city;
    station.properties._cityNorm = normalize(city);
  });

  return geojson;
}

function readSearchParam(name: string) {
  if (typeof window === "undefined") {
    return null;
  }

  return new URLSearchParams(window.location.search).get(name);
}

// Lucide SVG paths inlined for use in Leaflet HTML popups (no JSX available)
const SVG = {
  navigation: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>`,
  star: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  starEmpty: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  barChart: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  messageCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>`,
  flag: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
};

function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function formatPopup(props: StationProperties, lat: number, lng: number) {
  const priceChips = props.Prices.filter((p) => p.IsAvailable)
    .map((p) => `
      <div style="display:flex;justify-content:space-between;align-items:center;background:#f5f5f5;border-radius:6px;padding:5px 9px;font-size:12.5px">
        <span style="color:#555;font-weight:500">${escHtml(p.GasType)}</span>
        <strong style="color:#111;font-size:14px;margin-left:10px">${escHtml(p.Price)} <span style="font-size:10px;font-weight:400;color:#888">¢/L</span></strong>
      </div>`)
    .join("");

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const sid = stationId(props);
  const isFav = getFavorites().has(sid);
  const esc = escHtml;

  const btnBase = "border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;padding:7px 4px;display:flex;align-items:center;justify-content:center;gap:4px;flex:1;";

  return `
    <div style="min-width:230px;font-family:system-ui,sans-serif;padding:2px 0">
      <div style="margin-bottom:10px">
        <div style="font-size:15px;font-weight:700;color:#111;line-height:1.3;margin-bottom:3px">${esc(props.Name)}</div>
        <div style="font-size:12px;color:#666;margin-bottom:1px">${esc(props.brand ?? "")} &middot; ${esc(props.Region)}</div>
        <div style="font-size:11.5px;color:#999">${esc(props.Address)}</div>
      </div>

      <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:10px">
        ${priceChips}
      </div>

      <div style="display:flex;gap:5px;margin-bottom:5px">
        <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer"
          style="${btnBase}background:#4285f4;color:#fff;text-decoration:none;flex:2">
          ${SVG.navigation} Itinéraire
        </a>
        <button onclick="window.__toggleFav('${esc(sid)}')"
          style="${btnBase}background:${isFav ? "#ff9800" : "#f0f0f0"};color:${isFav ? "#fff" : "#555"}">
          ${isFav ? SVG.star : SVG.starEmpty} Favori
        </button>
      </div>

      <div style="display:flex;gap:5px">
        <button onclick="window.__showHistory('${esc(props.Name)}','${esc(props.Address)}')"
          style="${btnBase}background:#ede9fe;color:#6d28d9">
          ${SVG.barChart} Historique
        </button>
        <button onclick="window.__showReviews('${esc(props.Name)}','${esc(props.Address)}')"
          style="${btnBase}background:#e0f2fe;color:#0369a1">
          ${SVG.messageCircle} Commentaires
        </button>
        <button onclick="window.__showReport('${esc(props.Name)}','${esc(props.Address)}')"
          style="${btnBase}background:#fee2e2;color:#dc2626">
          ${SVG.flag} Signaler
        </button>
      </div>
    </div>
  `;
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
  priceMin,
  priceMax,
  hasFilter,
}: {
  gasType: GasTypeKey;
  data: GeoJSON.FeatureCollection;
  priceMin: number;
  priceMax: number;
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

  const seen = new Set<string>();
  const markers = data.features.flatMap((f) => {
    const feature = f as Feature<Point, StationProperties>;
    const [lng, lat] = feature.geometry.coordinates;
    const props = feature.properties;
    const id = stationId(props);
    if (seen.has(id)) return [];
    seen.add(id);
    return [
      <Marker
        key={id}
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
    ];
  });

  if (hasFilter) {
    return <>{markers}</>;
  }

  return (
    <MarkerClusterGroup
      key={gasType + priceMin + priceMax}
      chunkedLoading
      maxClusterRadius={60}
      iconCreateFunction={(cluster: unknown) => createClusterIcon(cluster, gasType, min, max)}
    >
      {markers}
    </MarkerClusterGroup>
  );
});

const CURSOR_COLORS = ["#e63946","#457b9d","#2a9d8f","#e9c46a","#f4a261","#264653","#6a4c93","#1982c4","#8ac926","#ff595e"];

function hashColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return CURSOR_COLORS[Math.abs(h) % CURSOR_COLORS.length];
}

function getCursorUserId() {
  let id = localStorage.getItem("cursor_user_id");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("cursor_user_id", id); }
  return id;
}

function LiveCursors({ showCursors, onOnlineCount }: { showCursors: boolean; onOnlineCount: (n: number) => void }) {
  const map = useMap();
  const markersRef = useRef<Record<string, L.Marker>>({});
  const channelRef = useRef<ReturnType<ReturnType<typeof createBrowserClient>["channel"]> | null>(null);
  const lastSendRef = useRef(0);
  const userIdRef = useRef("");
  const showRef = useRef(showCursors);
  const cursorsRef = useRef<Record<string, { lat: number; lng: number; color: string; uid: string }>>({});

  useEffect(() => {
    showRef.current = showCursors;
  }, [showCursors]);

  // Show/hide markers when toggle changes
  useEffect(() => {
    if (showCursors) {
      for (const [uid, data] of Object.entries(cursorsRef.current)) {
        if (!markersRef.current[uid]) {
          const icon = L.divIcon({
            html: `<div style="width:12px;height:12px;background:${data.color};border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.3);"></div>`,
            className: "",
            iconSize: [50, 30],
            iconAnchor: [25, 6],
          });
          markersRef.current[uid] = L.marker([data.lat, data.lng], { icon, interactive: false, zIndexOffset: 9999 }).addTo(map);
        }
      }
    } else {
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {};
    }
  }, [showCursors, map]);

  // Always connect: broadcast own cursor + receive others
  useEffect(() => {
    const userId = getCursorUserId();
    userIdRef.current = userId;
    const color = hashColor(userId);
    const supabase = createBrowserClient();
    const channel = supabase.channel("live-cursors", { config: { broadcast: { self: false } } });
    channelRef.current = channel;

    channel.on("broadcast", { event: "cursor" }, ({ payload }) => {
      const { user_id, lat, lng, color: c } = payload as { user_id: string; lat: number; lng: number; color: string };
      if (user_id === userId) return;
      cursorsRef.current[user_id] = { lat, lng, color: c, uid: user_id };
      if (!showRef.current) return;
      const existing = markersRef.current[user_id];
      if (existing) {
        existing.setLatLng([lat, lng]);
      } else {
        const icon = L.divIcon({
          html: `<div style="width:12px;height:12px;background:${c};border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.3);"></div>`,
          className: "",
          iconSize: [50, 30],
          iconAnchor: [25, 6],
        });
        markersRef.current[user_id] = L.marker([lat, lng], { icon, interactive: false, zIndexOffset: 9999 }).addTo(map);
      }
    });

    channel.on("broadcast", { event: "leave" }, ({ payload }) => {
      const { user_id } = payload as { user_id: string };
      delete cursorsRef.current[user_id];
      markersRef.current[user_id]?.remove();
      delete markersRef.current[user_id];
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      onOnlineCount(Object.keys(state).length);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ user_id: userId, color });
      }
    });

    const onMouseMove = (e: L.LeafletMouseEvent) => {
      const now = Date.now();
      if (now - lastSendRef.current < 60) return;
      lastSendRef.current = now;
      channel.send({ type: "broadcast", event: "cursor", payload: { user_id: userId, lat: e.latlng.lat, lng: e.latlng.lng, color } });
    };

    map.on("mousemove", onMouseMove);

    return () => {
      map.off("mousemove", onMouseMove);
      channel.send({ type: "broadcast", event: "leave", payload: { user_id: userId } });
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {};
      cursorsRef.current = {};
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [map, onOnlineCount]);

  return null;
}

export default function Map() {
  const [gasType, setGasType] = useState<GasTypeKey>(
    () => (readSearchParam("type") as GasTypeKey) || "Régulier"
  );
  const [brand, setBrand] = useState(() => readSearchParam("brand") || "");
  const [region, setRegion] = useState(() => readSearchParam("region") || "");
  const [search, setSearch] = useState(() => readSearchParam("ville") || "");
  const [mapStyle, setMapStyle] = useState<"carte" | "satellite" | "dark">(
    () => (readSearchParam("style") as "carte" | "satellite" | "dark") || "carte"
  );
  const [showRegionPanel, setShowRegionPanel] = useState(false);
  const [showCityPanel, setShowCityPanel] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [historyStation, setHistoryStation] = useState<{ name: string; address: string } | null>(null);
  const [reportStation, setReportStation] = useState<{ name: string; address: string } | null>(null);
  const [showLogin, setShowLogin] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).has("openLogin");
  });
  const [showChangelog, setShowChangelog] = useState(false);
  const [commentStation, setCommentStation] = useState<{ name: string; address: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<{ email: string } | null>(null);
  const [cheapestResults, setCheapestResults] = useState<{ stations: { lat: number; lng: number; price: number; name: string; dist: number }[]; message: string } | null>(null);
  const [radiusKm, setRadiusKm] = useState(0);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favs, setFavs] = useState<Set<string>>(() => getFavorites());
  const [data, setData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [geoReady, setGeoReady] = useState(false);
  const [flyTarget, setFlyTarget] = useState<{ center: [number, number]; zoom: number } | null>(null);
  const [showCursors, setShowCursors] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const handleOnlineCount = useCallback((n: number) => setOnlineCount(n), []);

  useEffect(() => {
    const sb = createBrowserClient();
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setCurrentUser({ email: session.user.email });
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user?.email ? { email: session.user.email } : null);
    });
    return () => subscription.unsubscribe();
  }, []);


  useEffect(() => {
    let cancelled = false;
    let retryTimer: number | null = null;

    const applyStations = (geojson: GeoJSON.FeatureCollection) => {
      if (cancelled) {
        return;
      }

      setData(decorateStationGeoJson(geojson));
    };

    const cached = sessionStorage.getItem(STATIONS_CACHE_KEY);
    if (cached) {
      try {
        applyStations(JSON.parse(cached) as GeoJSON.FeatureCollection);
      } catch {}
    }

    const loadStations = async () => {
      try {
        const response = await fetch("/api/stations", { cache: "no-store" });
        const payload = (await response.json()) as StationsApiPayload;

        if (payload.data) {
          try {
            sessionStorage.setItem(
              STATIONS_CACHE_KEY,
              JSON.stringify(payload.data)
            );
          } catch {}

          applyStations(payload.data);
          return;
        }
      } catch (error) {
        console.error(error);
      }

      if (!cancelled) {
        retryTimer = window.setTimeout(loadStations, 5000);
      }
    };

    void loadStations();

    // Re-fetch toutes les 5 minutes pour détecter les changements de prix
    const pollInterval = window.setInterval(loadStations, 5 * 60 * 1000);

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
    return () => {
      cancelled = true;
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
      }
      window.clearInterval(pollInterval);
      window.removeEventListener("favorites-changed", onFavChange);
    };
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
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2000);
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      queueMicrotask(() => setGeoReady(true));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPos([latitude, longitude]);
        let geoZoom = 12;
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
          if (nearestRegion) {
            setRegion(nearestRegion);
            const regionZooms: Record<string, number> = { "Montréal": 11, "Laval": 12 };
            if (regionZooms[nearestRegion]) geoZoom = regionZooms[nearestRegion];
          }
        }
        const city = await reverseGeocode(latitude, longitude);
        if (city) {
          setSearch(city);
          if (normalize(city) === normalize("Saint-Georges")) geoZoom = 13;
        }
        setFlyTarget({ center: [latitude, longitude], zoom: geoZoom });
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
        const cityZoom = normalize(v) === normalize("Saint-Georges") ? 13 : 12;
        setFlyTarget({ center: [avgLat, avgLng], zoom: cityZoom });
      }
    } else {
      setFlyTarget(null);
    }
  }
  const REGION_ZOOM: Record<string, number> = { "Montréal": 11, "Laval": 12 };
  function handleRegionChange(v: string) {
    setRegion(v);
    setSearch("");
    if (v && REGION_CENTERS[v]) {
      setFlyTarget({ center: REGION_CENTERS[v], zoom: REGION_ZOOM[v] ?? 9 });
    } else {
      setFlyTarget(null);
    }
  }
  function handleBrandChange(v: string) {
    setBrand(v);
  }

  function findCheapestNearby() {
    if (!data) return;
    if (radiusKm === 0) setRadiusKm(5);
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

  const { priceMin, priceMax } = useMemo(() => {
    if (!data) return { priceMin: 0, priceMax: 0 };
    let min = Infinity, max = -Infinity;
    data.features.forEach((f) => {
      const p = (f as Feature<Point, StationProperties>).properties.Prices.find((pr) => pr.GasType === gasType && pr.IsAvailable);
      if (!p) return;
      const v = parsePrice(p.Price);
      if (v < min) min = v;
      if (v > max) max = v;
    });
    return { priceMin: min === Infinity ? 0 : min, priceMax: max === -Infinity ? 0 : max };
  }, [data, gasType]);

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
          await createBrowserClient().auth.signOut();
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
              : '&copy; <a href="https://www.linkedin.com/in/mathieu-fournier-4977591bb" target="_blank" title="mathieufournierqc@outlook.com">Mathieu Fournier</a> | <a href="/tech" target="_blank">À propos</a>'
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
        <div className="flex flex-col gap-1.5 leaflet-control" style={{ position: "absolute", bottom: 30, left: 12, zIndex: 1000, width: 170 }}>
          <div>
            <Button
              variant={cheapestResults ? "outline" : "default"}
              size="sm"
              className={`w-full shadow-md font-semibold text-[13px] ${!cheapestResults ? "!bg-[#2d9a2d] hover:!bg-[#2d9a2d]/90 !text-white" : "!bg-[var(--bg-panel)] !text-[var(--text)]"}`}
              onClick={() => { if (cheapestResults) { setCheapestResults(null); setRadiusKm(0); } else findCheapestNearby(); }}
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
          <Button variant="outline" size="sm" className="w-full shadow-md !bg-[var(--bg-panel)] !text-[var(--text)] !border-0 font-semibold text-[13px]" onClick={() => { setShowCityPanel(false); setShowRegionPanel((v) => !v); }}>
            <BarChart3 className="size-3.5" />
            Prix par région
          </Button>
          <Button variant="outline" size="sm" className="w-full shadow-md !bg-[var(--bg-panel)] !text-[var(--text)] !border-0 font-semibold text-[13px]" onClick={() => { setShowRegionPanel(false); setShowCityPanel((v) => !v); }}>
            <Building2 className="size-3.5" />
            Prix par ville
          </Button>
          <Button variant="outline" size="sm" className="w-full shadow-md !bg-[var(--bg-panel)] !text-[var(--text)] !border-0 font-semibold text-[13px]" onClick={shareLink}>
            <Share2 className="size-3.5" />
            Partager
          </Button>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className={`flex-1 shadow-md !border-0 font-semibold text-[13px] ${mapStyle === "satellite" ? "!bg-[#457b9d] !text-white" : "!bg-[var(--bg-panel)] !text-[var(--text)]"}`} onClick={() => setMapStyle(mapStyle === "satellite" ? "carte" : "satellite")}>
              Satellite
            </Button>
            <Button variant="outline" size="sm" className={`flex-1 shadow-md !border-0 font-semibold text-[13px] ${mapStyle === "dark" ? "!bg-[#1a1a2e] !text-white" : "!bg-[var(--bg-panel)] !text-[var(--text)]"}`} onClick={() => setMapStyle(mapStyle === "dark" ? "carte" : "dark")}>
              Carte Dark
            </Button>
          </div>
          <Button variant="outline" size="sm" className={`w-full shadow-md font-semibold text-[13px] ${showCursors ? "!bg-[#457b9d] !text-white" : "!bg-[var(--bg-panel)] !text-[var(--text)]"} !border-0`} onClick={() => setShowCursors((v) => !v)}>
            <Users className="size-3.5" />
            {showCursors ? `En ligne (${onlineCount})` : "Visiteurs"}
          </Button>
          {userPos && (
            <div className="bg-[var(--bg-panel)] rounded-md shadow-md px-3 py-2">
              <div className="text-xs font-semibold mb-1">
                Rayon : {radiusKm === 0 ? "Tout" : `${radiusKm} km`}
              </div>
              <Slider
                min={0}
                max={50}
                step={5}
                value={[radiusKm]}
                onValueChange={(v) => setRadiusKm(Array.isArray(v) ? v[0] : v)}
                className="w-full"
              />
            </div>
          )}
          <div className="bg-[var(--bg-panel)] rounded-md shadow-md px-3 py-2">
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 700, marginBottom: 3 }}>
              <span style={{ color: "#2d9a2d" }}>{priceMin.toFixed(1)}¢</span>
              <span style={{ color: "#e63946" }}>{priceMax.toFixed(1)}¢</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "linear-gradient(to right, #2d9a2d, #6fbf3b, #f0c808, #ef8a17, #e63946)" }} />
          </div>
        </div>
        <AttributionControl position="bottomleft" />
        {userPos && radiusKm > 0 && (
          <Circle
            center={userPos}
            radius={radiusKm * 1000}
            pathOptions={{ color: "#4285f4", fillColor: "#4285f4", fillOpacity: 0.08, weight: 2 }}
          />
        )}
        <LiveCursors showCursors={showCursors} onOnlineCount={handleOnlineCount} />
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
        {filtered && geoReady && <StationsLayer gasType={gasType} data={filtered} priceMin={priceMin} priceMax={priceMax} hasFilter={!!(search || region || brand || showFavorites || radiusKm > 0)} />}
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
      {data && (
        <RegionPricePanel
          data={data}
          gasType={gasType}
          visible={showRegionPanel}
          onClose={() => setShowRegionPanel(false)}
        />
      )}
      {data && (
        <CityPricePanel
          data={data}
          gasType={gasType}
          visible={showCityPanel}
          onClose={() => setShowCityPanel(false)}
        />
      )}
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
        <CommentsModal stationName={commentStation.name} address={commentStation.address} onClose={() => setCommentStation(null)} userEmail={currentUser?.email} />
      )}
      {showLogin && <LoginModal onClose={() => {
        setShowLogin(false);
        const url = new URL(window.location.href);
        url.searchParams.delete("openLogin");
        window.history.replaceState(null, "", url.toString());
      }} />}
      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
      <AnimatePresence>
        {shareToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: "var(--bg-panel)", color: "var(--text)", padding: "0.5rem 1rem", borderRadius: "0.5rem", boxShadow: "0 4px 12px rgba(0,0,0,0.2)", fontSize: "0.8125rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.375rem" }}
          >
            <Share2 className="size-3.5" style={{ color: "#2d9a2d" }} /> Lien copié !
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
