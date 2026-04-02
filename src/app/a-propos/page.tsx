import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Essence Québec est une carte interactive gratuite des prix de l'essence au Québec, basée sur les données officielles de la Régie de l'énergie du Québec.",
};

export default function AProposPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <nav className="mb-8 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/" className="hover:underline">
          Carte des prix
        </Link>
        {" › "}
        <span>À propos</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">
        À propos d&apos;Essence Québec
      </h1>

      <div className="space-y-8 text-gray-600 dark:text-gray-400">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Le projet
          </h2>
          <p>
            Essence Québec est une carte interactive gratuite qui affiche les
            prix de l&apos;essence et du diesel en temps réel dans toutes les
            régions du Québec. L&apos;objectif est simple : aider les
            Québécois à trouver le carburant le moins cher près de chez eux.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Source des données
          </h2>
          <p>
            Les prix affichés proviennent de la Régie de l&apos;énergie du
            Québec (REQ), l&apos;organisme gouvernemental responsable de
            l&apos;encadrement des prix des carburants dans la province. Ces
            données sont publiques et en format ouvert.
          </p>
          <p className="mt-2">
            Les snapshots de prix sont archivés pour permettre de consulter
            l&apos;historique sur les 30 derniers jours.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Fonctionnement
          </h2>
          <p>
            Les données sont récupérées régulièrement depuis les sources
            officielles et mises en cache. La{" "}
            <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
              carte interactive
            </Link>{" "}
            affiche les prix en temps réel sur une interface Leaflet.js.
            Consultez la page{" "}
            <Link href="/tech" className="text-blue-600 dark:text-blue-400 hover:underline">
              informations techniques
            </Link>{" "}
            pour les détails de l&apos;architecture.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Contribution
          </h2>
          <p>
            Vous pouvez contribuer en signalant les prix incorrects directement
            depuis la carte. Consultez notre{" "}
            <Link href="/faq" className="text-blue-600 dark:text-blue-400 hover:underline">
              FAQ
            </Link>{" "}
            pour en savoir plus. Un{" "}
            <Link href="/changelog" className="text-blue-600 dark:text-blue-400 hover:underline">
              historique des mises à jour
            </Link>{" "}
            est disponible.
          </p>
        </section>
      </div>

      <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
          Carte des prix
        </Link>
        <Link href="/faq" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
          FAQ
        </Link>
        <Link href="/changelog" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
          Historique des mises à jour
        </Link>
        <Link href="/tech" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
          Informations techniques
        </Link>
        <Link href="/login" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
          Se connecter
        </Link>
      </div>
    </main>
  );
}
