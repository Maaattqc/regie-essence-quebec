"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMapAuth } from "@/hooks/useMapAuth";
import { useStationsData } from "@/hooks/useStationsData";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useEffectivePrice } from "@/hooks/useEffectivePrice";
import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
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
  normalize,
  deduplicateCities,
} from "@/lib/stations";
import "leaflet/dist/leaflet.css";

const PriceChart = dynamic(() => import("./PriceChart"), { ssr: false });

const REGION_ZOOM: Record<string, number> = { "Montréal": 11, "Laval": 12 };

const USER_POS_ICON = L.divIcon({
  html: `<div class="user-pos-marker"><div class="user-pos-pulse"></div><div class="user-pos-dot"></div></div>`,
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function readSearchParam(name: string) {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

export default function Map() {
  const { t } = useLanguage();
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
  const [radiusKm, setRadiusKm] = useState(0);
  const [showFavorites, setShowFavorites] = useState(false);
  const [flyTarget, setFlyTarget] = useState<{ center: [number, number]; zoom: number } | null>(null);
  const { data, favs, lastUpdatedAt } = useStationsData({ setHistoryStation, setReportStation, setCommentStation });
  const lastUpdatedLabel = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })
    : null;
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

  const { cheapestResults, cheapestRoute, findBestEffectivePrice, clearCheapest } = useEffectivePrice({
    data, gasType, userPos, setUserPos, geoReady,
    radiusKm, setRadiusKm, consoLper100, tankVolume, setFlyTarget,
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

  const shareLink = useCallback(() => {
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
  }, [search, region, gasType, brand, mapStyle]);

  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    setRadiusKm(0);
    clearCheapest();
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
  }, [data, region, clearCheapest, setFlyTarget]);

  const handleRegionChange = useCallback((v: string) => {
    setRegion(v);
    setSearch("");
    setRadiusKm(0);
    clearCheapest();
    if (!v) {
      setFlyTarget({ center: QUEBEC_CENTER, zoom: QUEBEC_ZOOM });
    } else if (REGION_CENTERS[v]) {
      setFlyTarget({ center: REGION_CENTERS[v], zoom: REGION_ZOOM[v] ?? 9 });
    } else {
      setFlyTarget(null);
    }
  }, [clearCheapest, setFlyTarget]);

  const handleBrandChange = useCallback((v: string) => {
    setBrand(v);
    setRadiusKm(0);
    clearCheapest();
  }, [clearCheapest]);

  const handleGasTypeChange = useCallback((v: GasTypeKey) => setGasType(v), []);

  const handleToggleFavorites = useCallback(() => {
    setShowFavorites((v) => !v);
    setRadiusKm(0);
    clearCheapest();
  }, [clearCheapest]);

  const handleToggleCheapest = useCallback(() => {
    if (cheapestResults) { clearCheapest(); setRadiusKm(0); }
    else findBestEffectivePrice();
  }, [cheapestResults, clearCheapest, findBestEffectivePrice]);

  const handleLogout = useCallback(async () => {
    await createBrowserClient().auth.signOut();
    setCurrentUser(null);
  }, [setCurrentUser]);

  const handleLoginClick = useCallback(() => setShowLogin(true), []);
  const handleChangelogClick = useCallback(() => setShowChangelog(true), []);
  const handleSuggestionClick = useCallback(() => setShowSuggestion(true), []);

  const handleCycleMapStyle = useCallback(() => {
    const styles = ["carte", "satellite", "dark"] as const;
    setMapStyle((prev) => {
      const idx = styles.indexOf(prev as typeof styles[number]);
      return styles[(idx + 1) % styles.length];
    });
  }, []);

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
        onGasTypeChange={handleGasTypeChange}
        brand={brand}
        onBrandChange={handleBrandChange}
        region={region}
        onRegionChange={handleRegionChange}
        search={search}
        onSearchChange={handleSearchChange}
        cities={cities}
        showFavorites={showFavorites}
        onToggleFavorites={handleToggleFavorites}
        regionCounts={regionCounts}
        brandCounts={brandCounts}
        cityCounts={cityCounts}
        totalStations={totalStations}
        onLoginClick={handleLoginClick}
        onChangelogClick={handleChangelogClick}
        onSuggestionClick={handleSuggestionClick}
        currentUser={currentUser}
        onLogout={handleLogout}
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
              ? '&copy; Esri &mdash; Esri, Maxar, Earthstar Geographics | Données&nbsp;: <a href="https://www.regie-energie.qc.ca" target="_blank" rel="noopener noreferrer">Régie de l\'énergie</a> | &copy; <a href="https://www.linkedin.com/in/mathieu-fournier-4977591bb" target="_blank" rel="noopener noreferrer">Mathieu Fournier</a> | <a href="/tech" target="_blank" rel="noopener noreferrer">À propos</a>'
              : mapStyle === "dark"
              ? '&copy; <a href="https://carto.com/" target="_blank" rel="noopener noreferrer">CARTO</a> | Données&nbsp;: <a href="https://www.regie-energie.qc.ca" target="_blank" rel="noopener noreferrer">Régie de l\'énergie</a> | &copy; <a href="https://www.linkedin.com/in/mathieu-fournier-4977591bb" target="_blank" rel="noopener noreferrer">Mathieu Fournier</a> | <a href="/tech" target="_blank" rel="noopener noreferrer">À propos</a>'
              : '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors | Données&nbsp;: <a href="https://www.regie-energie.qc.ca" target="_blank" rel="noopener noreferrer">Régie de l\'énergie</a> | &copy; <a href="https://www.linkedin.com/in/mathieu-fournier-4977591bb" target="_blank" rel="noopener noreferrer">Mathieu Fournier</a> | <a href="/tech" target="_blank" rel="noopener noreferrer">À propos</a>'
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
          onToggleCheapest={handleToggleCheapest}
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
          onCycleMapStyle={handleCycleMapStyle}
          showCursors={showCursors}
          setShowCursors={setShowCursors}
          onlineCount={onlineCount}
          devPinMode={devPinMode}
          setDevPinMode={setDevPinMode}
          isDev={isDev}
          priceMin={priceMin}
          priceMax={priceMax}
        />
        {userPos && (
          <>
            <Marker position={userPos} icon={USER_POS_ICON} />
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
              {!data ? t.map.loadingStations : t.map.loadingGeo}
            </motion.div>
          )}
        </AnimatePresence>
        {filtered && geoReady && <StationsLayer gasType={gasType} data={filtered} priceMin={priceMin} priceMax={priceMax} hasFilter={!!(search || region || brand || showFavorites || radiusKm > 0)} />}
        {userPos && cheapestResults?.stations.map((s) => (
          <Polyline
            key={`cheapest-line-${s.name}-${s.lat}-${s.lng}`}
            positions={cheapestRoute ?? [userPos, [s.lat, s.lng]]}
            pathOptions={{ color: "#2d9a2d", weight: 5, opacity: 0.9, dashArray: "10 8" }}
          />
        ))}
        {cheapestResults?.stations.map((s) => (
          <Marker
            key={`cheapest-${s.name}-${s.lat}-${s.lng}`}
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
      <div className="absolute left-0 right-0 z-[400] pointer-events-none" style={{ bottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="pointer-events-auto w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-t border-gray-200/60 dark:border-gray-700/60 text-[8px] md:text-[11px] text-gray-600 dark:text-gray-400 px-2 md:px-3 py-1 leading-snug text-right md:text-center whitespace-nowrap overflow-hidden">
          {mapStyle === "satellite" ? (
            <>&copy; <a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer" className="underline">Leaflet</a> &nbsp;|&nbsp; &copy; Esri, Maxar &nbsp;|&nbsp; <a href="https://www.regie-energie.qc.ca" target="_blank" rel="noopener noreferrer" className="underline">Régie de l&apos;énergie</a>{lastUpdatedLabel && <> &nbsp;|&nbsp; {t.map.lastUpdated(lastUpdatedLabel)}</>} &nbsp;|&nbsp; &copy; <a href="https://www.linkedin.com/in/mathieu-fournier-4977591bb" target="_blank" rel="noopener noreferrer" className="underline">Mathieu Fournier</a> &nbsp;|&nbsp; <a href="/tech" target="_blank" rel="noopener noreferrer" className="underline">{t.nav.about}</a></>
          ) : mapStyle === "dark" ? (
            <>&copy; <a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer" className="underline">Leaflet</a> &nbsp;|&nbsp; &copy; <a href="https://carto.com/" target="_blank" rel="noopener noreferrer" className="underline">CARTO</a> &nbsp;|&nbsp; <a href="https://www.regie-energie.qc.ca" target="_blank" rel="noopener noreferrer" className="underline">Régie de l&apos;énergie</a>{lastUpdatedLabel && <> &nbsp;|&nbsp; {t.map.lastUpdated(lastUpdatedLabel)}</>} &nbsp;|&nbsp; &copy; <a href="https://www.linkedin.com/in/mathieu-fournier-4977591bb" target="_blank" rel="noopener noreferrer" className="underline">Mathieu Fournier</a> &nbsp;|&nbsp; <a href="/tech" target="_blank" rel="noopener noreferrer" className="underline">{t.nav.about}</a></>
          ) : (
            <>&copy; <a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer" className="underline">Leaflet</a> &nbsp;|&nbsp; &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap</a> &nbsp;|&nbsp; <a href="https://www.regie-energie.qc.ca" target="_blank" rel="noopener noreferrer" className="underline">Régie de l&apos;énergie</a>{lastUpdatedLabel && <> &nbsp;|&nbsp; {t.map.lastUpdated(lastUpdatedLabel)}</>} &nbsp;|&nbsp; &copy; <a href="https://www.linkedin.com/in/mathieu-fournier-4977591bb" target="_blank" rel="noopener noreferrer" className="underline">Mathieu Fournier</a> &nbsp;|&nbsp; <a href="/tech" target="_blank" rel="noopener noreferrer" className="underline">{t.nav.about}</a></>
          )}
        </div>
      </div>
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
            <Share2 className="size-3.5" style={{ color: "#2d9a2d" }} /> {t.map.linkCopied}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
