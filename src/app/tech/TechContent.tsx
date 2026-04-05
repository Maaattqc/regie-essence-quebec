"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  ArrowLeft, Globe, Server, Database, Cloud, Shield,
  Zap, Map, BarChart3, Lock, Smartphone,
  RefreshCw, Search, Star, MessageSquare, Flag, Clock,
  CheckCircle2, Layers, GitBranch, Mail, Code2, Eye,
  Sun, Moon, ShieldCheck, TestTube2, Activity, FileText,
} from "lucide-react";
import ScrollToTop from "@/components/ScrollToTop";
import { useLanguage } from "@/contexts/LanguageContext";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

const BUZZWORDS = {
  fr: [
    "Rapide", "Performant", "Sécurisé", "Temps réel",
    "Haute disponibilité", "Mobile-first", "Open Data",
    "Accessible", "Fiable", "Automatisé", "CI/CD", "Monitoring",
  ],
  en: [
    "Fast", "Performant", "Secure", "Real-time",
    "High availability", "Mobile-first", "Open Data",
    "Accessible", "Reliable", "Automated", "CI/CD", "Monitoring",
  ],
};

const STACK = {
  fr: [
    {
      category: "Interface utilisateur",
      color: "#003DA5",
      icon: Globe,
      items: [
        { name: "Next.js 16", desc: "Framework React App Router avec rendu hybride SSR/CSR" },
        { name: "React 19", desc: "Dernière version stable avec Server Components" },
        { name: "TypeScript 5", desc: "Typage statique strict sur l'ensemble du projet" },
        { name: "Tailwind CSS 4", desc: "Styling utilitaire nouvelle génération (CSS variables)" },
        { name: "shadcn/ui + Base UI", desc: "Composants accessibles, conformes WCAG 2.1" },
        { name: "Framer Motion 12", desc: "Animations fluides 60 fps, transitions d'état" },
        { name: "Leaflet 1.9 + React-Leaflet 5", desc: "Cartographie vectorielle haute performance" },
        { name: "Mapbox Directions API", desc: "Distances routières réelles et trafic en temps réel" },
      ],
    },
    {
      category: "Backend & API",
      color: "#6d28d9",
      icon: Server,
      items: [
        { name: "Next.js API Routes (Serverless)", desc: "Endpoints RESTful déployés sur l'Edge Network mondial" },
        { name: "Zod 4", desc: "Validation de données stricte côté serveur et client" },
        { name: "Rate Limiting (Upstash Redis)", desc: "Protection distribuée contre les abus par IP, partagée entre toutes les instances serverless" },
        { name: "Service Role Auth", desc: "Séparation stricte des privilèges client/serveur" },
      ],
    },
    {
      category: "Base de données & Auth",
      color: "#0369a1",
      icon: Database,
      items: [
        { name: "Supabase (PostgreSQL 15)", desc: "Base de données managée, haute disponibilité 99.9%" },
        { name: "Row Level Security (RLS)", desc: "Sécurité au niveau des lignes, chaque utilisateur accède uniquement à ses données" },
        { name: "Realtime Subscriptions", desc: "Synchronisation des commentaires en temps réel via WebSocket" },
        { name: "Auth OTP sans mot de passe", desc: "Connexion par code à usage unique — zéro gestion de mots de passe" },
      ],
    },
    {
      category: "Infrastructure & DevOps",
      color: "#0e7490",
      icon: Cloud,
      items: [
        { name: "Vercel Edge Network", desc: "CDN mondial ~300 ms de propagation, 40+ régions" },
        { name: "GitHub Actions CI/CD", desc: "Pipeline automatisé : lint, tests unitaires, build de production sur chaque PR" },
        { name: "Sentry (crash reporting)", desc: "Monitoring des erreurs en production, source maps, alertes automatiques — sans collecte de PII" },
        { name: "Dependabot", desc: "Mises à jour automatiques hebdomadaires des dépendances avec groupement intelligent" },
        { name: "Husky + lint-staged", desc: "Pre-commit hooks : ESLint automatique sur chaque commit, aucun code non conforme ne passe" },
        { name: "Preview Deployments", desc: "Environnement de prévisualisation unique par branche avec URL dédiée" },
        { name: "Vercel Cron Jobs", desc: "Capture automatique quotidienne des prix depuis la source officielle" },
        { name: "Resend", desc: "Livraison d'emails transactionnels avec domaine vérifié SPF/DKIM/DMARC" },
      ],
    },
  ],
  en: [
    {
      category: "User interface",
      color: "#003DA5",
      icon: Globe,
      items: [
        { name: "Next.js 16", desc: "React App Router framework with hybrid SSR/CSR rendering" },
        { name: "React 19", desc: "Latest stable version with Server Components" },
        { name: "TypeScript 5", desc: "Strict static typing across the entire project" },
        { name: "Tailwind CSS 4", desc: "Next-generation utility styling (CSS variables)" },
        { name: "shadcn/ui + Base UI", desc: "Accessible components, WCAG 2.1 compliant" },
        { name: "Framer Motion 12", desc: "Smooth 60 fps animations, state transitions" },
        { name: "Leaflet 1.9 + React-Leaflet 5", desc: "High-performance vector mapping" },
        { name: "Mapbox Directions API", desc: "Real road distances and real-time traffic" },
      ],
    },
    {
      category: "Backend & API",
      color: "#6d28d9",
      icon: Server,
      items: [
        { name: "Next.js API Routes (Serverless)", desc: "RESTful endpoints deployed on the global Edge Network" },
        { name: "Zod 4", desc: "Strict server-side and client-side data validation" },
        { name: "Rate Limiting (Upstash Redis)", desc: "Distributed protection against IP abuse, shared across all serverless instances" },
        { name: "Service Role Auth", desc: "Strict client/server privilege separation" },
      ],
    },
    {
      category: "Database & Auth",
      color: "#0369a1",
      icon: Database,
      items: [
        { name: "Supabase (PostgreSQL 15)", desc: "Managed database, 99.9% high availability" },
        { name: "Row Level Security (RLS)", desc: "Row-level security — each user accesses only their own data" },
        { name: "Realtime Subscriptions", desc: "Real-time comment synchronization via WebSocket" },
        { name: "Passwordless OTP Auth", desc: "One-time code login — zero password management" },
      ],
    },
    {
      category: "Infrastructure & DevOps",
      color: "#0e7490",
      icon: Cloud,
      items: [
        { name: "Vercel Edge Network", desc: "Global CDN ~300 ms propagation, 40+ regions" },
        { name: "GitHub Actions CI/CD", desc: "Automated pipeline: lint, unit tests, production build on every PR" },
        { name: "Sentry (crash reporting)", desc: "Production error monitoring, source maps, automatic alerts — no PII collected" },
        { name: "Dependabot", desc: "Automated weekly dependency updates with intelligent grouping" },
        { name: "Husky + lint-staged", desc: "Pre-commit hooks: automatic ESLint on every commit, no non-compliant code passes" },
        { name: "Preview Deployments", desc: "Unique preview environment per branch with dedicated URL" },
        { name: "Vercel Cron Jobs", desc: "Automatic daily price capture from the official source" },
        { name: "Resend", desc: "Transactional email delivery with verified SPF/DKIM/DMARC domain" },
      ],
    },
  ],
};

const FEATURES = {
  fr: [
    {
      icon: Map,
      title: "Cartographie interactive temps réel",
      desc: "Visualisation de 2 000+ stations-service sur l'ensemble du territoire québécois avec prix mis à jour automatiquement.",
      tags: ["Rapide", "Temps réel", "Géolocalisation"],
      techTags: ["Données gouvernementales", "Temps réel", "Géolocalisation"],
    },
    {
      icon: Search,
      title: "Recherche intelligente de la station la moins chère",
      desc: "Trouvez instantanément la station la moins chère autour de vous grâce à la géolocalisation et un rayon de recherche ajustable.",
      tags: ["Précis", "Géolocalisation", "Économies"],
      techTags: ["Algorithme Haversine", "Rayon ajustable", "Tri par prix"],
    },
    {
      icon: Layers,
      title: "Affichage haute performance",
      desc: "Chargement quasi instantané des données grâce au cache intelligent et regroupement visuel des stations selon le niveau de zoom.",
      tags: ["Ultra-rapide", "Fluide", "Intelligent"],
      techTags: ["Cache client", "Rendu différé", "60 fps"],
    },
    {
      icon: BarChart3,
      title: "Comparaison des prix par région et par ville",
      desc: "Tableau de bord comparatif des prix moyens, minimums et maximums par région administrative et par ville, avec tendances.",
      tags: ["17 régions", "Comparatif", "Tendances"],
      techTags: ["17 régions", "Stats avancées", "Delta vs moyenne"],
    },
    {
      icon: Clock,
      title: "Historique des prix sur 30 jours",
      desc: "Consultez l'évolution des prix de chaque station sur les 30 derniers jours grâce à un graphique clair et interactif.",
      tags: ["30 jours", "Visuel", "Par carburant"],
      techTags: ["SVG natif", "30 jours", "Par type de carburant"],
    },
    {
      icon: MessageSquare,
      title: "Commentaires et avis communautaires",
      desc: "Partagez votre expérience, votez sur les avis des autres utilisateurs et consultez les retours en temps réel.",
      tags: ["Communautaire", "Temps réel", "Votes"],
      techTags: ["Votes anonymes", "Temps réel", "Modération"],
    },
    {
      icon: Flag,
      title: "Signalement de prix inexacts",
      desc: "Signalez un prix erroné en quelques clics. Chaque signalement est traité par l'équipe d'administration.",
      tags: ["Simple", "Fiable", "Suivi"],
      techTags: ["Workflow admin", "Validation stricte", "Traçabilité"],
    },
    {
      icon: Shield,
      title: "Sécurité et protection des données",
      desc: "Connexion sans mot de passe, protection contre les abus et sécurité des données à chaque niveau de l'application.",
      tags: ["Sécurisé", "Sans mot de passe", "Conforme"],
      techTags: ["Sans mot de passe", "RLS PostgreSQL", "Rate limiting"],
    },
    {
      icon: Star,
      title: "Stations favorites",
      desc: "Sauvegardez vos stations préférées pour y accéder en un clic, même hors connexion.",
      tags: ["Pratique", "Hors connexion", "Rapide"],
      techTags: ["Hors connexion", "Persistance locale", "Filtrage rapide"],
    },
    {
      icon: Smartphone,
      title: "Expérience mobile optimisée",
      desc: "Interface fluide et adaptée à tous les écrans — téléphone, tablette ou ordinateur — avec mode sombre.",
      tags: ["Mobile", "Responsive", "Mode sombre"],
      techTags: ["Responsive", "Touch-friendly", "Mode sombre/clair"],
    },
    {
      icon: RefreshCw,
      title: "Données toujours à jour",
      desc: "Les prix sont synchronisés automatiquement avec la source officielle de la Régie de l'énergie, sans intervention manuelle.",
      tags: ["Automatisé", "Fiable", "Officiel"],
      techTags: ["Cron automatique", "GeoJSON", "Déduplication"],
    },
    {
      icon: Lock,
      title: "Panneau d'administration complet",
      desc: "Gestion des utilisateurs, traitement des signalements, suivi des données et statistiques d'utilisation en temps réel.",
      tags: ["Contrôle total", "Statistiques", "Gestion"],
      techTags: ["Contrôle d'accès", "Gestion des rôles", "Audit"],
    },
  ],
  en: [
    {
      icon: Map,
      title: "Real-time interactive mapping",
      desc: "Visualization of 2,000+ gas stations across the entire Quebec territory with automatically updated prices.",
      tags: ["Fast", "Real-time", "Geolocation"],
      techTags: ["Government data", "Real-time", "Geolocation"],
    },
    {
      icon: Search,
      title: "Smart cheapest station search",
      desc: "Instantly find the cheapest station near you using geolocation and an adjustable search radius.",
      tags: ["Precise", "Geolocation", "Savings"],
      techTags: ["Haversine algorithm", "Adjustable radius", "Price sorting"],
    },
    {
      icon: Layers,
      title: "High-performance display",
      desc: "Near-instant data loading through smart caching and visual clustering of stations by zoom level.",
      tags: ["Ultra-fast", "Smooth", "Smart"],
      techTags: ["Client cache", "Deferred rendering", "60 fps"],
    },
    {
      icon: BarChart3,
      title: "Price comparison by region and city",
      desc: "Comparative dashboard of average, minimum and maximum prices by administrative region and city, with trends.",
      tags: ["17 regions", "Comparative", "Trends"],
      techTags: ["17 regions", "Advanced stats", "Delta vs average"],
    },
    {
      icon: Clock,
      title: "30-day price history",
      desc: "View the price evolution of each station over the past 30 days through a clear, interactive chart.",
      tags: ["30 days", "Visual", "By fuel type"],
      techTags: ["Native SVG", "30 days", "Per fuel type"],
    },
    {
      icon: MessageSquare,
      title: "Community comments and reviews",
      desc: "Share your experience, vote on other users' reviews, and view feedback in real time.",
      tags: ["Community", "Real-time", "Votes"],
      techTags: ["Anonymous votes", "Real-time", "Moderation"],
    },
    {
      icon: Flag,
      title: "Inaccurate price reporting",
      desc: "Report an incorrect price in a few clicks. Each report is handled by the administration team.",
      tags: ["Simple", "Reliable", "Tracked"],
      techTags: ["Admin workflow", "Strict validation", "Traceability"],
    },
    {
      icon: Shield,
      title: "Security and data protection",
      desc: "Passwordless login, abuse protection and data security at every layer of the application.",
      tags: ["Secure", "Passwordless", "Compliant"],
      techTags: ["Passwordless", "RLS PostgreSQL", "Rate limiting"],
    },
    {
      icon: Star,
      title: "Favorite stations",
      desc: "Save your favorite stations for one-click access, even offline.",
      tags: ["Handy", "Offline", "Fast"],
      techTags: ["Offline", "Local persistence", "Quick filtering"],
    },
    {
      icon: Smartphone,
      title: "Optimized mobile experience",
      desc: "Smooth interface adapted to all screens — phone, tablet or desktop — with dark mode.",
      tags: ["Mobile", "Responsive", "Dark mode"],
      techTags: ["Responsive", "Touch-friendly", "Dark/light mode"],
    },
    {
      icon: RefreshCw,
      title: "Always up-to-date data",
      desc: "Prices are automatically synchronized with the official Régie de l'énergie source, with no manual intervention.",
      tags: ["Automated", "Reliable", "Official"],
      techTags: ["Auto cron", "GeoJSON", "Deduplication"],
    },
    {
      icon: Lock,
      title: "Full administration panel",
      desc: "User management, report processing, data tracking and real-time usage statistics.",
      tags: ["Full control", "Statistics", "Management"],
      techTags: ["Access control", "Role management", "Audit"],
    },
  ],
};

const SECURITY = {
  fr: [
    ["Content Security Policy (CSP)", "En-tête HTTP restreignant les sources autorisées pour scripts, styles, images et connexions — bloque XSS et injection de contenu"],
    ["HTTP Strict Transport Security (HSTS)", "Force le navigateur à utiliser HTTPS exclusivement pendant 1 an, incluant les sous-domaines"],
    ["X-Frame-Options / X-Content-Type-Options", "Protection contre le clickjacking (frame-ancestors: none) et le sniffing MIME (nosniff)"],
    ["Auth sans mot de passe (OTP)", "Connexion par code à usage unique envoyé par email — aucun stockage de mot de passe, aucune vulnérabilité liée"],
    ["Row Level Security (RLS)", "Chaque requête PostgreSQL est filtrée au niveau de la base de données selon l'identité de l'utilisateur"],
    ["Rate limiting distribué (Upstash Redis)", "Protection contre les abus sur tous les endpoints API via Redis distribué, partagé entre instances serverless"],
    ["Validation Zod sur tous les endpoints", "Toutes les données entrantes sont validées et typées côté serveur avant tout traitement ou écriture"],
    ["Séparation client / serveur stricte", "La clé service_role Supabase est confinée aux API Routes — jamais exposée dans le bundle JavaScript client"],
    ["Secrets hors bundle navigateur", "Variables d'environnement injectées au build Vercel, inaccessibles depuis le code exécuté dans le navigateur"],
    ["HTTPS universel + TLS forcé", "TLS sur tous les domaines Vercel, y compris les environnements de prévisualisation par branche"],
    ["security.txt (RFC 9116)", "Fichier standardisé de divulgation responsable des vulnérabilités — conforme aux bonnes pratiques ANSSI"],
    ["Sentry crash reporting anonyme", "Monitoring des erreurs sans collecte de données personnelles (sendDefaultPii: false, aucun session replay)"],
    ["Protection CSRF (vérification Origin)", "Tous les endpoints POST/PATCH vérifient que l'en-tête Origin correspond au domaine — bloque les requêtes cross-site malveillantes"],
    ["Request IDs dans les logs d'audit", "Chaque action admin/signalement génère un identifiant unique tracé dans activity_logs — corrélation cross-service pour enquêtes forensiques"],
    ["Anti-IP spoofing (x-real-ip prioritaire)", "Le rate-limiter utilise x-real-ip (positionné par Vercel) plutôt que x-forwarded-for manipulable par le client"],
  ] as [string, string][],
  en: [
    ["Content Security Policy (CSP)", "HTTP header restricting allowed sources for scripts, styles, images and connections — blocks XSS and content injection"],
    ["HTTP Strict Transport Security (HSTS)", "Forces the browser to use HTTPS exclusively for 1 year, including subdomains"],
    ["X-Frame-Options / X-Content-Type-Options", "Protection against clickjacking (frame-ancestors: none) and MIME sniffing (nosniff)"],
    ["Passwordless Auth (OTP)", "Login via one-time code sent by email — no password storage, no related vulnerabilities"],
    ["Row Level Security (RLS)", "Every PostgreSQL query is filtered at the database level based on user identity"],
    ["Distributed rate limiting (Upstash Redis)", "Abuse protection on all API endpoints via distributed Redis, shared across serverless instances"],
    ["Zod validation on all endpoints", "All incoming data is validated and typed server-side before any processing or write"],
    ["Strict client / server separation", "Supabase service_role key is confined to API Routes — never exposed in the client JavaScript bundle"],
    ["Secrets outside browser bundle", "Environment variables injected at Vercel build, inaccessible from code running in the browser"],
    ["Universal HTTPS + forced TLS", "TLS on all Vercel domains, including branch preview environments"],
    ["security.txt (RFC 9116)", "Standardized responsible vulnerability disclosure file — compliant with ANSSI best practices"],
    ["Anonymous Sentry crash reporting", "Error monitoring without personal data collection (sendDefaultPii: false, no session replay)"],
    ["CSRF protection (Origin check)", "All POST/PATCH endpoints verify the Origin header matches the domain — blocks malicious cross-site requests"],
    ["Request IDs in audit logs", "Every admin/report action generates a unique ID traced in activity_logs — cross-service correlation for forensic investigations"],
    ["Anti-IP spoofing (x-real-ip priority)", "Rate limiter uses x-real-ip (set by Vercel) instead of client-manipulable x-forwarded-for"],
  ] as [string, string][],
};

const TESTS = {
  fr: [
    ["621 tests — 62 fichiers", "Couverture complète en une seule passe : unitaires + intégration, exécutée en < 35 s"],
    ["Tests unitaires (Vitest 4)", "Runner ultrarapide natif ESM — @testing-library/react pour composants, jest-dom pour assertions DOM"],
    ["Tests d'intégration API", "Flux multi-étapes testés : validation Zod, format de réponse HTTP, codes d'erreur cohérents, Content-Type, protection CSRF"],
    ["Tests E2E flux complet (Playwright)", "Flux carte→marqueur→popup→signalement→confirmation, dashboard admin, validation API directe — multi-navigateurs (Chrome, Firefox, Safari)"],
    ["Tests d'accessibilité WCAG 2.1 AA (axe-core)", "Audit automatisé sur 6 pages (login, faq, à propos, confidentialité, accessibilité, accueil) — 0 violation tolérée"],
    ["Seuils de couverture enforced", "95% lignes, 97% fonctions, 93% instructions, 79% branches — le build échoue si les seuils ne sont pas atteints"],
    ["Rapport de couverture CI", "Artifact de couverture HTML/LCOV uploadé automatiquement sur chaque build GitHub Actions — historique 14 jours"],
    ["Pre-commit hooks (Husky)", "ESLint exécuté automatiquement avant chaque commit via lint-staged — code non conforme bloqué"],
  ] as [string, string][],
  en: [
    ["621 tests — 62 files", "Full coverage in a single pass: unit + integration, runs in < 35 s"],
    ["Unit tests (Vitest 4)", "Ultra-fast native ESM runner — @testing-library/react for components, jest-dom for DOM assertions"],
    ["API integration tests", "Multi-step flows tested: Zod validation, HTTP response format, consistent error codes, Content-Type, CSRF protection"],
    ["Full E2E flow tests (Playwright)", "Map→marker→popup→report→confirmation flow, admin dashboard, direct API validation — multi-browser (Chrome, Firefox, Safari)"],
    ["WCAG 2.1 AA accessibility tests (axe-core)", "Automated audit on 6 pages (login, faq, about, privacy, accessibility, home) — 0 violations tolerated"],
    ["Enforced coverage thresholds", "95% lines, 97% functions, 93% statements, 79% branches — build fails if thresholds are not met"],
    ["CI coverage report", "HTML/LCOV coverage artifact automatically uploaded on every GitHub Actions build — 14-day history"],
    ["Pre-commit hooks (Husky)", "ESLint run automatically before each commit via lint-staged — non-compliant code blocked"],
  ] as [string, string][],
};

const METRICS = {
  fr: [
    { value: "2 500+", label: "Stations cartographiées" },
    { value: "17ms", label: "Médiane /api/stations (CDN Vercel)" },
    { value: "99.9%", label: "Disponibilité (SLA Vercel + Supabase)" },
    { value: "621", label: "Tests automatisés (unit + intégration + E2E)" },
    { value: "0 / 7 060", label: "Erreurs 5xx sur stress test Vercel" },
    { value: "17", label: "Régions administratives couvertes" },
  ],
  en: [
    { value: "2,500+", label: "Mapped stations" },
    { value: "17ms", label: "Median /api/stations (Vercel CDN)" },
    { value: "99.9%", label: "Availability (Vercel + Supabase SLA)" },
    { value: "621", label: "Automated tests (unit + integration + E2E)" },
    { value: "0 / 7,060", label: "5xx errors on Vercel stress test" },
    { value: "17", label: "Administrative regions covered" },
  ],
};

const DEVOPS = {
  fr: [
    ["GitHub Actions CI/CD", "Pipeline automatisé sur chaque PR : lint ESLint, 610 tests Vitest, tests E2E Playwright, build Next.js — aucun merge sans validation"],
    ["Déploiement continu Vercel", "Push sur main → build Turbopack → déploiement production automatique en < 60 s avec rollback instantané"],
    ["Preview par branche", "Chaque pull request génère un environnement de prévisualisation isolé avec URL unique"],
    ["Pre-commit hooks (Husky)", "ESLint exécuté automatiquement sur chaque commit via lint-staged — code non conforme bloqué avant push"],
    ["Dependabot", "Mises à jour hebdomadaires automatiques des dépendances npm, groupées par catégorie (framework, DB, tests, UI)"],
    ["Typage statique intégral", "TypeScript 5 strict sur tout le codebase — erreurs détectées à la compilation, pas en production"],
    ["Seuils de couverture enforced", "95% lignes, 97% fonctions minimum — le build CI échoue si la couverture baisse"],
    ["Versioning sémantique", "Tags git versionnés (v1.0.0+) avec historique traçable et changelog automatique"],
  ] as [string, string][],
  en: [
    ["GitHub Actions CI/CD", "Automated pipeline on every PR: ESLint lint, 610 Vitest tests, Playwright E2E tests, Next.js build — no merge without validation"],
    ["Continuous Vercel deployment", "Push to main → Turbopack build → automatic production deployment in < 60 s with instant rollback"],
    ["Branch previews", "Each pull request generates an isolated preview environment with a unique URL"],
    ["Pre-commit hooks (Husky)", "ESLint automatically run on each commit via lint-staged — non-compliant code blocked before push"],
    ["Dependabot", "Automated weekly npm dependency updates, grouped by category (framework, DB, tests, UI)"],
    ["Full static typing", "TypeScript 5 strict across the entire codebase — errors caught at compile time, not in production"],
    ["Enforced coverage thresholds", "95% lines, 97% functions minimum — CI build fails if coverage drops"],
    ["Semantic versioning", "Versioned git tags (v1.0.0+) with traceable history and automatic changelog"],
  ] as [string, string][],
};

const MONITORING = {
  fr: [
    ["Sentry (crash reporting)", "Capture automatique des erreurs client et serveur avec stack traces, source maps et contexte de navigation"],
    ["Endpoint /api/health", "Point de contrôle HTTP vérifiant Supabase et Upstash Redis — retourne 503 si un service est indisponible"],
    ["Source maps en production", "Stack traces déobfusquées dans Sentry — debug précis même sur le code minifié déployé"],
    ["Instrumentation Next.js", "Hook onRequestError capture automatiquement les erreurs serveur sans code additionnel dans chaque route"],
    ["Tunnel Sentry (/monitoring)", "Contourne les bloqueurs de publicités — les erreurs sont toujours rapportées via proxy serveur"],
    ["Zero PII collecté", "sendDefaultPii: false, aucun session replay — conformité Loi 25 sans bannière de consentement requise"],
  ] as [string, string][],
  en: [
    ["Sentry (crash reporting)", "Automatic capture of client and server errors with stack traces, source maps and navigation context"],
    ["Endpoint /api/health", "HTTP health check verifying Supabase and Upstash Redis — returns 503 if a service is unavailable"],
    ["Source maps in production", "Deobfuscated stack traces in Sentry — precise debugging even on minified deployed code"],
    ["Next.js instrumentation", "onRequestError hook automatically captures server errors without additional code in each route"],
    ["Sentry tunnel (/monitoring)", "Bypasses ad blockers — errors are always reported via server proxy"],
    ["Zero PII collected", "sendDefaultPii: false, no session replay — Law 25 compliance with no consent banner required"],
  ] as [string, string][],
};

const PERFORMANCE = {
  fr: [
    ["GET /api/stations — p50 : 17ms · p95 : 111ms", "Servi depuis le CDN Vercel (cache s-maxage=60) — la requête n'atteint pas Supabase sur trafic normal"],
    ["GET /api/health — p50 : 102ms · p95 : 155ms", "Vérification Supabase + Upstash Redis en temps réel — health check complet"],
    ["GET /api/history — p50 : 47ms · p95 : 117ms", "Lecture Supabase avec filtres indexés sur station, adresse, type et date"],
    ["GET /api/admin — p50 : 46ms · p95 : 73ms", "Vérification JWT Auth uniquement — réponse quasi instantanée"],
    ["7 060 requêtes · 0 erreur 5xx", "Stress test à 20 VUs simultanés (IPs uniques) contre le déploiement Vercel preview — aucun crash, aucune dégradation"],
    ["Capacité : 2 000 – 10 000 users simultanés", "Plan actuel (Supabase Pro + PgBouncer + Vercel Hobby) — CDN absorbe les pics, upgrade Vercel Pro si besoin"],
  ] as [string, string][],
  en: [
    ["GET /api/stations — p50: 17ms · p95: 111ms", "Served from Vercel CDN (s-maxage=60 cache) — request never reaches Supabase on normal traffic"],
    ["GET /api/health — p50: 102ms · p95: 155ms", "Real-time Supabase + Upstash Redis health check — full service verification"],
    ["GET /api/history — p50: 47ms · p95: 117ms", "Supabase read with indexed filters on station, address, type and date"],
    ["GET /api/admin — p50: 46ms · p95: 73ms", "JWT Auth check only — near-instant response"],
    ["7,060 requests · 0 5xx errors", "Load test at 20 concurrent VUs (unique IPs) against Vercel preview deployment — no crash, no degradation"],
    ["Capacity: 2,000 – 10,000 concurrent users", "Current plan (Supabase Pro + PgBouncer + Vercel Hobby) — CDN absorbs peaks, upgrade Vercel Pro if needed"],
  ] as [string, string][],
};

const COMPLIANCE = {
  fr: [
    ["Politique de confidentialité (Loi 25)", "Page dédiée listant les données collectées, les sous-traitants, les droits des utilisateurs et le responsable"],
    ["Conditions d'utilisation", "Conditions générales d'utilisation couvrant la responsabilité, la propriété intellectuelle et le droit applicable (Québec)"],
    ["Déclaration d'accessibilité (SGQRI 008)", "Conformité visée WCAG 2.1 AA — lien d'évitement, navigation clavier, ARIA, focus trap, contenu alternatif"],
    ["OpenAPI 3.1 (/openapi.json)", "Spécification complète de l'API REST avec schémas de requête/réponse, codes d'erreur et exemples"],
    ["security.txt (RFC 9116)", "Point de contact standardisé pour la divulgation responsable de vulnérabilités"],
    ["Données open data REQ", "Source officielle gouvernementale — aucune donnée personnelle de tiers collectée ou stockée"],
  ] as [string, string][],
  en: [
    ["Privacy Policy (Law 25)", "Dedicated page listing collected data, sub-processors, user rights and the data controller"],
    ["Terms of use", "General terms of use covering liability, intellectual property and applicable law (Quebec)"],
    ["Accessibility statement (SGQRI 008)", "WCAG 2.1 AA compliance target — skip link, keyboard navigation, ARIA, focus trap, alternative content"],
    ["OpenAPI 3.1 (/openapi.json)", "Complete REST API specification with request/response schemas, error codes and examples"],
    ["security.txt (RFC 9116)", "Standardized contact point for responsible vulnerability disclosure"],
    ["REQ open data", "Official government source — no third-party personal data collected or stored"],
  ] as [string, string][],
};

const UI_STRINGS = {
  fr: {
    siteLabel: "Essence Québec",
    pageTitle: "À propos",
    themeAriaLight: "Mode clair",
    themeAriaDark: "Mode sombre",
    summaryBtn: "Résumé",
    techBtn: "Fiche technique",
    heroTitleDetailed: <>Plateforme de transparence<br className="hidden sm:block" /> des prix de carburant au Québec</>,
    heroTitleSummary: <>Comparez les prix d{"'"}essence<br className="hidden sm:block" /> partout au Québec</>,
    heroDescDetailed: <>Application web haute disponibilité exposant en temps réel les données officielles de la Régie de l{"'"}énergie du Québec — conçue selon les standards modernes d{"'"}architecture cloud et de sécurité gouvernementale.</>,
    heroDescSummary: <>Une application rapide, fiable et sécurisée qui affiche en temps réel les prix officiels de la Régie de l{"'"}énergie pour plus de 2 000 stations-service au Québec.</>,
    techArchTitle: "Architecture technique",
    techArchDesc: "Stack moderne, éprouvée en production, déployée sur infrastructure cloud de niveau entreprise.",
    featuresDetailedTitle: "Fonctionnalités livrées",
    featuresSummaryTitle: "Ce que vous pouvez faire",
    featuresDetailedDesc: "Chaque fonctionnalité est opérationnelle en production, accessible publiquement sans installation.",
    featuresSummaryDesc: "Toutes les fonctionnalités sont disponibles gratuitement, sans inscription, directement depuis votre navigateur.",
    devopsTitle: "Qualité logicielle et pratiques DevOps",
    monitoringTitle: "Monitoring et observabilité",
    complianceTitle: "Conformité et documentation",
    securityTitle: "Sécurité applicative",
    testsTitle: "Tests et assurance qualité",
    performanceTitle: "Performance mesurée en production (stress test Vercel)",
    dataSourceTitle: "Données officielles — Régie de l'énergie du Québec",
    dataSourceDesc: <>Les prix affichés proviennent exclusivement du flux officiel publié par la Régie de l{"'"}énergie du Québec (<strong>REQ</strong>), organisme gouvernemental mandaté par la Loi sur la Régie de l{"'"}énergie. Les données sont publiques, open data, et constituent la référence légale des prix des carburants en station.</>,
    dataSourceTags: ["Open Data gouvernemental", "Mise à jour automatique", "Données vérifiées REQ", "Conformité loi sur l'énergie"],
    contactDesc: <>Projet développé par <strong className="text-gray-700 dark:text-gray-300">Mathieu Fournier</strong> · Pour toute question ou collaboration</>,
  },
  en: {
    siteLabel: "Essence Québec",
    pageTitle: "About",
    themeAriaLight: "Light mode",
    themeAriaDark: "Dark mode",
    summaryBtn: "Summary",
    techBtn: "Tech sheet",
    heroTitleDetailed: <>Fuel price transparency platform<br className="hidden sm:block" /> for Quebec</>,
    heroTitleSummary: <>Compare gas prices<br className="hidden sm:block" /> anywhere in Quebec</>,
    heroDescDetailed: <>High-availability web application exposing real-time official data from the Régie de l{"'"}énergie du Québec — built to modern cloud architecture and government security standards.</>,
    heroDescSummary: <>A fast, reliable and secure application that displays real-time official prices from the Régie de l{"'"}énergie for over 2,000 gas stations in Quebec.</>,
    techArchTitle: "Technical architecture",
    techArchDesc: "Modern stack, proven in production, deployed on enterprise-grade cloud infrastructure.",
    featuresDetailedTitle: "Delivered features",
    featuresSummaryTitle: "What you can do",
    featuresDetailedDesc: "Every feature is live in production, publicly accessible with no installation required.",
    featuresSummaryDesc: "All features are free, require no sign-up, and are accessible directly from your browser.",
    devopsTitle: "Software quality and DevOps practices",
    monitoringTitle: "Monitoring and observability",
    complianceTitle: "Compliance and documentation",
    securityTitle: "Application security",
    testsTitle: "Testing and quality assurance",
    performanceTitle: "Measured production performance (Vercel stress test)",
    dataSourceTitle: "Official data — Régie de l'énergie du Québec",
    dataSourceDesc: <>Displayed prices come exclusively from the official feed published by the Régie de l{"'"}énergie du Québec (<strong>REQ</strong>), the government body mandated by the Energy Board Act. The data is public, open data, and constitutes the legal reference for fuel prices at stations.</>,
    dataSourceTags: ["Government open data", "Automatic updates", "REQ verified data", "Energy law compliance"],
    contactDesc: <>Project developed by <strong className="text-gray-700 dark:text-gray-300">Mathieu Fournier</strong> · For any question or collaboration</>,
  },
};

export default function TechContent() {
  const [detailed, setDetailed] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const { locale } = useLanguage();
  const isDark = resolvedTheme === "dark";
  const t = UI_STRINGS[locale];
  const stack = STACK[locale];
  const features = FEATURES[locale];
  const security = SECURITY[locale];
  const tests = TESTS[locale];
  const metrics = METRICS[locale];
  const devops = DEVOPS[locale];
  const monitoring = MONITORING[locale];
  const compliance = COMPLIANCE[locale];
  const performance = PERFORMANCE[locale];
  const buzzwords = BUZZWORDS[locale];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header style={{ background: "#003DA5" }} className="text-white">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center justify-center size-8 rounded-lg hover:bg-white/15 transition-colors">
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-white/60 mb-0.5">{t.siteLabel}</div>
              <div className="text-xl font-bold">{t.pageTitle}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setDetailed(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all border-none cursor-pointer"
              style={!detailed ? { background: "rgba(255,255,255,0.25)", color: "#fff" } : { background: "transparent", color: "rgba(255,255,255,0.6)" }}
            >
              <Eye className="size-3.5" />
              <span className="hidden sm:inline">{t.summaryBtn}</span>
            </button>
            <button
              onClick={() => setDetailed(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all border-none cursor-pointer"
              style={detailed ? { background: "rgba(255,255,255,0.25)", color: "#fff" } : { background: "transparent", color: "rgba(255,255,255,0.6)" }}
            >
              <Code2 className="size-3.5" />
              <span className="hidden sm:inline">{t.techBtn}</span>
            </button>
          </div>
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="flex items-center justify-center size-8 rounded-lg hover:bg-white/15 transition-colors border-none cursor-pointer bg-transparent text-white/70 hover:text-white"
            aria-label={isDark ? t.themeAriaLight : t.themeAriaDark}
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
        {/* Accent bar */}
        <div style={{ height: 4, background: "linear-gradient(90deg, #FFD700 0%, #FFD700 33%, #003DA5 33%, #003DA5 67%, #FF0000 67%)" }} />
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-16">

        {/* Hero */}
        <motion.section className="text-center space-y-4" initial="hidden" animate="visible" variants={stagger}>
          <motion.h1 variants={fadeUp} transition={{ duration: 0.5 }} className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
            {detailed ? t.heroTitleDetailed : t.heroTitleSummary}
          </motion.h1>
          <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            {detailed ? t.heroDescDetailed : t.heroDescSummary}
          </motion.p>
          {/* Buzzwords — résumé seulement */}
          {!detailed && (
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="flex flex-wrap justify-center gap-2 pt-2">
              {buzzwords.map((b, i) => (
                <motion.span
                  key={b}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
                  className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[12px] font-semibold rounded-full px-3 py-1 border border-blue-200 dark:border-blue-800"
                >
                  <Zap className="size-3" />
                  {b}
                </motion.span>
              ))}
            </motion.div>
          )}
        </motion.section>

        {/* Metrics — détaillé seulement */}
        {detailed && (
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={stagger}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {metrics.map((m) => (
                <motion.div key={m.label} variants={fadeUp} transition={{ duration: 0.4 }} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-1">{m.value}</div>
                  <div className="text-[12px] text-gray-500 dark:text-gray-400">{m.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Stack — détaillé seulement */}
        {detailed && (
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{t.techArchTitle}</h2>
              <p className="text-[13px] text-gray-500 dark:text-gray-400">{t.techArchDesc}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {stack.map((layer) => {
                const Icon = layer.icon;
                return (
                  <div key={layer.category} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800" style={{ borderLeftWidth: 3, borderLeftColor: layer.color }}>
                      <Icon className="size-4 shrink-0" style={{ color: layer.color }} />
                      <span className="font-semibold text-[13px] text-gray-900 dark:text-white">{layer.category}</span>
                    </div>
                    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                      {layer.items.map((item) => (
                        <li key={item.name} className="px-4 py-2.5 flex flex-col gap-0.5">
                          <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">{item.name}</span>
                          <span className="text-[11.5px] text-gray-500 dark:text-gray-400">{item.desc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Features — toujours visible */}
        <motion.section className="space-y-6" initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp} transition={{ duration: 0.4 }}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {detailed ? t.featuresDetailedTitle : t.featuresSummaryTitle}
            </h2>
            <p className="text-[13px] text-gray-500 dark:text-gray-400">
              {detailed ? t.featuresDetailedDesc : t.featuresSummaryDesc}
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((f) => {
              const Icon = f.icon;
              const activeTags = detailed ? f.techTags : f.tags;
              return (
                <motion.div key={f.title} variants={fadeUp} transition={{ duration: 0.4 }} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex gap-4 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  <div className="size-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
                    <Icon className="size-4 text-blue-700 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-gray-900 dark:text-white mb-1">{f.title}</div>
                    <div className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed mb-2">{f.desc}</div>
                    <div className="flex flex-wrap gap-1">
                      {activeTags.map((tag) => (
                        <span key={tag} className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10.5px] font-medium rounded-full px-2 py-0.5">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* DevOps & CI/CD — détaillé seulement */}
        {detailed && (
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <GitBranch className="size-5 text-gray-500" />
              <h2 className="text-base font-bold text-gray-900 dark:text-white">{t.devopsTitle}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-[13px]">
              {devops.map(([title, desc]) => (
                <div key={title} className="flex gap-2.5">
                  <CheckCircle2 className="size-4 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-gray-200">{title}</div>
                    <div className="text-[11.5px] text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Monitoring & Observabilité — détaillé seulement */}
        {detailed && (
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Activity className="size-5 text-orange-500" />
              <h2 className="text-base font-bold text-gray-900 dark:text-white">{t.monitoringTitle}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-[13px]">
              {monitoring.map(([title, desc]) => (
                <div key={title} className="flex gap-2.5">
                  <CheckCircle2 className="size-4 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-gray-200">{title}</div>
                    <div className="text-[11.5px] text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Conformité & Documentation — détaillé seulement */}
        {detailed && (
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="size-5 text-blue-500" />
              <h2 className="text-base font-bold text-gray-900 dark:text-white">{t.complianceTitle}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-[13px]">
              {compliance.map(([title, desc], i) => (
                <div key={`${title}-${i}`} className="flex gap-2.5">
                  <CheckCircle2 className="size-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-gray-200">{title}</div>
                    <div className="text-[11.5px] text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sécurité applicative — détaillé seulement */}
        {detailed && (
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-green-500" />
              <h2 className="text-base font-bold text-gray-900 dark:text-white">{t.securityTitle}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-[13px]">
              {security.map(([title, desc]) => (
                <div key={title} className="flex gap-2.5">
                  <CheckCircle2 className="size-4 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-gray-200">{title}</div>
                    <div className="text-[11.5px] text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Couverture de tests — détaillé seulement */}
        {detailed && (
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <TestTube2 className="size-5 text-purple-500" />
              <h2 className="text-base font-bold text-gray-900 dark:text-white">{t.testsTitle}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-[13px]">
              {tests.map(([title, desc]) => (
                <div key={title} className="flex gap-2.5">
                  <CheckCircle2 className="size-4 text-purple-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-gray-200">{title}</div>
                    <div className="text-[11.5px] text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Performance mesurée — détaillé seulement */}
        {detailed && (
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Zap className="size-5 text-yellow-500" />
              <h2 className="text-base font-bold text-gray-900 dark:text-white">{t.performanceTitle}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-[13px]">
              {performance.map(([title, desc]) => (
                <div key={title} className="flex gap-2.5">
                  <CheckCircle2 className="size-4 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-gray-200 font-mono text-[12px]">{title}</div>
                    <div className="text-[11.5px] text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Source de données — toujours visible */}
        <section className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
              <Shield className="size-5 text-blue-700 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">{t.dataSourceTitle}</h3>
              <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed">
                {t.dataSourceDesc}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {t.dataSourceTags.map((tag) => (
                  <span key={tag} className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[11px] font-semibold rounded-full px-2.5 py-0.5">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="text-center space-y-3 pb-4">
          <div className="flex items-center justify-center gap-2 text-gray-400 dark:text-gray-600">
            <div className="h-px flex-1 bg-current" />
            <Mail className="size-4" />
            <div className="h-px flex-1 bg-current" />
          </div>
          <p className="text-[13px] text-gray-500 dark:text-gray-400">
            {t.contactDesc}
          </p>
          <a href="mailto:mathieufournierqc@outlook.com" className="inline-flex items-center gap-2 text-[13px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            <Mail className="size-3.5" /> mathieufournierqc@outlook.com
          </a>
        </section>

      </main>
      <ScrollToTop containerId="tech-scroll-container" />
    </div>
  );
}
