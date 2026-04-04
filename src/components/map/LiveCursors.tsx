import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { createBrowserClient } from "@/lib/auth";

const CURSOR_COLORS = ["#e63946","#457b9d","#2a9d8f","#e9c46a","#f4a261","#264653","#6a4c93","#1982c4","#8ac926","#ff595e"];

function hashColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return CURSOR_COLORS[Math.abs(h) % CURSOR_COLORS.length];
}

function getCursorUserId() {
  let id = localStorage.getItem("cursor_user_id");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("cursor_user_id", id); }
  return id;
}

export default function LiveCursors({ showCursors, onOnlineCount }: { showCursors: boolean; onOnlineCount: (n: number) => void }) {
  const map = useMap();
  const markersRef = useRef<Record<string, L.Marker>>({});
  const channelRef = useRef<ReturnType<ReturnType<typeof createBrowserClient>["channel"]> | null>(null);
  const lastSendRef = useRef(0);
  const userIdRef = useRef("");
  const showRef = useRef(showCursors);
  const cursorsRef = useRef<Record<string, { lat: number; lng: number; color: string; uid: string }>>({});

  useEffect(() => {
    showRef.current = showCursors;
  }, [showCursors]);

  // Show/hide markers when toggle changes
  useEffect(() => {
    if (showCursors) {
      for (const [uid, data] of Object.entries(cursorsRef.current)) {
        if (!markersRef.current[uid]) {
          const icon = L.divIcon({
            html: `<div style="width:12px;height:12px;background:${data.color};border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.3);"></div>`,
            className: "",
            iconSize: [50, 30],
            iconAnchor: [25, 6],
          });
          markersRef.current[uid] = L.marker([data.lat, data.lng], { icon, interactive: false, zIndexOffset: 9999 }).addTo(map);
        }
      }
    } else {
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {};
    }
  }, [showCursors, map]);

  // Always connect: broadcast own cursor + receive others
  useEffect(() => {
    const userId = getCursorUserId();
    userIdRef.current = userId;
    const color = hashColor(userId);
    const supabase = createBrowserClient();
    const channel = supabase.channel("live-cursors", { config: { broadcast: { self: false } } });
    channelRef.current = channel;

    channel.on("broadcast", { event: "cursor" }, ({ payload }) => {
      const { user_id, lat, lng, color: c } = payload as { user_id: string; lat: number; lng: number; color: string };
      if (user_id === userId) return;
      cursorsRef.current[user_id] = { lat, lng, color: c, uid: user_id };
      if (!showRef.current) return;
      const existing = markersRef.current[user_id];
      if (existing) {
        existing.setLatLng([lat, lng]);
      } else {
        const icon = L.divIcon({
          html: `<div style="width:12px;height:12px;background:${c};border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.3);"></div>`,
          className: "",
          iconSize: [50, 30],
          iconAnchor: [25, 6],
        });
        markersRef.current[user_id] = L.marker([lat, lng], { icon, interactive: false, zIndexOffset: 9999 }).addTo(map);
      }
    });

    channel.on("broadcast", { event: "leave" }, ({ payload }) => {
      const { user_id } = payload as { user_id: string };
      delete cursorsRef.current[user_id];
      markersRef.current[user_id]?.remove();
      delete markersRef.current[user_id];
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      onOnlineCount(Object.keys(state).length);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ user_id: userId, color });
      }
    });

    const onMouseMove = (e: L.LeafletMouseEvent) => {
      if (!showRef.current) return;
      const now = Date.now();
      if (now - lastSendRef.current < 60) return;
      lastSendRef.current = now;
      channel.send({ type: "broadcast", event: "cursor", payload: { user_id: userId, lat: e.latlng.lat, lng: e.latlng.lng, color } });
    };

    map.on("mousemove", onMouseMove);

    return () => {
      map.off("mousemove", onMouseMove);
      channel.send({ type: "broadcast", event: "leave", payload: { user_id: userId } });
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {};
      cursorsRef.current = {};
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [map, onOnlineCount]);

  return null;
}
