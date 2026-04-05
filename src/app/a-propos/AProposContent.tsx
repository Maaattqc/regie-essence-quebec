"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

const content = {
  fr: {
    breadcrumb: "Carte des prix",
    projectText: "Essence Québec est une carte interactive gratuite qui affiche les prix de l'essence et du diesel en temps réel dans toutes les régions du Québec. L'objectif est simple : aider les Québécois à trouver le carburant le moins cher près de chez eux.",
    dataText1: "Les prix affichés proviennent de la Régie de l'énergie du Québec (REQ), l'organisme gouvernemental responsable de l'encadrement des prix des carburants dans la province. Ces données sont publiques et en format ouvert.",
    dataText2: "Les snapshots de prix sont archivés pour permettre de consulter l'historique sur les 30 derniers jours.",
    howText1: "Les données sont récupérées régulièrement depuis les sources officielles et mises en cache. La",
    howLink1: "carte interactive",
    howText2: "affiche les prix en temps réel sur une interface Leaflet.js. Consultez la page",
    howLink2: "informations techniques",
    howText3: "pour les détails de l'architecture.",
    contribText1: "Vous pouvez contribuer en signalant les prix incorrects directement depuis la carte. Consultez notre",
    contribLink1: "FAQ",
    contribText2: "pour en savoir plus. Un",
    contribLink2: "historique des mises à jour",
    contribText3: "est disponible.",
    nav: ["Carte des prix", "FAQ", "Historique des mises à jour", "Informations techniques", "Conditions d'utilisation", "Accessibilité", "Se connecter"],
  },
  en: {
    breadcrumb: "Price map",
    projectText: "Essence Québec is a free interactive map displaying real-time gas and diesel prices across all regions of Quebec. The goal is simple: help Quebecers find the cheapest fuel near them.",
    dataText1: "The prices displayed come from the Régie de l'énergie du Québec (REQ), the government body responsible for regulating fuel prices in the province. This data is public and in open format.",
    dataText2: "Price snapshots are archived to allow viewing history over the last 30 days.",
    howText1: "Data is regularly retrieved from official sources and cached. The",
    howLink1: "interactive map",
    howText2: "displays real-time prices on a Leaflet.js interface. See the",
    howLink2: "technical information",
    howText3: "page for architecture details.",
    contribText1: "You can contribute by reporting incorrect prices directly from the map. See our",
    contribLink1: "FAQ",
    contribText2: "to learn more. An",
    contribLink2: "update history",
    contribText3: "is available.",
    nav: ["Price map", "FAQ", "Update history", "Technical info", "Terms of use", "Accessibility", "Sign in"],
  },
};

const navLinks = ["/", "/faq", "/changelog", "/tech", "/conditions-utilisation", "/accessibilite", "/login"];

export default function AProposContent() {
  const { locale, t } = useLanguage();
  const c = content[locale];

  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <nav className="mb-8 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/" className="hover:underline">{c.breadcrumb}</Link>
        {" › "}
        <span>{t.about.title}</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">
        {t.about.title}
      </h1>

      <div className="space-y-8 text-gray-600 dark:text-gray-400">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t.about.project}</h2>
          <p>{c.projectText}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t.about.dataSource}</h2>
          <p>{c.dataText1}</p>
          <p className="mt-2">{c.dataText2}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t.about.howItWorks}</h2>
          <p>
            {c.howText1}{" "}
            <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">{c.howLink1}</Link>{" "}
            {c.howText2}{" "}
            <Link href="/tech" className="text-blue-600 dark:text-blue-400 hover:underline">{c.howLink2}</Link>{" "}
            {c.howText3}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t.about.contribution}</h2>
          <p>
            {c.contribText1}{" "}
            <Link href="/faq" className="text-blue-600 dark:text-blue-400 hover:underline">{c.contribLink1}</Link>{" "}
            {c.contribText2}{" "}
            <Link href="/changelog" className="text-blue-600 dark:text-blue-400 hover:underline">{c.contribLink2}</Link>{" "}
            {c.contribText3}
          </p>
        </section>
      </div>

      <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
        {c.nav.map((label, i) => (
          <Link key={navLinks[i]} href={navLinks[i]} className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
            {label}
          </Link>
        ))}
      </div>
    </main>
  );
}
