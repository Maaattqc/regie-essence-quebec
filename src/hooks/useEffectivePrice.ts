import { useCallback, useEffect, useRef, useState } from "react";
import type { Feature, Point } from "geojson";
import {
  type StationProperties,
  type GasTypeKey,
  parsePrice,
  distanceKm,
  effectivePrice,
  roadDistances,
  roadRoute,
} from "@/lib/stations";

export interface CheapestStation {
  lat: number;
  lng: number;
  price: number;
  name: string;
  dist: number;
  durationMin?: number;
  effectivePrice?: number;
}

export interface CheapestResults {
  stations: CheapestStation[];
  message: string;
}

const MAPBOX_TOP_N = 15;
const DEFAULT_RADIUS_KM = 5;

interface UseEffectivePriceParams {
  data: GeoJSON.FeatureCollection | null;
  gasType: GasTypeKey;
  userPos: [number, number] | null;
  setUserPos: (pos: [number, number]) => void;
  geoReady: boolean;
  radiusKm: number;
  setRadiusKm: (v: number) => void;
  consoLper100: number;
  tankVolume: number;
  setFlyTarget: (v: { center: [number, number]; zoom: number } | null) => void;
}

export function useEffectivePrice({
  data, gasType, userPos, setUserPos, geoReady,
  radiusKm, setRadiusKm, consoLper100, tankVolume, setFlyTarget,
}: UseEffectivePriceParams) {
  const [cheapestResults, setCheapestResults] = useState<CheapestResults | null>(null);
  const [cheapestRoute, setCheapestRoute] = useState<[number, number][] | null>(null);

  // Refs pour les valeurs utilisées dans findBestEffectivePrice sans re-créer le callback
  const dataRef = useRef(data);
  const gasTypeRef = useRef(gasType);
  const userPosRef = useRef(userPos);
  const radiusRef = useRef(radiusKm);
  const consoRef = useRef(consoLper100);
  const tankRef = useRef(tankVolume);
  useEffect(() => {
    dataRef.current = data;
    gasTypeRef.current = gasType;
    userPosRef.current = userPos;
    radiusRef.current = radiusKm;
    consoRef.current = consoLper100;
    tankRef.current = tankVolume;
  });

  const findBestEffectivePrice = useCallback((skipZoom = false) => {
    const currentData = dataRef.current;
    const currentGasType = gasTypeRef.current;
    const currentUserPos = userPosRef.current;
    const savedRadius = typeof window !== "undefined" ? Number(localStorage.getItem("eff_radius")) || DEFAULT_RADIUS_KM : DEFAULT_RADIUS_KM;
    const r = radiusRef.current > 0 ? radiusRef.current : savedRadius;
    const conso = consoRef.current;
    const tank = tankRef.current;

    if (!currentData) return;
    if (radiusRef.current === 0) setRadiusKm(savedRadius);

    const doSearch = async (latitude: number, longitude: number) => {
      // 1) Filtrage Haversine rapide
      const prefiltered: { lat: number; lng: number; price: number; name: string; haversineDist: number }[] = [];
      currentData.features.forEach((f) => {
        const feature = f as Feature<Point, StationProperties>;
        const props = feature.properties;
        const [lng, lat] = feature.geometry.coordinates;
        const dist = distanceKm(latitude, longitude, lat, lng);
        if (dist > r) return;
        const p = props.Prices.find((pr) => pr.GasType === currentGasType && pr.IsAvailable);
        if (!p) return;
        prefiltered.push({ lat, lng, price: parsePrice(p.Price), name: props.Name, haversineDist: dist });
      });
      if (prefiltered.length === 0) {
        setCheapestResults({ stations: [], message: `Aucune station trouvée dans un rayon de ${r} km` });
        return;
      }
      // 2) Trier par prix effectif Haversine, garder top N pour Mapbox
      prefiltered.sort((a, b) =>
        effectivePrice(a.price, a.haversineDist, conso, tank) -
        effectivePrice(b.price, b.haversineDist, conso, tank),
      );
      const top = prefiltered.slice(0, MAPBOX_TOP_N);
      // 3) Distances + durées routières réelles (Mapbox avec trafic)
      const destinations = top.map((c) => [c.lat, c.lng] as [number, number]);
      const roadInfos = await roadDistances([latitude, longitude], destinations);
      // 4) Recalculer avec distances réelles (fallback Haversine)
      const candidates = top.map((c, i) => {
        const dist = roadInfos[i].distKm ?? c.haversineDist;
        const durationMin = roadInfos[i].durationMin ?? undefined;
        return { ...c, dist, durationMin, effectivePrice: effectivePrice(c.price, dist, conso, tank) };
      });
      candidates.sort((a, b) => a.effectivePrice! - b.effectivePrice!);
      const best = candidates[0];
      const saving = best.effectivePrice! - best.price;
      const durText = best.durationMin != null ? ` · ~${Math.round(best.durationMin)} min` : "";
      const msg = `${best.name} — ${best.price.toFixed(1)}¢/L · ${best.dist.toFixed(1)} km${durText} (réel : ${best.effectivePrice!.toFixed(1)}¢/L, +${saving.toFixed(1)}¢ trajet)`;
      setCheapestResults({ stations: [best], message: msg });
      if (!skipZoom) setFlyTarget({ center: [best.lat, best.lng], zoom: 15 });
      roadRoute([latitude, longitude], [best.lat, best.lng]).then((details) => {
        if (details) setCheapestRoute(details.path);
      });
    };

    if (currentUserPos) {
      doSearch(currentUserPos[0], currentUserPos[1]);
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
  }, [setRadiusKm, setFlyTarget, setUserPos]);

  const clearCheapest = useCallback(() => {
    setCheapestResults(null);
    setCheapestRoute(null);
  }, []);

  // Auto-search au premier chargement (setState intentionnel en réponse aux données)
  const autoSearchDone = useRef(false);
  useEffect(() => {
    if (autoSearchDone.current || !data || !userPos || !geoReady) return;
    autoSearchDone.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- déclenché une seule fois quand les données arrivent
    findBestEffectivePrice(true);
  }, [data, userPos, geoReady, findBestEffectivePrice]);

  // Recalculer quand le type d'essence change
  const prevGasType = useRef(gasType);
  useEffect(() => {
    if (prevGasType.current === gasType) return;
    prevGasType.current = gasType;
    if (cheapestResults && userPos && data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- recalcul en réponse au changement de type
      findBestEffectivePrice(true);
    }
  }, [gasType, cheapestResults, userPos, data, findBestEffectivePrice]);

  return { cheapestResults, cheapestRoute, findBestEffectivePrice, clearCheapest };
}
