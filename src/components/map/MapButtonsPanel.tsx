import React from "react";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  X, Share2, BarChart3, Users, ChevronLeft, ChevronRight,
  Trophy, Satellite, Moon, MapPin, Settings, Map as MapIcon,
} from "lucide-react";

interface MapButtonsPanelProps {
  mapPanelOpen: boolean;
  setMapPanelOpen: (fn: (v: boolean) => boolean) => void;
  cheapestResults: { stations: { lat: number; lng: number; price: number; name: string; dist: number; durationMin?: number; effectivePrice?: number }[]; message: string } | null;
  onToggleCheapest: () => void;
  showEffectiveSettings: boolean;
  setShowEffectiveSettings: (fn: (v: boolean) => boolean) => void;
  settingsBtnRef: React.RefObject<HTMLButtonElement | null>;
  settingsPanelRef: React.RefObject<HTMLDivElement | null>;
  radiusKm: number;
  setRadiusKm: (v: number) => void;
  consoLper100: number;
  setConsoLper100: (v: number) => void;
  tankVolume: number;
  setTankVolume: (v: number) => void;
  showRadiusCircle: boolean;
  setShowRadiusCircle: (v: boolean) => void;
  showPricePanel: boolean;
  setShowPricePanel: (fn: (v: boolean) => boolean) => void;
  onShareLink: () => void;
  mapStyle: "carte" | "satellite" | "dark";
  onCycleMapStyle: () => void;
  showCursors: boolean;
  setShowCursors: (fn: (v: boolean) => boolean) => void;
  onlineCount: number;
  devPinMode: boolean;
  setDevPinMode: (fn: (v: boolean) => boolean) => void;
  isDev: boolean;
  priceMin: number;
  priceMax: number;
}

export default function MapButtonsPanel(props: MapButtonsPanelProps) {
  const {
    mapPanelOpen, setMapPanelOpen,
    cheapestResults, onToggleCheapest,
    showEffectiveSettings, setShowEffectiveSettings,
    settingsBtnRef, settingsPanelRef,
    radiusKm, setRadiusKm,
    consoLper100, setConsoLper100,
    tankVolume, setTankVolume,
    showRadiusCircle, setShowRadiusCircle,
    showPricePanel, setShowPricePanel,
    onShareLink,
    mapStyle, onCycleMapStyle,
    showCursors, setShowCursors,
    onlineCount,
    devPinMode, setDevPinMode, isDev,
    priceMin, priceMax,
  } = props;

  return (
    <div
      className="map-buttons-panel flex flex-col gap-1.5 leaflet-control"
      style={{ position: "absolute", bottom: 30, left: 12, zIndex: 1000, width: 170 }}
      ref={(el) => { if (el) L.DomEvent.disableClickPropagation(el); }}
    >
      <button
        className="map-panel-toggle"
        onClick={() => setMapPanelOpen((v) => !v)}
        aria-label={mapPanelOpen ? "Masquer les boutons" : "Afficher les boutons"}
      >
        {mapPanelOpen ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
      </button>
      <AnimatePresence>
        {mapPanelOpen && (
          <motion.div
            className="flex flex-col gap-1.5"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col gap-1 relative">
              <div className="flex gap-0.5">
                <Button
                  variant={cheapestResults ? "default" : "outline"}
                  size="sm"
                  className={`map-panel-btn flex-1 shadow-md font-semibold text-[13px] !rounded-r-none ${cheapestResults ? "!bg-[#2d9a2d] hover:!bg-[#2d9a2d]/90 !text-white" : "!bg-[var(--bg-panel)] !text-[var(--text)]"}`}
                  onClick={onToggleCheapest}
                >
                  <Trophy className="size-4" />
                  <span className="map-btn-label">{cheapestResults ? "Masquer" : "Meilleur prix"}</span>
                </Button>
                <Button
                  ref={settingsBtnRef}
                  variant="outline"
                  size="sm"
                  className={`map-panel-btn shadow-md !rounded-l-none !px-2 ${showEffectiveSettings ? "!bg-[#2d7a9a] !text-white" : "!bg-[var(--bg-panel)] !text-[var(--text)] !border-0"}`}
                  onClick={() => setShowEffectiveSettings((v) => !v)}
                >
                  <Settings className="size-4" />
                </Button>
              </div>
              <AnimatePresence>
                {showEffectiveSettings && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="map-settings-panel bg-[var(--bg-panel)] rounded-lg shadow-lg px-4 py-3 overflow-hidden"
                    ref={(el: HTMLDivElement | null) => {
                      const mutableRef = settingsPanelRef as React.MutableRefObject<HTMLDivElement | null>;
                      mutableRef.current = el;
                      if (el) {
                        L.DomEvent.disableClickPropagation(el);
                        L.DomEvent.disableScrollPropagation(el);
                        el.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: false });
                        el.addEventListener("touchmove", (e) => { e.stopPropagation(); e.preventDefault(); }, { passive: false });
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-semibold">Réglages</div>
                      <button onClick={() => setShowEffectiveSettings(() => false)} className="text-red-500 hover:text-red-700">
                        <X className="size-3.5" />
                      </button>
                    </div>
                    <div className="mb-2">
                      <div className="text-[11px] text-[var(--text-muted)] mb-1">Rayon : {radiusKm === 0 ? "Tout" : `${radiusKm} km`}</div>
                      <Slider
                        min={0}
                        max={50}
                        step={5}
                        value={[radiusKm]}
                        onValueChange={(v) => setRadiusKm(Array.isArray(v) ? v[0] : v)}
                        className="w-full"
                      />
                    </div>
                    <div className="mb-2">
                      <div className="text-[11px] text-[var(--text-muted)] mb-1">Consommation : {consoLper100} L/100km</div>
                      <Slider
                        min={4}
                        max={20}
                        step={0.5}
                        value={[consoLper100]}
                        onValueChange={(v) => { const val = Array.isArray(v) ? v[0] : v; setConsoLper100(val); localStorage.setItem("eff_conso", String(val)); }}
                        className="w-full"
                      />
                    </div>
                    <div className="mb-2">
                      <div className="text-[11px] text-[var(--text-muted)] mb-1">Réservoir : {tankVolume} L</div>
                      <Slider
                        min={15}
                        max={100}
                        step={5}
                        value={[tankVolume]}
                        onValueChange={(v) => { const val = Array.isArray(v) ? v[0] : v; setTankVolume(val); localStorage.setItem("eff_tank", String(val)); }}
                        className="w-full"
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showRadiusCircle}
                        onChange={(e) => { setShowRadiusCircle(e.target.checked); localStorage.setItem("eff_showRadius", String(e.target.checked)); }}
                        className="accent-[#4285f4] w-3.5 h-3.5"
                      />
                      <span className="text-[11px] text-[var(--text-muted)]">Afficher le cercle du rayon</span>
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Button
              variant="outline"
              size="sm"
              className={`map-panel-btn w-full shadow-md !border-0 font-semibold text-[13px] ${showPricePanel ? "!bg-[#457b9d] !text-white" : "!bg-[var(--bg-panel)] !text-[var(--text)]"}`}
              onClick={() => setShowPricePanel((v) => !v)}
            >
              <BarChart3 className="size-3.5" />
              <span className="map-btn-label">Prix moyens</span>
            </Button>
            <Button variant="outline" size="sm" className="map-panel-btn w-full shadow-md !bg-[var(--bg-panel)] !text-[var(--text)] !border-0 font-semibold text-[13px]" onClick={onShareLink}>
              <Share2 className="size-3.5" />
              <span className="map-btn-label">Partager</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`map-panel-btn w-full shadow-md !border-0 font-semibold text-[13px] ${mapStyle !== "carte" ? "!bg-[#457b9d] !text-white" : "!bg-[var(--bg-panel)] !text-[var(--text)]"}`}
              onClick={onCycleMapStyle}
            >
              {mapStyle === "satellite" ? <Satellite className="size-3.5" /> : mapStyle === "dark" ? <Moon className="size-3.5" /> : <MapIcon className="size-3.5" />}
              <span className="map-btn-label">{mapStyle === "carte" ? "Carte" : mapStyle === "satellite" ? "Satellite" : "Dark"}</span>
            </Button>
            <Button variant="outline" size="sm" className={`map-panel-btn map-panel-btn-wide w-full shadow-md font-semibold text-[13px] ${showCursors ? "!bg-[#457b9d] !text-white" : "!bg-[var(--bg-panel)] !text-[var(--text)]"} !border-0`} onClick={() => setShowCursors((v) => !v)}>
              <Users className="size-3.5" />
              <span className="map-btn-count">{onlineCount}</span>
              <span className="map-btn-label">{showCursors ? `En ligne (${onlineCount})` : `Visiteurs en ligne (${onlineCount})`}</span>
            </Button>
            {isDev && (
              <Button
                variant="outline"
                size="sm"
                className={`map-panel-btn w-full shadow-md !border-0 font-semibold text-[13px] ${devPinMode ? "!bg-[#e63946] !text-white" : "!bg-[var(--bg-panel)] !text-[var(--text)]"}`}
                onClick={() => setDevPinMode((v) => !v)}
              >
                <MapPin className="size-3.5" />
                <span className="map-btn-label">{devPinMode ? "Cliquer sur la carte..." : "DEV: Simuler position"}</span>
              </Button>
            )}
            {/* Jauge prix : desktop horizontal inline */}
            <div className="map-panel-widget map-legend-desktop bg-[var(--bg-panel)] rounded-md shadow-md px-3 py-2">
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 700, marginBottom: 3 }}>
                <span style={{ color: "#2d9a2d" }}>{priceMin.toFixed(1)}¢</span>
                <span style={{ color: "#e63946" }}>{priceMax.toFixed(1)}¢</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "linear-gradient(to right, #2d9a2d, #6fbf3b, #f0c808, #ef8a17, #e63946)" }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Jauge prix verticale — mobile seulement, masquée quand panneau fermé */}
      {mapPanelOpen && (
        <div className="map-legend-mobile">
          <div className="map-legend-mobile-inner">
            <span style={{ color: "#e63946", fontSize: 10, fontWeight: 700 }}>{priceMax.toFixed(1)}¢</span>
            <div className="map-legend-mobile-bar" />
            <span style={{ color: "#2d9a2d", fontSize: 10, fontWeight: 700 }}>{priceMin.toFixed(1)}¢</span>
          </div>
        </div>
      )}
    </div>
  );
}
