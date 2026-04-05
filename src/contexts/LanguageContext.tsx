"use client";

import { createContext, useContext, useEffect, useState } from "react";
import fr from "@/lib/i18n/fr";
import en from "@/lib/i18n/en";
import type { Translations } from "@/lib/i18n/fr";

type Locale = "fr" | "en";

interface LanguageContextValue {
  locale: Locale;
  t: Translations;
  toggle: () => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "fr",
  t: fr,
  toggle: () => {},
});

const STORAGE_KEY = "eq-locale";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") return "fr";
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved === "en" || saved === "fr") return saved;
    // Auto-detect browser language — default to FR unless browser is explicitly English
    return (navigator.language || "").startsWith("en") ? "en" : "fr";
  });

  const toggle = () => {
    setLocale((prev) => {
      const next: Locale = prev === "fr" ? "en" : "fr";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  const t = locale === "fr" ? fr : en;

  return (
    <LanguageContext.Provider value={{ locale, t, toggle }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
