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
  // Toujours démarrer avec "fr" pour que SSR et premier render client soient identiques.
  // La détection réelle de la langue se fait dans useEffect, après l'hydratation,
  // ce qui évite le mismatch hydration entre serveur (pas de navigator) et client.
  const [locale, setLocale] = useState<Locale>("fr");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    const detected: Locale =
      saved === "en" || saved === "fr"
        ? saved
        : (navigator.language || "").startsWith("en")
          ? "en"
          : "fr";
    // Initialisation unique depuis des APIs navigateur (localStorage, navigator.language)
    // non disponibles côté serveur — setState dans useEffect est intentionnel ici.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocale(detected);
  }, []);

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
