import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Accessibilité — Essence Québec",
  description:
    "Déclaration d'accessibilité du site Essence Québec — conformité SGQRI 008, WCAG 2.1 niveau AA.",
};

const LAST_UPDATED = "4 avril 2026";

export default function AccessibilitePage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <nav className="mb-8 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/" className="hover:underline">
          Carte des prix
        </Link>
        {" › "}
        <span>Accessibilité</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
        Déclaration d&apos;accessibilité
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-12">
        Dernière mise à jour : {LAST_UPDATED}
      </p>

      <div className="space-y-10 text-gray-600 dark:text-gray-400">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Engagement
          </h2>
          <p>
            Essence Québec s&apos;engage à rendre son site Web accessible
            conformément au{" "}
            <strong>
              Standard sur l&apos;accessibilité des sites Web (SGQRI 008
              3.0)
            </strong>{" "}
            du gouvernement du Québec et aux{" "}
            <strong>
              Règles pour l&apos;accessibilité des contenus Web (WCAG) 2.1
              niveau AA
            </strong>{" "}
            du W3C.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Niveau de conformité visé
          </h2>
          <p>
            Le site vise le niveau de conformité{" "}
            <strong>WCAG 2.1 AA</strong>. Des efforts continus sont
            déployés pour améliorer l&apos;accessibilité de l&apos;ensemble
            du contenu.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Mesures d&apos;accessibilité mises en place
          </h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>
              <strong>Lien d&apos;évitement</strong> — Un lien « Passer au
              contenu principal » permet aux utilisateurs de clavier de
              contourner la navigation.
            </li>
            <li>
              <strong>Navigation au clavier</strong> — Toutes les
              fonctionnalités interactives (boutons, formulaires, menus
              déroulants, modales) sont accessibles au clavier.
            </li>
            <li>
              <strong>Piège de focus dans les modales</strong> — Les
              fenêtres modales capturent le focus clavier et le restituent à
              l&apos;élément déclencheur à la fermeture.
            </li>
            <li>
              <strong>Attributs ARIA</strong> — Les composants interactifs
              utilisent les attributs{" "}
              <code>role</code>, <code>aria-label</code>,{" "}
              <code>aria-modal</code> et <code>aria-labelledby</code>{" "}
              conformément aux pratiques WAI-ARIA.
            </li>
            <li>
              <strong>Hiérarchie des titres</strong> — Les pages respectent
              une structure de titres logique (h1, h2, h3) et utilisent des
              balises sémantiques HTML5 (<code>main</code>,{" "}
              <code>nav</code>, <code>section</code>, <code>article</code>
              ).
            </li>
            <li>
              <strong>Mode sombre</strong> — Un mode sombre est disponible
              pour réduire la fatigue visuelle, avec respect de la
              préférence système.
            </li>
            <li>
              <strong>Contenu alternatif</strong> — Un bloc de contenu en
              texte pur (sr-only) est fourni comme alternative à la carte
              interactive pour les lecteurs d&apos;écran.
            </li>
            <li>
              <strong>Composants accessibles</strong> — Le site utilise
              shadcn/ui et Base UI, des bibliothèques de composants conçues
              pour l&apos;accessibilité.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Limitations connues
          </h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>
              <strong>Carte interactive (Leaflet)</strong> — La carte
              utilise un rendu canvas qui n&apos;est pas entièrement
              accessible aux lecteurs d&apos;écran. Un contenu textuel
              alternatif est fourni pour compenser cette limitation.
            </li>
            <li>
              <strong>Contrastes de couleurs</strong> — Certains éléments
              de texte secondaire pourraient ne pas atteindre le ratio de
              contraste 4.5:1 dans tous les contextes. Des corrections sont
              en cours.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Technologies utilisées
          </h2>
          <p>
            L&apos;accessibilité de ce site repose sur les technologies
            suivantes :
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>HTML5 sémantique</li>
            <li>WAI-ARIA 1.2</li>
            <li>CSS (Tailwind CSS 4)</li>
            <li>JavaScript (React 19, Next.js 16)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Environnements de test
          </h2>
          <p>
            Le site a été testé dans les navigateurs suivants :
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Google Chrome (dernière version)</li>
            <li>Mozilla Firefox (dernière version)</li>
            <li>Apple Safari (dernière version)</li>
            <li>Microsoft Edge (dernière version)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Signaler un problème d&apos;accessibilité
          </h2>
          <p>
            Si vous rencontrez un obstacle d&apos;accessibilité sur ce
            site, veuillez nous contacter. Nous nous engageons à répondre
            dans un délai de <strong>15 jours ouvrables</strong> et à
            apporter les correctifs nécessaires.
          </p>
          <p className="mt-2">
            Contact :{" "}
            <a
              href="mailto:mathieufournierqc@outlook.com"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              mathieufournierqc@outlook.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Références
          </h2>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              <a
                href="https://www.tresor.gouv.qc.ca/ressources-informationnelles/architecture-dentreprise-gouvernementale/standards-et-normes/accessibilite-du-web/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                SGQRI 008 3.0 — Gouvernement du Québec
              </a>
            </li>
            <li>
              <a
                href="https://www.w3.org/TR/WCAG21/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                WCAG 2.1 — W3C
              </a>
            </li>
          </ul>
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
          href="/conditions-utilisation"
          className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
        >
          Conditions d&apos;utilisation
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
