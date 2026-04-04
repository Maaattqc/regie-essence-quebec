import { memo, useMemo } from "react";
import { Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import type { Feature, Point } from "geojson";
import {
  type StationProperties,
  type StationPrice,
  type GasTypeKey,
  stationId,
  parsePrice,
  getPriceColor,
} from "@/lib/stations";
import { formatPopup } from "./popup-utils";

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
      iconSize: [48, 26],
      iconAnchor: [24, 13],
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

export default StationsLayer;
