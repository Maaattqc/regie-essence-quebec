import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ — Prix de l'essence au Québec",
  description:
    "Réponses aux questions fréquentes sur la carte des prix de l'essence au Québec : mises à jour, gratuité, signalement de prix, géolocalisation.",
};

export default function FaqPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <nav className="mb-8 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/" className="hover:underline">
          Carte des prix
        </Link>
        {" › "}
        <span>FAQ</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
        Questions fréquentes
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-12">
        Prix de l&apos;essence au Québec — Carte interactive
      </p>

      <div className="space-y-10">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            À quelle fréquence les prix de l&apos;essence sont-ils mis à jour ?
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Les prix sont mis à jour plusieurs fois par jour. Les données
            proviennent directement de la Régie de l&apos;énergie du Québec
            (REQ). Vous consultez toujours des prix en temps réel ou très
            récents.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            La carte des prix d&apos;essence est-elle gratuite ?
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Oui, entièrement gratuite. Aucun abonnement, aucune publicité
            intrusive. La carte interactive est accessible à tous les
            utilisateurs sans inscription.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Comment trouver la station-service la moins chère près de moi ?
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Activez la géolocalisation sur{" "}
            <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
              la carte
            </Link>{" "}
            ou entrez votre adresse. Utilisez le curseur de rayon pour définir
            une distance. La carte identifie automatiquement les stations avec
            le prix le plus bas dans ce rayon.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Quels types de carburant sont affichés ?
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            La carte affiche tous les types de carburant disponibles : essence
            régulière (87), super (91), super (94), premium et diesel. Utilisez
            le filtre en haut de la carte pour sélectionner le type souhaité.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Puis-je signaler un prix incorrect ?
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Oui. Cliquez sur une station-service sur la carte, puis utilisez
            le bouton de signalement. Vous devez être{" "}
            <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
              connecté
            </Link>{" "}
            pour soumettre un signalement. Votre contribution aide à maintenir
            l&apos;exactitude des prix.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            D&apos;où proviennent les données de prix ?
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Les prix proviennent de la Régie de l&apos;énergie du Québec (REQ),
            l&apos;organisme gouvernemental qui encadre les prix des carburants
            dans la province. Ces données sont publiques et en format ouvert.
            Consultez la page{" "}
            <Link href="/tech" className="text-blue-600 dark:text-blue-400 hover:underline">
              informations techniques
            </Link>{" "}
            pour plus de détails.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            La carte fonctionne-t-elle sur mobile ?
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Oui. La carte interactive est entièrement responsive et optimisée
            pour mobile, tablette et ordinateur. La géolocalisation fonctionne
            également sur appareil mobile.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Puis-je voir l&apos;historique des prix d&apos;une station ?
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Oui. Cliquez sur une station sur{" "}
            <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
              la carte
            </Link>{" "}
            pour afficher un graphique d&apos;historique des prix sur les 30
            derniers jours.
          </p>
        </section>
      </div>

      <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
          Carte des prix
        </Link>
        <Link href="/a-propos" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
          À propos
        </Link>
        <Link href="/changelog" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
          Historique des mises à jour
        </Link>
        <Link href="/tech" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
          Informations techniques
        </Link>
      </div>
    </main>
  );
}
