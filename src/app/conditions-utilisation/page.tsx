import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions d'utilisation — Essence Québec",
  description:
    "Conditions générales d'utilisation du site Essence Québec — carte interactive des prix de l'essence au Québec.",
};

const LAST_UPDATED = "4 avril 2026";

export default function ConditionsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <nav className="mb-8 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/" className="hover:underline">
          Carte des prix
        </Link>
        {" › "}
        <span>Conditions d&apos;utilisation</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
        Conditions d&apos;utilisation
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-12">
        Dernière mise à jour : {LAST_UPDATED}
      </p>

      <div className="space-y-10 text-gray-600 dark:text-gray-400">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            1. Acceptation des conditions
          </h2>
          <p>
            En accédant au site Essence Québec (ci-après « le Site »),
            vous acceptez d&apos;être lié par les présentes conditions
            d&apos;utilisation. Si vous n&apos;acceptez pas ces conditions,
            veuillez ne pas utiliser le Site.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            2. Description du service
          </h2>
          <p>
            Le Site est une carte interactive gratuite qui affiche les prix
            de l&apos;essence et du diesel au Québec à partir des données
            publiques de la Régie de l&apos;énergie du Québec (REQ). Le
            service est offert à titre informatif uniquement.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            3. Exactitude des données
          </h2>
          <p>
            Les prix affichés proviennent de sources gouvernementales
            publiques et sont mis à jour plusieurs fois par jour. Malgré
            tous les efforts raisonnables, le Site ne garantit pas
            l&apos;exactitude, l&apos;exhaustivité ni l&apos;actualité des
            prix. Les prix réels en station peuvent différer de ceux
            affichés.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            4. Utilisation acceptable
          </h2>
          <p>Vous vous engagez à ne pas :</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>utiliser le Site à des fins illégales ou non autorisées;</li>
            <li>
              tenter de contourner les mesures de sécurité ou de protection
              contre les abus;
            </li>
            <li>
              soumettre des signalements ou commentaires faux, trompeurs ou
              abusifs;
            </li>
            <li>
              extraire massivement les données du Site par des moyens
              automatisés (scraping) sans autorisation;
            </li>
            <li>
              usurper l&apos;identité d&apos;un autre utilisateur ou d&apos;un
              administrateur.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            5. Contenu utilisateur
          </h2>
          <p>
            Les commentaires, avis et signalements soumis par les
            utilisateurs sont publiés sous leur responsabilité. Le Site se
            réserve le droit de supprimer tout contenu jugé inapproprié,
            offensant ou contraire aux présentes conditions, sans préavis.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            6. Propriété intellectuelle
          </h2>
          <p>
            Le code source du Site est distribué sous licence MIT. Les
            données de prix proviennent de la Régie de l&apos;énergie du
            Québec et sont des données ouvertes (open data). Les marques,
            logos et noms de stations-service appartiennent à leurs
            propriétaires respectifs.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            7. Limitation de responsabilité
          </h2>
          <p>
            Le Site est fourni « tel quel », sans garantie d&apos;aucune
            sorte. En aucun cas, le responsable du Site ne pourra être tenu
            responsable de dommages directs, indirects, accessoires ou
            consécutifs résultant de l&apos;utilisation ou de
            l&apos;impossibilité d&apos;utiliser le service, y compris les
            décisions prises sur la base des prix affichés.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            8. Protection des renseignements personnels
          </h2>
          <p>
            La collecte et le traitement de vos données sont régis par
            notre{" "}
            <Link
              href="/confidentialite"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Politique de confidentialité
            </Link>
            , conforme à la Loi 25 du Québec.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            9. Disponibilité du service
          </h2>
          <p>
            Le Site s&apos;efforce d&apos;assurer une disponibilité
            continue, mais ne garantit pas un fonctionnement ininterrompu.
            Des interruptions peuvent survenir pour maintenance, mise à jour
            ou cas de force majeure.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            10. Modification des conditions
          </h2>
          <p>
            Les présentes conditions peuvent être modifiées à tout moment.
            La date de dernière mise à jour est indiquée en haut de cette
            page. L&apos;utilisation continue du Site après modification
            vaut acceptation des nouvelles conditions.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            11. Droit applicable
          </h2>
          <p>
            Les présentes conditions sont régies par les lois du Québec et
            les lois fédérales du Canada applicables. Tout litige sera
            soumis aux tribunaux compétents du district judiciaire de
            Québec.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            12. Contact
          </h2>
          <p>
            Pour toute question concernant ces conditions, contactez-nous à{" "}
            <a
              href="mailto:mathieufournierqc@outlook.com"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              mathieufournierqc@outlook.com
            </a>
            .
          </p>
        </section>
      </div>

      <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
        <Link
          href="/"
          className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
        >
          Carte des prix
        </Link>
        <Link
          href="/confidentialite"
          className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
        >
          Confidentialité
        </Link>
        <Link
          href="/accessibilite"
          className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
        >
          Accessibilité
        </Link>
        <Link
          href="/faq"
          className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
        >
          FAQ
        </Link>
      </div>
    </main>
  );
}
