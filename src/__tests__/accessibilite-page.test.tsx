import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    locale: "fr",
    toggle: vi.fn(),
    t: {
      accessibility: {
        title: "Déclaration d'accessibilité",
        lastUpdated: "Dernière mise à jour : 4 avril 2026",
        breadcrumb: "Carte des prix",
        s1Title: "Engagement",
        s1Body: "Essence Québec s'engage à rendre son site Web accessible conformément au Standard sur l'accessibilité des sites Web (SGQRI 008 3.0) du gouvernement du Québec et aux Règles pour l'accessibilité des contenus Web (WCAG) 2.1 niveau AA du W3C.",
        s2Title: "Niveau de conformité visé",
        s2Body: "Le site vise le niveau de conformité WCAG 2.1 AA. Des efforts continus sont déployés pour améliorer l'accessibilité de l'ensemble du contenu.",
        s3Title: "Mesures d'accessibilité mises en place",
        s3Items: [
          "Lien d'évitement — Un lien « Passer au contenu principal » permet aux utilisateurs de clavier de contourner la navigation.",
          "Navigation au clavier — Toutes les fonctionnalités interactives (boutons, formulaires, menus déroulants, modales) sont accessibles au clavier.",
          "Piège de focus dans les modales — Les fenêtres modales capturent le focus clavier et le restituent à l'élément déclencheur à la fermeture.",
          "Attributs ARIA — Les composants interactifs utilisent les attributs role, aria-label, aria-modal et aria-labelledby conformément aux pratiques WAI-ARIA.",
          "Hiérarchie des titres — Les pages respectent une structure de titres logique (h1, h2, h3) et utilisent des balises sémantiques HTML5 (main, nav, section, article).",
          "Mode sombre — Un mode sombre est disponible pour réduire la fatigue visuelle, avec respect de la préférence système.",
          "Contenu alternatif — Un bloc de contenu en texte pur (sr-only) est fourni comme alternative à la carte interactive pour les lecteurs d'écran.",
          "Composants accessibles — Le site utilise shadcn/ui et Base UI, des bibliothèques de composants conçues pour l'accessibilité.",
        ],
        s4Title: "Limitations connues",
        s4Items: [
          "Carte interactive (Leaflet) — La carte utilise un rendu canvas qui n'est pas entièrement accessible aux lecteurs d'écran. Un contenu textuel alternatif est fourni pour compenser cette limitation.",
          "Contrastes de couleurs — Certains éléments de texte secondaire pourraient ne pas atteindre le ratio de contraste 4.5:1 dans tous les contextes. Des corrections sont en cours.",
        ],
        s5Title: "Technologies utilisées",
        s5Intro: "L'accessibilité de ce site repose sur les technologies suivantes :",
        s5Items: ["HTML5 sémantique", "WAI-ARIA 1.2", "CSS (Tailwind CSS 4)", "JavaScript (React 19, Next.js 16)"],
        s6Title: "Environnements de test",
        s6Intro: "Le site a été testé dans les navigateurs suivants :",
        s6Items: ["Google Chrome (dernière version)", "Mozilla Firefox (dernière version)", "Apple Safari (dernière version)", "Microsoft Edge (dernière version)"],
        s7Title: "Signaler un problème d'accessibilité",
        s7Body: "Si vous rencontrez un obstacle d'accessibilité sur ce site, veuillez nous contacter. Nous nous engageons à répondre dans un délai de 15 jours ouvrables et à apporter les correctifs nécessaires.",
        s7ContactLabel: "Contact :",
        s8Title: "Références",
        nav: ["Carte des prix", "Confidentialité", "Conditions d'utilisation", "FAQ"],
      },
      nav: {
        map: "Carte des prix",
        about: "À propos",
        changelog: "Historique des mises à jour",
        tech: "Informations techniques",
        privacy: "Confidentialité",
        terms: "Conditions d'utilisation",
        accessibility: "Accessibilité",
        login: "Se connecter",
        faq: "FAQ",
      },
    },
  }),
}));

import AccessibilitePage from "@/app/accessibilite/page";

describe("AccessibilitePage", () => {
  it("affiche le titre", () => {
    render(<AccessibilitePage />);
    expect(screen.getAllByText("Déclaration d'accessibilité").length).toBeGreaterThanOrEqual(1);
  });

  it("mentionne SGQRI 008", () => {
    render(<AccessibilitePage />);
    expect(screen.getAllByText(/SGQRI 008/).length).toBeGreaterThanOrEqual(1);
  });

  it("mentionne WCAG 2.1 AA", () => {
    render(<AccessibilitePage />);
    expect(screen.getAllByText(/WCAG 2.1.*AA/).length).toBeGreaterThanOrEqual(1);
  });

  it("liste les mesures d'accessibilité", () => {
    render(<AccessibilitePage />);
    expect(screen.getByText(/Lien d'évitement/)).toBeInTheDocument();
    expect(screen.getByText(/Navigation au clavier/)).toBeInTheDocument();
    expect(screen.getByText(/Piège de focus/)).toBeInTheDocument();
    expect(screen.getByText(/Attributs ARIA/)).toBeInTheDocument();
  });

  it("mentionne les limitations connues", () => {
    render(<AccessibilitePage />);
    expect(screen.getByText("Limitations connues")).toBeInTheDocument();
    expect(screen.getByText(/Carte interactive/)).toBeInTheDocument();
  });

  it("affiche le contact", () => {
    render(<AccessibilitePage />);
    expect(screen.getByText("mathieufournierqc@outlook.com")).toBeInTheDocument();
  });

  it("contient les liens du footer", () => {
    render(<AccessibilitePage />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/confidentialite");
    expect(hrefs).toContain("/conditions-utilisation");
  });
});
