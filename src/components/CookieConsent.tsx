"use client";

import { useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import Link from "next/link";

const CONSENT_KEY = "cookie-consent";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

function getServerSnapshot() {
  return "ssr";
}

function saveConsent(analytics: boolean) {
  localStorage.setItem(
    CONSENT_KEY,
    JSON.stringify({ analytics, timestamp: new Date().toISOString() }),
  );
}

export default function CookieConsent() {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [accepted, setAccepted] = useState(false);

  const visible = !stored && !accepted;

  function accept(analytics: boolean) {
    saveConsent(analytics);
    setAccepted(true);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 inset-x-0 z-[9999] p-4"
        >
          <div className="mx-auto max-w-3xl rounded-xl border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-900 sm:p-5">
            <div className="flex items-start gap-3">
              <Cookie className="mt-0.5 size-5 shrink-0 text-amber-600" />
              <div className="flex-1 space-y-3">
                <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                  Ce site utilise des cookies essentiels au fonctionnement ainsi
                  que des cookies analytiques (Sentry) pour améliorer votre
                  expérience. Conformément à la{" "}
                  <Link
                    href="/confidentialite"
                    className="underline underline-offset-2 hover:text-neutral-900 dark:hover:text-white"
                  >
                    Loi 25
                  </Link>
                  , vous pouvez choisir les cookies que vous acceptez.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => accept(true)}
                    className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                  >
                    Tout accepter
                  </button>
                  <button
                    onClick={() => accept(false)}
                    className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    Nécessaires seulement
                  </button>
                </div>
              </div>
              <button
                onClick={() => accept(false)}
                className="shrink-0 rounded-lg p-1 text-neutral-400 transition-colors hover:text-neutral-600 dark:hover:text-neutral-200"
                aria-label="Fermer"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
