"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

const content = {
  fr: {
    breadcrumb: "Carte des prix",
    subtitle: "Prix de l'essence au Québec — Carte interactive",
    q1: "À quelle fréquence les prix de l'essence sont-ils mis à jour ?",
    a1: "Les prix sont mis à jour plusieurs fois par jour. Les données proviennent directement de la Régie de l'énergie du Québec (REQ). Vous consultez toujours des prix en temps réel ou très récents.",
    q2: "La carte des prix d'essence est-elle gratuite ?",
    a2: "Oui, entièrement gratuite. Aucun abonnement, aucune publicité intrusive. La carte interactive est accessible à tous les utilisateurs sans inscription.",
    q3: "Comment trouver la station-service la moins chère près de moi ?",
    a3_1: "Activez la géolocalisation sur",
    a3_link: "la carte",
    a3_2: "ou entrez votre adresse. Utilisez le curseur de rayon pour définir une distance. La carte identifie automatiquement les stations avec le prix le plus bas dans ce rayon.",
    q4: "Quels types de carburant sont affichés ?",
    a4: "La carte affiche tous les types de carburant disponibles : essence régulière (87), super (91), super (94), premium et diesel. Utilisez le filtre en haut de la carte pour sélectionner le type souhaité.",
    q5: "Puis-je signaler un prix incorrect ?",
    a5_1: "Oui. Cliquez sur une station-service sur la carte, puis utilisez le bouton de signalement. Vous devez être",
    a5_link: "connecté",
    a5_2: "pour soumettre un signalement. Votre contribution aide à maintenir l'exactitude des prix.",
    q6: "D'où proviennent les données de prix ?",
    a6_1: "Les prix proviennent de la Régie de l'énergie du Québec (REQ), l'organisme gouvernemental qui encadre les prix des carburants dans la province. Ces données sont publiques et en format ouvert. Consultez la page",
    a6_link: "informations techniques",
    a6_2: "pour plus de détails.",
    q7: "La carte fonctionne-t-elle sur mobile ?",
    a7: "Oui. La carte interactive est entièrement responsive et optimisée pour mobile, tablette et ordinateur. La géolocalisation fonctionne également sur appareil mobile.",
    q8: "Puis-je voir l'historique des prix d'une station ?",
    a8_1: "Oui. Cliquez sur une station sur",
    a8_link: "la carte",
    a8_2: "pour afficher un graphique d'historique des prix sur les 30 derniers jours.",
    nav: ["Carte des prix", "À propos", "Historique des mises à jour", "Informations techniques", "Confidentialité", "Conditions d'utilisation", "Accessibilité"],
  },
  en: {
    breadcrumb: "Price map",
    subtitle: "Quebec gas prices — Interactive map",
    q1: "How often are gas prices updated?",
    a1: "Prices are updated several times a day. Data comes directly from the Régie de l'énergie du Québec (REQ). You are always viewing real-time or very recent prices.",
    q2: "Is the gas price map free?",
    a2: "Yes, completely free. No subscription, no intrusive ads. The interactive map is accessible to all users without registration.",
    q3: "How do I find the cheapest gas station near me?",
    a3_1: "Enable geolocation on",
    a3_link: "the map",
    a3_2: "or enter your address. Use the radius slider to set a distance. The map automatically identifies stations with the lowest price within that radius.",
    q4: "Which fuel types are displayed?",
    a4: "The map displays all available fuel types: regular gasoline (87), super (91), super (94), premium and diesel. Use the filter at the top of the map to select the desired type.",
    q5: "Can I report an incorrect price?",
    a5_1: "Yes. Click on a gas station on the map, then use the report button. You must be",
    a5_link: "signed in",
    a5_2: "to submit a report. Your contribution helps maintain price accuracy.",
    q6: "Where does the price data come from?",
    a6_1: "Prices come from the Régie de l'énergie du Québec (REQ), the government body that regulates fuel prices in the province. This data is public and in open format. See the",
    a6_link: "technical information",
    a6_2: "page for more details.",
    q7: "Does the map work on mobile?",
    a7: "Yes. The interactive map is fully responsive and optimized for mobile, tablet and desktop. Geolocation also works on mobile devices.",
    q8: "Can I see the price history for a station?",
    a8_1: "Yes. Click on a station on",
    a8_link: "the map",
    a8_2: "to display a price history chart for the last 30 days.",
    nav: ["Price map", "About", "Update history", "Technical info", "Privacy", "Terms of use", "Accessibility"],
  },
};

const navLinks = ["/", "/a-propos", "/changelog", "/tech", "/confidentialite", "/conditions-utilisation", "/accessibilite"];

export default function FaqContent() {
  const { locale, t } = useLanguage();
  const c = content[locale];

  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <nav className="mb-8 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/" className="hover:underline">{c.breadcrumb}</Link>
        {" › "}
        <span>{t.faq.title}</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
        {t.faq.title}
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-12">{c.subtitle}</p>

      <div className="space-y-10">
        {[
          { q: c.q1, a: <p className="text-gray-600 dark:text-gray-400">{c.a1}</p> },
          { q: c.q2, a: <p className="text-gray-600 dark:text-gray-400">{c.a2}</p> },
          { q: c.q3, a: <p className="text-gray-600 dark:text-gray-400">{c.a3_1}{" "}<Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">{c.a3_link}</Link>{" "}{c.a3_2}</p> },
          { q: c.q4, a: <p className="text-gray-600 dark:text-gray-400">{c.a4}</p> },
          { q: c.q5, a: <p className="text-gray-600 dark:text-gray-400">{c.a5_1}{" "}<Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">{c.a5_link}</Link>{" "}{c.a5_2}</p> },
          { q: c.q6, a: <p className="text-gray-600 dark:text-gray-400">{c.a6_1}{" "}<Link href="/tech" className="text-blue-600 dark:text-blue-400 hover:underline">{c.a6_link}</Link>{" "}{c.a6_2}</p> },
          { q: c.q7, a: <p className="text-gray-600 dark:text-gray-400">{c.a7}</p> },
          { q: c.q8, a: <p className="text-gray-600 dark:text-gray-400">{c.a8_1}{" "}<Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">{c.a8_link}</Link>{" "}{c.a8_2}</p> },
        ].map(({ q, a }) => (
          <section key={q}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{q}</h2>
            {a}
          </section>
        ))}
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
