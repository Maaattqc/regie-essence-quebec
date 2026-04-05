"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

const LAST_UPDATED = "4 avril 2026";
const LAST_UPDATED_EN = "April 4, 2026";

const content = {
  fr: {
    breadcrumbHome: "Carte des prix",
    breadcrumbCurrent: "Conditions d'utilisation",
    title: "Conditions d'utilisation",
    lastUpdated: `Dernière mise à jour : ${LAST_UPDATED}`,
    sections: [
      {
        heading: "1. Acceptation des conditions",
        body: "En accédant au site Essence Québec (ci-après « le Site »), vous acceptez d'être lié par les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le Site.",
      },
      {
        heading: "2. Description du service",
        body: "Le Site est une carte interactive gratuite qui affiche les prix de l'essence et du diesel au Québec à partir des données publiques de la Régie de l'énergie du Québec (REQ). Le service est offert à titre informatif uniquement.",
      },
      {
        heading: "3. Exactitude des données",
        body: "Les prix affichés proviennent de sources gouvernementales publiques et sont mis à jour plusieurs fois par jour. Malgré tous les efforts raisonnables, le Site ne garantit pas l'exactitude, l'exhaustivité ni l'actualité des prix. Les prix réels en station peuvent différer de ceux affichés.",
      },
      {
        heading: "5. Contenu utilisateur",
        body: "Les commentaires, avis et signalements soumis par les utilisateurs sont publiés sous leur responsabilité. Le Site se réserve le droit de supprimer tout contenu jugé inapproprié, offensant ou contraire aux présentes conditions, sans préavis.",
      },
      {
        heading: "6. Propriété intellectuelle",
        body: "Le code source du Site est distribué sous licence MIT. Les données de prix proviennent de la Régie de l'énergie du Québec et sont des données ouvertes (open data). Les marques, logos et noms de stations-service appartiennent à leurs propriétaires respectifs.",
      },
      {
        heading: "7. Limitation de responsabilité",
        body: "Le Site est fourni « tel quel », sans garantie d'aucune sorte. En aucun cas, le responsable du Site ne pourra être tenu responsable de dommages directs, indirects, accessoires ou consécutifs résultant de l'utilisation ou de l'impossibilité d'utiliser le service, y compris les décisions prises sur la base des prix affichés.",
      },
      {
        heading: "9. Disponibilité du service",
        body: "Le Site s'efforce d'assurer une disponibilité continue, mais ne garantit pas un fonctionnement ininterrompu. Des interruptions peuvent survenir pour maintenance, mise à jour ou cas de force majeure.",
      },
      {
        heading: "10. Modification des conditions",
        body: "Les présentes conditions peuvent être modifiées à tout moment. La date de dernière mise à jour est indiquée en haut de cette page. L'utilisation continue du Site après modification vaut acceptation des nouvelles conditions.",
      },
      {
        heading: "11. Droit applicable",
        body: "Les présentes conditions sont régies par les lois du Québec et les lois fédérales du Canada applicables. Tout litige sera soumis aux tribunaux compétents du district judiciaire de Québec.",
      },
    ],
    acceptable: {
      heading: "4. Utilisation acceptable",
      intro: "Vous vous engagez à ne pas :",
      items: [
        "utiliser le Site à des fins illégales ou non autorisées;",
        "tenter de contourner les mesures de sécurité ou de protection contre les abus;",
        "soumettre des signalements ou commentaires faux, trompeurs ou abusifs;",
        "extraire massivement les données du Site par des moyens automatisés (scraping) sans autorisation;",
        "usurper l'identité d'un autre utilisateur ou d'un administrateur.",
      ],
    },
    privacy: {
      heading: "8. Protection des renseignements personnels",
      before: "La collecte et le traitement de vos données sont régis par notre",
      linkText: "Politique de confidentialité",
      after: ", conforme à la Loi 25 du Québec.",
    },
    contact: {
      heading: "12. Contact",
      before: "Pour toute question concernant ces conditions, contactez-nous à",
    },
    footerLinks: ["Carte des prix", "Confidentialité", "Accessibilité", "FAQ"],
  },
  en: {
    breadcrumbHome: "Price map",
    breadcrumbCurrent: "Terms of use",
    title: "Terms of Use",
    lastUpdated: `Last updated: ${LAST_UPDATED_EN}`,
    sections: [
      {
        heading: "1. Acceptance of terms",
        body: "By accessing the Essence Québec website (hereafter \"the Site\"), you agree to be bound by these terms of use. If you do not accept these terms, please do not use the Site.",
      },
      {
        heading: "2. Description of service",
        body: "The Site is a free interactive map displaying gasoline and diesel prices in Quebec based on public data from the Régie de l'énergie du Québec (REQ). The service is provided for informational purposes only.",
      },
      {
        heading: "3. Data accuracy",
        body: "Prices displayed come from public government sources and are updated several times a day. Despite all reasonable efforts, the Site does not guarantee the accuracy, completeness, or timeliness of prices. Actual prices at stations may differ from those displayed.",
      },
      {
        heading: "5. User content",
        body: "Comments, reviews and reports submitted by users are published under their own responsibility. The Site reserves the right to remove any content deemed inappropriate, offensive, or contrary to these terms, without notice.",
      },
      {
        heading: "6. Intellectual property",
        body: "The source code of the Site is distributed under the MIT license. Price data comes from the Régie de l'énergie du Québec and is open data. Trademarks, logos and gas station names belong to their respective owners.",
      },
      {
        heading: "7. Limitation of liability",
        body: "The Site is provided \"as is\", without warranty of any kind. Under no circumstances shall the Site owner be liable for direct, indirect, incidental, or consequential damages resulting from the use or inability to use the service, including decisions made based on displayed prices.",
      },
      {
        heading: "9. Service availability",
        body: "The Site strives to ensure continuous availability but does not guarantee uninterrupted operation. Interruptions may occur for maintenance, updates, or force majeure.",
      },
      {
        heading: "10. Modification of terms",
        body: "These terms may be modified at any time. The last update date is shown at the top of this page. Continued use of the Site after modification constitutes acceptance of the new terms.",
      },
      {
        heading: "11. Applicable law",
        body: "These terms are governed by the laws of Quebec and applicable federal laws of Canada. Any dispute shall be submitted to the competent courts of the judicial district of Quebec.",
      },
    ],
    acceptable: {
      heading: "4. Acceptable use",
      intro: "You agree not to:",
      items: [
        "use the Site for illegal or unauthorized purposes;",
        "attempt to circumvent security or abuse-prevention measures;",
        "submit false, misleading, or abusive reports or comments;",
        "bulk-extract data from the Site using automated means (scraping) without authorization;",
        "impersonate another user or an administrator.",
      ],
    },
    privacy: {
      heading: "8. Personal data protection",
      before: "The collection and processing of your data are governed by our",
      linkText: "Privacy Policy",
      after: ", compliant with Quebec Law 25.",
    },
    contact: {
      heading: "12. Contact",
      before: "For any questions regarding these terms, contact us at",
    },
    footerLinks: ["Price map", "Privacy", "Accessibility", "FAQ"],
  },
};

const footerHrefs = ["/", "/confidentialite", "/accessibilite", "/faq"];

export default function ConditionsContent() {
  const { locale } = useLanguage();
  const t = content[locale];

  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <nav className="mb-8 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/" className="hover:underline">
          {t.breadcrumbHome}
        </Link>
        {" › "}
        <span>{t.breadcrumbCurrent}</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
        {t.title}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-12">
        {t.lastUpdated}
      </p>

      <div className="space-y-10 text-gray-600 dark:text-gray-400">
        {/* Sections 1-3 */}
        {t.sections.slice(0, 3).map((s) => (
          <section key={s.heading}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {s.heading}
            </h2>
            <p>{s.body}</p>
          </section>
        ))}

        {/* Section 4 — acceptable use with list */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t.acceptable.heading}
          </h2>
          <p>{t.acceptable.intro}</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            {t.acceptable.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        {/* Sections 5-7 */}
        {t.sections.slice(3, 6).map((s) => (
          <section key={s.heading}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {s.heading}
            </h2>
            <p>{s.body}</p>
          </section>
        ))}

        {/* Section 8 — privacy link */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t.privacy.heading}
          </h2>
          <p>
            {t.privacy.before}{" "}
            <Link
              href="/confidentialite"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t.privacy.linkText}
            </Link>
            {t.privacy.after}
          </p>
        </section>

        {/* Sections 9-11 */}
        {t.sections.slice(6, 9).map((s) => (
          <section key={s.heading}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {s.heading}
            </h2>
            <p>{s.body}</p>
          </section>
        ))}

        {/* Section 12 — contact */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t.contact.heading}
          </h2>
          <p>
            {t.contact.before}{" "}
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
        {t.footerLinks.map((label, i) => (
          <Link
            key={footerHrefs[i]}
            href={footerHrefs[i]}
            className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
          >
            {label}
          </Link>
        ))}
      </div>
    </main>
  );
}
