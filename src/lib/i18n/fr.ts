import type { Translations } from "./types";

const fr: Translations = {
  // FilterBar
  filterBar: {
    cityPlaceholder: "Ville…",
    allRegions: "Toutes les régions",
    allBrands: "Toutes les compagnies",
    favorites: "Favoris",
    suggestion: "Suggestion",
    login: "Connexion",
    lightMode: "Mode clair",
    darkMode: "Mode sombre",
    appTitle: "Essence Québec",
    tagline: "Prix en temps réel des stations-service",
    changelog: "Historique des mises à jour",
    logout: "Déconnexion",
    loggedInAs: "Connecté en tant que",
  },

  // MapButtonsPanel
  mapButtons: {
    hide: "Masquer les boutons",
    show: "Afficher les boutons",
    hidePanel: "Masquer",
    bestPrice: "Meilleur prix",
    settings: "Réglages",
    radiusAll: "Rayon : Tout",
    radiusKm: (km: number) => `Rayon : ${km} km`,
    consumption: (v: number) => `Consommation : ${v} L/100km`,
    tank: (v: number) => `Réservoir : ${v} L`,
    showCircle: "Afficher le cercle du rayon",
    avgPrices: "Prix moyens",
    share: "Partager",
    styleMap: "Carte",
    styleSatellite: "Satellite",
    styleDark: "Dark",
    online: (n: number) => `Visiteurs en ligne (${n})`,
    devSimulate: "DEV: Simuler position",
    devClick: "Cliquer sur la carte...",
  },

  // PricePanel
  pricePanel: {
    title: "Prix moyens",
    selected: (n: number) => `${n} sélectionnés`,
    displayedRegions: (shown: number, total: number) => `${shown} / ${total} régions`,
    displayedCities: (shown: number, total: number) => `${shown} / ${total} villes`,
    byRegion: "Par région",
    byCity: "Par ville",
    compare: (n: number) => `Comparer (${n})`,
    searchRegion: "Rechercher une région...",
    searchCity: "Rechercher une ville...",
    allRegions: "Toutes les régions",
    priceRange: (min: number, max: number) => `Prix entre ${min}¢ et ${max}¢`,
    noResults: "Aucun résultat trouvé.",
    clickToCompare: "Cliquez sur des régions ou villes pour les comparer.",
    location: "Lieu",
    stations: "Stations",
    cheapestFor: (label: string) => `Le moins cher pour ${label}`,
    cheaper: (diff: string, name: string) => `${diff}¢ de moins que ${name}`,
    sortPriceAsc: "Prix croissant",
    sortPriceDesc: "Prix décroissant",
    sortNameAZ: "Nom A-Z",
    sortNameZA: "Nom Z-A",
    sortCheapestVsAvg: "Moins cher vs moy.",
    sortExpensiveVsAvg: "Plus cher vs moy.",
    sortStations: "Nb stations",
    min: "Min",
    max: "Max",
    gap: "Écart",
    station: (n: number) => n === 1 ? "station" : "stations",
  },

  // LoginModal
  login: {
    title: "Connexion",
    subtitle: "Entrez votre courriel pour recevoir un code de connexion",
    emailLabel: "Adresse courriel",
    emailPlaceholder: "exemple@courriel.com",
    sending: "Envoi...",
    sendCode: "Envoyer le code",
    noPassword: "Aucun mot de passe requis. Un code à 6 chiffres sera envoyé à votre courriel.",
    codeSentTo: (email: string) => `Un code a été envoyé à ${email}`,
    codeLabel: "Code de vérification",
    codePlaceholder: "000000",
    verifying: "Vérification...",
    verifyCode: "Vérifier le code",
    changeEmail: "Changer de courriel",
    successTitle: "Connexion réussie !",
    successSubtitle: "Vous êtes maintenant connecté.",
    close: "Fermer",
  },

  // ReportModal
  report: {
    title: "Signaler une inexactitude",
    firstNameLabel: "Prénom",
    lastNameLabel: "Nom",
    emailLabel: "Courriel",
    descriptionPlaceholder: "Décrivez l'inexactitude...",
    sending: "Envoi...",
    submit: "Envoyer le signalement",
    successTitle: "Merci pour votre signalement !",
    successSubtitle: "Nous allons examiner votre demande.",
  },

  // SuggestionModal
  suggestion: {
    title: "Suggestion",
    subtitle: "Une idée pour améliorer Essence Québec ? Partagez-la avec nous !",
    firstNameLabel: "Prénom",
    lastNameLabel: "Nom",
    emailLabel: "Courriel",
    descriptionPlaceholder: "Décrivez votre suggestion...",
    sending: "Envoi...",
    submit: "Envoyer la suggestion",
    successTitle: "Merci pour votre suggestion !",
    successSubtitle: "Nous allons l'examiner attentivement.",
  },

  // CommentsModal
  comments: {
    title: (name: string) => `Commentaires — ${name}`,
    count: (n: number) => n === 1 ? "1 commentaire" : `${n} commentaires`,
    placeholder: "Ajouter un commentaire...",
    publish: "Publier",
    empty: "Aucun commentaire. Soyez le premier !",
    minutesAgo: (n: number) => `il y a ${n}m`,
    hoursAgo: (n: number) => `il y a ${n}h`,
    daysAgo: (n: number) => `il y a ${n}j`,
    likes: (n: number) => `J'aime (${n})`,
    dislikes: (n: number) => `Je n'aime pas (${n})`,
    reply: "Répondre",
    delete: "Supprimer",
    confirmDelete: "Supprimer ce commentaire ?",
    yes: "Oui",
    no: "Non",
    replyTo: (author: string) => `Répondre à ${author}...`,
    cancel: "Annuler",
  },

  // ChangelogModal
  changelog: {
    title: "Changelog",
    empty: "Aucun commit trouvé.",
  },

  // PriceChart
  chart: {
    loading: "Chargement...",
    noData: "Pas assez de données",
    tooltip: (date: string, price: number) => `${date} — ${price}¢`,
    min: (v: number) => `Min: ${v}¢`,
    max: (v: number) => `Max: ${v}¢`,
  },

  // Map
  map: {
    loadingStations: "Chargement des stations...",
    loadingGeo: "Géolocalisation...",
    lastUpdated: (time: string) => `Màj : ${time}`,
    linkCopied: "Lien copié !",
  },

  // Popups Leaflet
  popup: {
    available: "Prix disponibles",
    directions: "Itinéraire",
    directionsTo: (name: string) => `Itinéraire vers ${name}`,
    favorite: "Favori",
    removeFavorite: "Retirer des favoris",
    addFavorite: "Ajouter aux favoris",
    history: "Historique",
    historyOf: (name: string) => `Historique des prix de ${name}`,
    comments: "Commentaires",
    commentsOf: (name: string) => `Commentaires sur ${name}`,
    report: "Signaler",
    reportOf: (name: string) => `Signaler une inexactitude pour ${name}`,
  },

  // Pages
  faq: {
    title: "Questions fréquentes",
    q1: "À quelle fréquence les prix de l'essence sont-ils mis à jour ?",
    q2: "La carte des prix d'essence est-elle gratuite ?",
    q3: "Comment trouver la station-service la moins chère près de moi ?",
    q4: "Quels types de carburant sont affichés ?",
    q5: "Puis-je signaler un prix incorrect ?",
    q6: "D'où proviennent les données de prix ?",
    q7: "La carte fonctionne-t-elle sur mobile ?",
    q8: "Puis-je voir l'historique des prix d'une station ?",
  },

  about: {
    title: "À propos d'Essence Québec",
    project: "Le projet",
    dataSource: "Source des données",
    howItWorks: "Fonctionnement",
    contribution: "Contribution",
  },

  // Nav links
  gasTypes: {
    Régulier: "Régulier",
    Super: "Super",
    Diesel: "Diesel",
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
    s5Items: [
      "HTML5 sémantique",
      "WAI-ARIA 1.2",
      "CSS (Tailwind CSS 4)",
      "JavaScript (React 19, Next.js 16)",
    ],
    s6Title: "Environnements de test",
    s6Intro: "Le site a été testé dans les navigateurs suivants :",
    s6Items: [
      "Google Chrome (dernière version)",
      "Mozilla Firefox (dernière version)",
      "Apple Safari (dernière version)",
      "Microsoft Edge (dernière version)",
    ],
    s7Title: "Signaler un problème d'accessibilité",
    s7Body: "Si vous rencontrez un obstacle d'accessibilité sur ce site, veuillez nous contacter. Nous nous engageons à répondre dans un délai de 15 jours ouvrables et à apporter les correctifs nécessaires.",
    s7ContactLabel: "Contact :",
    s8Title: "Références",
    nav: ["Carte des prix", "Confidentialité", "Conditions d'utilisation", "FAQ"],
  },
};

export type { Translations } from "./types";
export default fr;
