"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { createBrowserClient } from "@/lib/auth";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

function useTrackPageView() {
  useEffect(() => {
    const key = "pv_tracked";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    const sessionId = crypto.randomUUID();
    createBrowserClient()
      .from("page_views")
      .insert({ session_id: sessionId })
      .then(() => {});
  }, []);
}

export default function MapClient() {
  useTrackPageView();
  return <Map />;
}
