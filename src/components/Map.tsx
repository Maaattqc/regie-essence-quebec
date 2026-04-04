"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMapAuth } from "@/hooks/useMapAuth";
import { useStationsData } from "@/hooks/useStationsData";
import { useGeolocation } from "@/hooks/useGeolocation";
import { MapContainer, TileLayer, ZoomControl, AttributionControl } from "react-leaflet";
import { Marker, Circle, Polyline } from "react-leaflet";
import L from "leaflet";
import type { Feature, Point } from "geojson";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Share2 } from "lucide-react";
import FilterBar from "@/components/FilterBar";
import { createBrowserClient } from "@/lib/auth";

import LoginModal from "@/components/LoginModal";
import ChangelogModal from "@/components/ChangelogModal";
import ReportModal from "@/components/ReportModal";
import SuggestionModal from "@/components/SuggestionModal";
import CommentsModal from "@/components/CommentsModal";
import PricePanel from "@/components/PricePanel";
import StationsLayer from "@/components/map/StationsLayer";
import LiveCursors from "@/components/map/LiveCursors";
import { FlyTo, DevClickHandler, DragController } from "@/components/map/MapControls";
import MapButtonsPanel from "@/components/map/MapButtonsPanel";
import "@/components/map/leaflet-patches";
import {
  type StationProperties,
  type GasTypeKey,
  REGION_CENTERS,
  QUEBEC_CENTER,
  QUEBEC_ZOOM,
  stationId,
  parsePrice,
  distanceKm,
  effectivePrice,
  roadDistances,
  roadRoute,
  normalize,
  deduplicateCities,
} from "@/lib/stations";
import "leaflet/dist/leaflet.css";

const PriceChart = dynamic(() => import("./PriceChart"), { ssr: false });

function readSearchParam(name: string) {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
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
  const [showPricePanel, setShowPricePanel] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [historyStation, setHistoryStation] = useState<{ name: string; address: string } | null>(null);
  const [reportStation, setReportStation] = useState<{ name: string; address: string } | null>(null);
  const [showLogin, setShowLogin] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).has("openLogin");
  });
  const [showChangelog, setShowChangelog] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [commentStation, setCommentStation] = useState<{ name: string; address: string } | null>(null);
  const { currentUser, setCurrentUser } = useMapAuth();
  const [cheapestResults, setCheapestResults] = useState<{ stations: { lat: number; lng: number; price: number; name: string; dist: number; durationMin?: number; effectivePrice?: number }[]; message: string } | null>(null);
  const [cheapestRoute, setCheapestRoute] = useState<[number, number][] | null>(null);
  const [radiusKm, setRadiusKm] = useState(0);
  const [showFavorites, setShowFavorites] = useState(false);
  const [flyTarget, setFlyTarget] = useState<{ center: [number, number]; zoom: number } | null>(null);
  const { data, favs } = useStationsData({ setHistoryStation, setReportStation, setCommentStation });
  const { userPos, setUserPos, geoReady } = useGeolocation({ data, setRegion, setSearch, setFlyTarget });
  const [showCursors, setShowCursors] = useState(false);
  const [mapPanelOpen, setMapPanelOpen] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);
  const handleOnlineCount = useCallback((n: number) => setOnlineCount(n), []);
  const [devPinMode, setDevPinMode] = useState(false);
  const isDev = process.env.NODE_ENV === "development";
  const [showEffectiveSettings, setShowEffectiveSettings] = useState(false);
  const settingsPanelRef = useRef<HTMLDivElement>(null);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);
  const [showRadiusCircle, setShowRadiusCircle] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("eff_showRadius") === "true";
  });
  const [consoLper100, setConsoLper100] = useState(() => {
    if (typeof window === "undefined") return 9;
    return Number(localStorage.getItem("eff_conso")) || 9;
  });
  const [tankVolume, setTankVolume] = useState(() => {
    if (typeof window === "undefined") return 40;
    return Number(localStorage.getItem("eff_tank")) || 40;
  });

  useEffect(() => {
    if (!showEffectiveSettings) return;
    function handlePointerDown(e: PointerEvent) {
      if (
        settingsPanelRef.current && !settingsPanelRef.current.contains(e.target as Node) &&
        (!settingsBtnRef.current || !settingsBtnRef.current.contains(e.target as Node))
      ) {
        setShowEffectiveSettings(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [showEffectiveSettings]);


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

  const autoSearchDone = useRef(false);
  useEffect(() => {
    if (autoSearchDone.current || !data || !userPos || !geoReady) return;
    autoSearchDone.current = true;
    findBestEffectivePrice(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, userPos, geoReady]);

  // Recalculer le meilleur prix quand le type d'essence change
  const prevGasType = useRef(gasType);
  useEffect(() => {
    if (prevGasType.current === gasType) return;
    prevGasType.current = gasType;
    if (cheapestResults && userPos && data) {
      findBestEffectivePrice(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gasType]);

  function handleSearchChange(v: string) {
    setSearch(v);
    setRadiusKm(0);
    setCheapestResults(null); setCheapestRoute(null);
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
    } else if (region && REGION_CENTERS[region]) {
      setFlyTarget({ center: REGION_CENTERS[region], zoom: REGION_ZOOM[region] ?? 9 });
    } else {
      setFlyTarget(null);
    }
  }
  const REGION_ZOOM: Record<string, number> = { "Montréal": 11, "Laval": 12 };
  function handleRegionChange(v: string) {
    setRegion(v);
    setSearch("");
    setRadiusKm(0);
    setCheapestResults(null); setCheapestRoute(null);
    if (!v) {
      setFlyTarget({ center: QUEBEC_CENTER, zoom: QUEBEC_ZOOM });
    } else if (REGION_CENTERS[v]) {
      setFlyTarget({ center: REGION_CENTERS[v], zoom: REGION_ZOOM[v] ?? 9 });
    } else {
      setFlyTarget(null);
    }
  }
  function handleBrandChange(v: string) {
    setBrand(v);
    setRadiusKm(0);
    setCheapestResults(null); setCheapestRoute(null);
  }


  function findBestEffectivePrice(skipZoom = false) {
    if (!data) return;
    if (radiusKm === 0) setRadiusKm(5);
    const doSearch = async (latitude: number, longitude: number) => {
      const r = radiusKm > 0 ? radiusKm : 5;
      // 1) Filtrage Haversine rapide
      const prefiltered: { lat: number; lng: number; price: number; name: string; haversineDist: number }[] = [];
      data.features.forEach((f) => {
        const feature = f as Feature<Point, StationProperties>;
        const props = feature.properties;
        const [lng, lat] = feature.geometry.coordinates;
        const dist = distanceKm(latitude, longitude, lat, lng);
        if (dist > r) return;
        const p = props.Prices.find((pr) => pr.GasType === gasType && pr.IsAvailable);
        if (!p) return;
        prefiltered.push({ lat, lng, price: parsePrice(p.Price), name: props.Name, haversineDist: dist });
      });
      if (prefiltered.length === 0) {
        setCheapestResults({ stations: [], message: `Aucune station trouvée dans un rayon de ${r} km` });
        return;
      }
      // 2) Trier par prix effectif Haversine, garder top 15 pour Mapbox
      prefiltered.sort((a, b) =>
        effectivePrice(a.price, a.haversineDist, consoLper100, tankVolume) -
        effectivePrice(b.price, b.haversineDist, consoLper100, tankVolume),
      );
      const top = prefiltered.slice(0, 15);
      // 3) Distances + durées routières réelles (Mapbox avec trafic)
      const destinations = top.map((c) => [c.lat, c.lng] as [number, number]);
      const roadInfos = await roadDistances([latitude, longitude], destinations);
      // 4) Recalculer avec distances réelles (fallback Haversine)
      const candidates = top.map((c, i) => {
        const dist = roadInfos[i].distKm ?? c.haversineDist;
        const durationMin = roadInfos[i].durationMin ?? undefined;
        return { ...c, dist, durationMin, effectivePrice: effectivePrice(c.price, dist, consoLper100, tankVolume) };
      });
      candidates.sort((a, b) => a.effectivePrice - b.effectivePrice);
      const best = candidates[0];
      const saving = best.effectivePrice - best.price;
      const durText = best.durationMin != null ? ` · ~${Math.round(best.durationMin)} min` : "";
      const msg = `${best.name} — ${best.price.toFixed(1)}¢/L · ${best.dist.toFixed(1)} km${durText} (réel : ${best.effectivePrice.toFixed(1)}¢/L, +${saving.toFixed(1)}¢ trajet)`;
      setCheapestResults({ stations: [best], message: msg });
      if (!skipZoom) setFlyTarget({ center: [best.lat, best.lng], zoom: 15 });
      roadRoute([latitude, longitude], [best.lat, best.lng]).then((details) => {
        if (details) setCheapestRoute(details.path);
      });
    };
    if (userPos) {
      doSearch(userPos[0], userPos[1]);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          setUserPos([p.coords.latitude, p.coords.longitude]);
          doSearch(p.coords.latitude, p.coords.longitude);
        },
        () => {
          setCheapestResults({ stations: [], message: "Activez la géolocalisation pour utiliser cette fonctionnalité." });
        },
      );
    } else {
      setCheapestResults({ stations: [], message: "La géolocalisation n'est pas disponible sur cet appareil." });
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
        onGasTypeChange={(v) => { setGasType(v); }}
        brand={brand}
        onBrandChange={handleBrandChange}
        region={region}
        onRegionChange={handleRegionChange}
        search={search}
        onSearchChange={handleSearchChange}
        cities={cities}
        showFavorites={showFavorites}
        onToggleFavorites={() => { setShowFavorites((v) => !v); setRadiusKm(0); setCheapestResults(null); setCheapestRoute(null); }}
        regionCounts={regionCounts}
        brandCounts={brandCounts}
        cityCounts={cityCounts}
        totalStations={totalStations}
        onLoginClick={() => setShowLogin(true)}
        onChangelogClick={() => setShowChangelog(true)}
        onSuggestionClick={() => setShowSuggestion(true)}
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
              : '&copy; <a href="https://www.linkedin.com/in/mathieu-fournier-4977591bb" target="_blank" rel="noopener noreferrer" title="mathieufournierqc@outlook.com">Mathieu Fournier</a> | <a href="/tech" target="_blank" rel="noopener noreferrer">À propos</a>'
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
        <MapButtonsPanel
          mapPanelOpen={mapPanelOpen}
          setMapPanelOpen={setMapPanelOpen}
          cheapestResults={cheapestResults}
          onToggleCheapest={() => { if (cheapestResults) { setCheapestResults(null); setCheapestRoute(null); setRadiusKm(0); } else { findBestEffectivePrice(); } }}
          showEffectiveSettings={showEffectiveSettings}
          setShowEffectiveSettings={setShowEffectiveSettings}
          settingsBtnRef={settingsBtnRef}
          settingsPanelRef={settingsPanelRef}
          radiusKm={radiusKm}
          setRadiusKm={setRadiusKm}
          consoLper100={consoLper100}
          setConsoLper100={setConsoLper100}
          tankVolume={tankVolume}
          setTankVolume={setTankVolume}
          showRadiusCircle={showRadiusCircle}
          setShowRadiusCircle={setShowRadiusCircle}
          showPricePanel={showPricePanel}
          setShowPricePanel={setShowPricePanel}
          onShareLink={shareLink}
          mapStyle={mapStyle}
          onCycleMapStyle={() => {
            const styles = ["carte", "satellite", "dark"] as const;
            const idx = styles.indexOf(mapStyle as typeof styles[number]);
            setMapStyle(styles[(idx + 1) % styles.length]);
          }}
          showCursors={showCursors}
          setShowCursors={setShowCursors}
          onlineCount={onlineCount}
          devPinMode={devPinMode}
          setDevPinMode={setDevPinMode}
          isDev={isDev}
          priceMin={priceMin}
          priceMax={priceMax}
        />
        <AttributionControl position="bottomleft" />
        {userPos && (
          <>
            <Marker
              position={userPos}
              icon={L.divIcon({
                html: `<div class="user-pos-marker"><div class="user-pos-pulse"></div><div class="user-pos-dot"></div></div>`,
                className: "",
                iconSize: [40, 40],
                iconAnchor: [20, 20],
              })}
            />
            {radiusKm > 0 && showRadiusCircle && (
              <Circle
                center={userPos}
                radius={radiusKm * 1000}
                pathOptions={{ color: "#4285f4", fillColor: "#4285f4", fillOpacity: 0.08, weight: 2 }}
              />
            )}
          </>
        )}
        <LiveCursors showCursors={showCursors} onOnlineCount={handleOnlineCount} />
        <DragController disabled={showEffectiveSettings} />
        {flyTarget && <FlyTo center={flyTarget.center} zoom={flyTarget.zoom} />}
        {devPinMode && (
          <DevClickHandler onPin={(lat, lng) => {
            setUserPos([lat, lng]);
            setDevPinMode(false);
          }} />
        )}
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
        {userPos && cheapestResults?.stations.map((s, i) => (
          <Polyline
            key={`cheapest-line-${i}`}
            positions={cheapestRoute ?? [userPos, [s.lat, s.lng]]}
            pathOptions={{ color: "#2d9a2d", weight: 5, opacity: 0.9, dashArray: "10 8" }}
          />
        ))}
        {cheapestResults?.stations.map((s, i) => (
          <Marker
            key={`cheapest-${i}`}
            position={[s.lat, s.lng]}
            interactive={false}
            icon={L.divIcon({
              html: `<div class="cheapest-pulse"><div class="cheapest-label">${s.name}<br><small>${s.dist.toFixed(1)} km${s.durationMin ? ` · ${Math.round(s.durationMin)} min <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>` : ""}</small></div></div>`,
              className: "cheapest-icon-passthrough",
              iconSize: [20, 20],
              iconAnchor: [10, 20],
            })}
          />
        ))}
      </MapContainer>
      {data && (
        <PricePanel
          data={data}
          gasType={gasType}
          visible={showPricePanel}
          onClose={() => setShowPricePanel(false)}
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
      {showSuggestion && <SuggestionModal onClose={() => setShowSuggestion(false)} />}
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
