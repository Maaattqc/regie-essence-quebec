import { useEffect, useState } from "react";
import type { Feature, Point } from "geojson";
import {
  type StationProperties,
  distanceKm,
  normalize,
  reverseGeocode,
} from "@/lib/stations";

interface UseGeolocationOptions {
  data: GeoJSON.FeatureCollection | null;
  setRegion: (v: string) => void;
  setSearch: (v: string) => void;
  setFlyTarget: (v: { center: [number, number]; zoom: number } | null) => void;
}

export function useGeolocation({ data, setRegion, setSearch, setFlyTarget }: UseGeolocationOptions) {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [geoReady, setGeoReady] = useState(false);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return { userPos, setUserPos, geoReady };
}
