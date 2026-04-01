"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Chrome subpixel rendering gaps between tiles
// https://github.com/Leaflet/Leaflet/issues/3575
L.Browser.any3d = false;

const QUEBEC_CENTER: [number, number] = [52.0, -72.0];
const QUEBEC_ZOOM = 5;

export default function Map() {
  return (
    <MapContainer
      center={QUEBEC_CENTER}
      zoom={QUEBEC_ZOOM}
      style={{ height: "100vh", width: "100vw" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
}
