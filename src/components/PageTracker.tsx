"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createBrowserClient } from "@/lib/auth";

export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const key = `pv_${pathname}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    createBrowserClient()
      .from("page_views")
      .insert({ session_id: crypto.randomUUID(), page: pathname })
      .then(() => {});
  }, [pathname]);

  return null;
}
