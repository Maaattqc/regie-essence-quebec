import { useEffect, useRef, useState } from "react";
import type { Feature, Point } from "geojson";
import {
  type StationProperties,
  extractCity,
  normalize,
  toggleFavorite,
  getFavorites,
} from "@/lib/stations";

const STATIONS_CACHE_KEY = "stations-api-cache";
const POLL_INTERVAL_MS = 5 * 60 * 1000;
const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = [3000, 10000, 30000];

interface StationsApiPayload {
  ok: boolean;
  data: GeoJSON.FeatureCollection | null;
  meta?: { lastCompletedAt?: string | null };
}

function decorateStationGeoJson(geojson: GeoJSON.FeatureCollection) {
  geojson.features.forEach((feature) => {
    const station = feature as Feature<Point, StationProperties>;
    const city = extractCity(station.properties.Address);
    if (!city) return;
    station.properties._city = city;
    station.properties._cityNorm = normalize(city);
  });
  return geojson;
}

interface StationsCallbacks {
  setHistoryStation: (v: { name: string; address: string }) => void;
  setReportStation: (v: { name: string; address: string }) => void;
  setCommentStation: (v: { name: string; address: string }) => void;
}

export function useStationsData(callbacks: StationsCallbacks) {
  const [data, setData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [favs, setFavs] = useState<Set<string>>(() => getFavorites());
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  // Ref stable pour les callbacks — évite de re-run l'effet quand le parent re-render
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  useEffect(() => {
    let cancelled = false;
    let retryTimer: number | null = null;
    let pollInterval: number | null = null;
    let retryCount = 0;

    const applyStations = (geojson: GeoJSON.FeatureCollection) => {
      if (cancelled) return;
      setData(decorateStationGeoJson(geojson));
    };

    const cached = sessionStorage.getItem(STATIONS_CACHE_KEY);
    if (cached) {
      try {
        applyStations(JSON.parse(cached) as GeoJSON.FeatureCollection);
      } catch {}
    }

    const scheduleRetry = () => {
      if (cancelled || retryCount >= MAX_RETRIES) return;
      const delay = RETRY_BACKOFF_MS[retryCount] ?? RETRY_BACKOFF_MS[RETRY_BACKOFF_MS.length - 1];
      retryCount += 1;
      retryTimer = window.setTimeout(loadStations, delay);
    };

    const loadStations = async () => {
      if (cancelled || document.hidden) return;
      try {
        const response = await fetch("/api/stations", {
          cache: "no-store",
          headers: { "x-app-request": "1" }
        });
        if (!response.ok && response.status !== 202) {
          throw new Error(`HTTP ${response.status}`);
        }
        const payload = (await response.json()) as StationsApiPayload;

        if (payload.data) {
          try {
            sessionStorage.setItem(STATIONS_CACHE_KEY, JSON.stringify(payload.data));
          } catch {}
          applyStations(payload.data);
          if (payload.meta?.lastCompletedAt) setLastUpdatedAt(payload.meta.lastCompletedAt);
          retryCount = 0;
          return;
        }
      } catch {
        // Silenced — retry borné ci-dessous
      }

      scheduleRetry();
    };

    const startPolling = () => {
      if (pollInterval !== null) return;
      pollInterval = window.setInterval(loadStations, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (pollInterval === null) return;
      window.clearInterval(pollInterval);
      pollInterval = null;
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
        if (retryTimer !== null) {
          window.clearTimeout(retryTimer);
          retryTimer = null;
        }
      } else {
        retryCount = 0;
        void loadStations();
        startPolling();
      }
    };

    void loadStations();
    startPolling();
    document.addEventListener("visibilitychange", onVisibilityChange);

    (window as unknown as Record<string, unknown>).__toggleFav = (id: string) => {
      const updated = toggleFavorite(id);
      setFavs(new Set(updated));
    };
    (window as unknown as Record<string, unknown>).__showHistory = (name: string, address: string) => {
      cbRef.current.setHistoryStation({ name, address });
    };
    (window as unknown as Record<string, unknown>).__showReport = (name: string, address: string) => {
      cbRef.current.setReportStation({ name, address });
    };
    (window as unknown as Record<string, unknown>).__showReviews = (name: string, address: string) => {
      cbRef.current.setCommentStation({ name, address });
    };
    const onFavChange = () => setFavs(getFavorites());
    window.addEventListener("favorites-changed", onFavChange);
    return () => {
      cancelled = true;
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("favorites-changed", onFavChange);
    };
  }, []);

  return { data, favs, lastUpdatedAt };
}
