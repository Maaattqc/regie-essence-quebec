import { useEffect, useState } from "react";
import type { Feature, Point } from "geojson";
import {
  type StationProperties,
  extractCity,
  normalize,
  toggleFavorite,
  getFavorites,
} from "@/lib/stations";

const STATIONS_CACHE_KEY = "stations-api-cache";

interface StationsApiPayload {
  ok: boolean;
  data: GeoJSON.FeatureCollection | null;
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

  useEffect(() => {
    let cancelled = false;
    let retryTimer: number | null = null;

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

    const loadStations = async () => {
      try {
        const response = await fetch("/api/stations", { cache: "no-store" });
        if (!response.ok && response.status !== 202) {
          if (response.status === 429) { retryTimer = window.setTimeout(loadStations, 3000); return; }
          throw new Error(`HTTP ${response.status}`);
        }
        const payload = (await response.json()) as StationsApiPayload;

        if (payload.data) {
          try {
            sessionStorage.setItem(STATIONS_CACHE_KEY, JSON.stringify(payload.data));
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
    const pollInterval = window.setInterval(loadStations, 5 * 60 * 1000);

    (window as unknown as Record<string, unknown>).__toggleFav = (id: string) => {
      const updated = toggleFavorite(id);
      setFavs(new Set(updated));
    };
    (window as unknown as Record<string, unknown>).__showHistory = (name: string, address: string) => {
      callbacks.setHistoryStation({ name, address });
    };
    (window as unknown as Record<string, unknown>).__showReport = (name: string, address: string) => {
      callbacks.setReportStation({ name, address });
    };
    (window as unknown as Record<string, unknown>).__showReviews = (name: string, address: string) => {
      callbacks.setCommentStation({ name, address });
    };
    const onFavChange = () => setFavs(getFavorites());
    window.addEventListener("favorites-changed", onFavChange);
    return () => {
      cancelled = true;
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      window.clearInterval(pollInterval);
      window.removeEventListener("favorites-changed", onFavChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, favs };
}
