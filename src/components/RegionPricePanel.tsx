"use client";

import { memo, useMemo } from "react";
import type { Feature, Point } from "geojson";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useMap } from "react-leaflet";
import {
  type StationProperties,
  type GasTypeKey,
  parsePrice,
} from "@/lib/stations";

function useDisableMapDrag() {
  const map = useMap();
  return {
    onMouseDown: () => map.dragging.disable(),
    onMouseUp: () => map.dragging.enable(),
    onTouchStart: () => map.dragging.disable(),
    onTouchEnd: () => map.dragging.enable(),
  };
}

const RegionPricePanel = memo(function RegionPricePanel({
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
  useDisableMapDrag();

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

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="panel top-[60px] left-3 w-[280px] max-h-[70vh] overflow-y-auto"
          style={{ position: "absolute", zIndex: 1000 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex justify-between items-center mb-2">
            <strong>Prix moyen par région ({gasType})</strong>
            <Button variant="ghost" size="icon-xs" onClick={onClose}>
              <X className="size-3.5" />
            </Button>
          </div>
          <table className="w-full border-collapse">
            <tbody>
              {regionAvgs.map(({ region, avg }, i) => (
                <tr key={region} className={i % 2 === 0 ? "bg-[var(--row-alt)]" : "bg-transparent"}>
                  <td className="py-1 px-1.5">{region}</td>
                  <td className="py-1 px-1.5 text-right font-semibold">
                    {avg.toFixed(1)}¢
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default RegionPricePanel;
