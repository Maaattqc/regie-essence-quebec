import Link from "next/link";
import MapClient from "@/components/MapClient";

export default function Home() {
  return (
    <>
      <section
        className="relative h-screen w-screen"
        aria-label="Carte interactive des prix d'essence au Québec"
      >
        <MapClient />
      </section>

      <main className="sr-only">
        <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">
          <header>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
              Prix de l&apos;essence au Québec — Carte interactive en temps
              réel
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              Essence Québec est un outil gratuit qui vous permet de consulter
              et comparer les prix de l&apos;essence ordinaire, super, premium
              et du diesel dans toutes les régions du Québec. Les données
              proviennent directement de la{" "}
              <a
                href="https://www.regie-energie.qc.ca/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Régie de l&apos;énergie du Québec
              </a>{" "}
              et sont mises à jour régulièrement pour vous offrir une
              information fiable et précise.
            </p>
          </header>

          <section aria-labelledby="features-heading">
            <h2
              id="features-heading"
              className="text-xl font-semibold text-gray-900 dark:text-white mb-4"
            >
              Fonctionnalités principales
            </h2>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400 list-disc list-inside">
              <li>
                Carte interactive affichant les prix actuels de toutes les
                stations-service du Québec
              </li>
              <li>
                Filtrage par type de carburant : essence régulière, super,
                premium et diesel
              </li>
              <li>
                Recherche des stations les moins chères dans un rayon
                personnalisable autour de votre position
              </li>
              <li>Prix moyens par région administrative du Québec</li>
              <li>
                Historique des prix sur les 30 derniers jours sous forme de
                graphique
              </li>
              <li>
                Interface disponible en mode clair et mode sombre, optimisée
                pour mobile et ordinateur
              </li>
              <li>
                Signalement d&apos;erreurs de prix directement depuis la carte
              </li>
            </ul>
          </section>

          <section aria-labelledby="how-heading">
            <h2
              id="how-heading"
              className="text-xl font-semibold text-gray-900 dark:text-white mb-4"
            >
              Comment utiliser la carte ?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Activez la géolocalisation ou recherchez une adresse pour centrer
              la carte sur votre emplacement. Chaque marqueur indique le prix
              par litre de la station correspondante. Cliquez sur un marqueur
              pour voir le détail des prix, l&apos;adresse et l&apos;historique
              des tarifs. Utilisez le curseur de rayon pour trouver
              instantanément la station la moins chère dans votre secteur et
              économiser sur chaque plein d&apos;essence.
            </p>
          </section>

          <section aria-labelledby="regions-heading">
            <h2
              id="regions-heading"
              className="text-xl font-semibold text-gray-900 dark:text-white mb-4"
            >
              Régions couvertes au Québec
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              La carte couvre l&apos;ensemble des régions administratives du
              Québec : Montréal, Québec, Laval, Montérégie, Laurentides,
              Lanaudière, Estrie, Mauricie, Saguenay–Lac-Saint-Jean,
              Bas-Saint-Laurent, Gaspésie–Îles-de-la-Madeleine, Côte-Nord,
              Abitibi-Témiscamingue, Outaouais, Chaudière-Appalaches,
              Centre-du-Québec et Nord-du-Québec. Peu importe où vous vous
              trouvez dans la province, vous pouvez consulter les prix des
              stations-service à proximité.
            </p>
          </section>

          <section aria-labelledby="source-heading">
            <h2
              id="source-heading"
              className="text-xl font-semibold text-gray-900 dark:text-white mb-4"
            >
              Source des données
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Les prix affichés proviennent des données officielles de la Régie
              de l&apos;énergie du Québec (REQ), l&apos;organisme
              gouvernemental responsable de l&apos;encadrement des prix des
              carburants dans la province. Ces données sont publiques et mises
              à disposition sous format ouvert, garantissant la transparence et
              la fiabilité des informations présentées sur la carte.
            </p>
          </section>

          <footer className="pt-4 border-t border-gray-200 dark:border-gray-800 flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
            <Link
              href="/"
              className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
            >
              Carte des prix
            </Link>
            <Link
              href="/changelog"
              className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
            >
              Historique des mises à jour
            </Link>
          </footer>
        </div>
      </main>
    </>
  );
}
