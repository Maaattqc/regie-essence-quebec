"use client";

import { Slider } from "@/components/ui/slider";
import { useMap } from "react-leaflet";

function useDisableMapDrag() {
  const map = useMap();
  return {
    onMouseDown: () => map.dragging.disable(),
    onMouseUp: () => map.dragging.enable(),
    onTouchStart: () => map.dragging.disable(),
    onTouchEnd: () => map.dragging.enable(),
  };
}

export default function RadiusSlider({ radiusKm, onChange }: { radiusKm: number; onChange: (v: number) => void }) {
  const dragProps = useDisableMapDrag();
  return (
    <div className="radius-panel inline-block" {...dragProps}>
      <div className="text-xs font-semibold mb-1">
        Rayon : {radiusKm === 0 ? "Tout" : `${radiusKm} km`}
      </div>
      <Slider
        min={0}
        max={50}
        step={5}
        value={[radiusKm]}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
        className="w-[120px]"
      />
    </div>
  );
}
