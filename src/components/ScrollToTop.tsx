"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

export default function ScrollToTop({ containerId }: { containerId: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById(containerId);
    if (!el) return;
    const onScroll = () => setVisible(el.scrollTop > 300);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [containerId]);

  function handleClick() {
    document.getElementById(containerId)?.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!visible) return null;

  return (
    <button
      onClick={handleClick}
      aria-label="Retour en haut"
      className="fixed bottom-6 right-6 z-50 size-11 flex items-center justify-center rounded-full bg-[#003DA5] text-white shadow-lg hover:bg-[#002B75] active:scale-95 transition-all"
    >
      <ChevronUp className="size-5" />
    </button>
  );
}
