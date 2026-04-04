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

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

const BUZZWORDS = [
  "Rapide", "Performant", "Sécurisé", "Temps réel",
  "Haute disponibilité", "Mobile-first", "Open Data",
  "Accessible", "Fiable", "Automatisé", "CI/CD", "Monitoring",
];

const STACK = [
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
];

const FEATURES = [
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
];

const SECURITY: [string, string][] = [
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
];

const TESTS: [string, string][] = [
  ["196 tests — 28 fichiers", "Couverture complète en une seule passe : unitaires + intégration, exécutée en < 13 s"],
  ["Tests unitaires (Vitest 4)", "Runner ultrarapide natif ESM — @testing-library/react pour composants, jest-dom pour assertions DOM"],
  ["Tests d'intégration API", "Flux multi-étapes testés : validation Zod, format de réponse HTTP, codes d'erreur cohérents, Content-Type"],
  ["Tests E2E (Playwright)", "Carte interactive, navigation entre pages, formulaire de connexion, changelog — multi-navigateurs (Chrome, Firefox, Safari)"],
  ["Seuils de couverture enforced", "80% lignes, 80% fonctions, 77% instructions, 65% branches — le build échoue si les seuils ne sont pas atteints"],
  ["GitHub Actions CI", "Pipeline automatisé sur chaque PR : lint ESLint, tests Vitest, build Next.js de production"],
  ["Pre-commit hooks (Husky)", "ESLint exécuté automatiquement avant chaque commit via lint-staged — code non conforme bloqué"],
  ["Dependabot", "Mises à jour hebdomadaires des dépendances npm avec groupement intelligent (Next.js, Supabase, testing, UI)"],
];

const METRICS = [
  { value: "2 000+", label: "Stations cartographiées" },
  { value: "< 100 ms", label: "Temps de réponse API moyen" },
  { value: "99.9%", label: "Disponibilité (SLA Vercel + Supabase)" },
  { value: "196", label: "Tests automatisés (unit + intégration + E2E)" },
  { value: "12", label: "En-têtes de sécurité HTTP actifs" },
  { value: "17", label: "Régions administratives couvertes" },
];

export default function TechPage() {
  const [detailed, setDetailed] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

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
              <div className="text-[10px] font-semibold uppercase tracking-widest text-white/60 mb-0.5">Essence Québec</div>
              <div className="text-xl font-bold">À propos</div>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setDetailed(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all border-none cursor-pointer"
              style={!detailed ? { background: "rgba(255,255,255,0.25)", color: "#fff" } : { background: "transparent", color: "rgba(255,255,255,0.6)" }}
            >
              <Eye className="size-3.5" />
              <span className="hidden sm:inline">Résumé</span>
            </button>
            <button
              onClick={() => setDetailed(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all border-none cursor-pointer"
              style={detailed ? { background: "rgba(255,255,255,0.25)", color: "#fff" } : { background: "transparent", color: "rgba(255,255,255,0.6)" }}
            >
              <Code2 className="size-3.5" />
              <span className="hidden sm:inline">Fiche technique</span>
            </button>
          </div>
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="flex items-center justify-center size-8 rounded-lg hover:bg-white/15 transition-colors border-none cursor-pointer bg-transparent text-white/70 hover:text-white"
            aria-label={isDark ? "Mode clair" : "Mode sombre"}
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
            {detailed
              ? <>Plateforme de transparence<br className="hidden sm:block" /> des prix de carburant au Québec</>
              : <>Comparez les prix d{"'"}essence<br className="hidden sm:block" /> partout au Québec</>
            }
          </motion.h1>
          <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            {detailed
              ? <>Application web haute disponibilité exposant en temps réel les données officielles de la Régie de l{"'"}énergie du Québec — conçue selon les standards modernes d{"'"}architecture cloud et de sécurité gouvernementale.</>
              : <>Une application rapide, fiable et sécurisée qui affiche en temps réel les prix officiels de la Régie de l{"'"}énergie pour plus de 2 000 stations-service au Québec.</>
            }
          </motion.p>
          {/* Buzzwords — résumé seulement */}
          {!detailed && (
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="flex flex-wrap justify-center gap-2 pt-2">
              {BUZZWORDS.map((b, i) => (
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
              {METRICS.map((m) => (
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Architecture technique</h2>
              <p className="text-[13px] text-gray-500 dark:text-gray-400">Stack moderne, éprouvée en production, déployée sur infrastructure cloud de niveau entreprise.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {STACK.map((layer) => {
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
        <motion.section className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={stagger}>
          <motion.div variants={fadeUp} transition={{ duration: 0.4 }}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {detailed ? "Fonctionnalités livrées" : "Ce que vous pouvez faire"}
            </h2>
            <p className="text-[13px] text-gray-500 dark:text-gray-400">
              {detailed
                ? "Chaque fonctionnalité est opérationnelle en production, accessible publiquement sans installation."
                : "Toutes les fonctionnalités sont disponibles gratuitement, sans inscription, directement depuis votre navigateur."
              }
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map((f) => {
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
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Qualité logicielle et pratiques DevOps</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-[13px]">
              {[
                ["GitHub Actions CI/CD", "Pipeline automatisé sur chaque PR : lint ESLint, 196 tests Vitest, build Next.js — aucun merge sans validation"],
                ["Déploiement continu Vercel", "Push sur main → build Turbopack → déploiement production automatique en < 60 s avec rollback instantané"],
                ["Preview par branche", "Chaque pull request génère un environnement de prévisualisation isolé avec URL unique"],
                ["Pre-commit hooks (Husky)", "ESLint exécuté automatiquement sur chaque commit via lint-staged — code non conforme bloqué avant push"],
                ["Dependabot", "Mises à jour hebdomadaires automatiques des dépendances npm, groupées par catégorie (framework, DB, tests, UI)"],
                ["Typage statique intégral", "TypeScript 5 strict sur tout le codebase — erreurs détectées à la compilation, pas en production"],
                ["Seuils de couverture enforced", "80% lignes, 80% fonctions minimum — le build CI échoue si la couverture baisse"],
                ["Versioning sémantique", "Tags git versionnés (v1.0.0+) avec historique traçable et changelog automatique"],
              ].map(([title, desc]) => (
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
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Monitoring et observabilité</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-[13px]">
              {[
                ["Sentry (crash reporting)", "Capture automatique des erreurs client et serveur avec stack traces, source maps et contexte de navigation"],
                ["Endpoint /api/health", "Point de contrôle HTTP pour monitoring d'uptime externe (UptimeRobot, BetterUptime, Pingdom)"],
                ["Source maps en production", "Stack traces déobfusquées dans Sentry — debug précis même sur le code minifié déployé"],
                ["Instrumentation Next.js", "Hook onRequestError capture automatiquement les erreurs serveur sans code additionnel dans chaque route"],
                ["Tunnel Sentry (/monitoring)", "Contourne les bloqueurs de publicités — les erreurs sont toujours rapportées via proxy serveur"],
                ["Zero PII collecté", "sendDefaultPii: false, aucun session replay — conformité Loi 25 sans bannière de consentement requise"],
              ].map(([title, desc]) => (
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
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Conformité et documentation</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-[13px]">
              {[
                ["Politique de confidentialité (Loi 25)", "Page dédiée listant les données collectées, les sous-traitants, les droits des utilisateurs et le responsable"],
                ["OpenAPI 3.1 (/openapi.json)", "Spécification complète de l'API REST avec schémas de requête/réponse, codes d'erreur et exemples"],
                ["security.txt (RFC 9116)", "Point de contact standardisé pour la divulgation responsable de vulnérabilités"],
                ["README technique", "Documentation complète : stack, installation, variables d'environnement, scripts, architecture du projet"],
                ["Politique de confidentialité (Loi 25)", "Conformité à la loi québécoise sur la protection des renseignements personnels — aucune collecte de PII"],
                ["Données open data REQ", "Source officielle gouvernementale — aucune donnée personnelle de tiers collectée ou stockée"],
              ].map(([title, desc], i) => (
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
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Sécurité applicative</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-[13px]">
              {SECURITY.map(([title, desc]) => (
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
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Tests et assurance qualité</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-[13px]">
              {TESTS.map(([title, desc]) => (
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

        {/* Source de données — toujours visible */}
        <section className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
              <Shield className="size-5 text-blue-700 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Données officielles — Régie de l{"'"}énergie du Québec</h3>
              <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed">
                Les prix affichés proviennent exclusivement du flux officiel publié par la Régie de l{"'"}énergie du Québec (<strong>REQ</strong>), organisme gouvernemental mandaté par la Loi sur la Régie de l{"'"}énergie. Les données sont publiques, open data, et constituent la référence légale des prix des carburants en station.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Open Data gouvernemental", "Mise à jour automatique", "Données vérifiées REQ", "Conformité loi sur l'énergie"].map((t) => (
                  <span key={t} className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[11px] font-semibold rounded-full px-2.5 py-0.5">{t}</span>
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
            Projet développé par <strong className="text-gray-700 dark:text-gray-300">Mathieu Fournier</strong> · Pour toute question ou collaboration
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
