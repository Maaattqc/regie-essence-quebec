import Link from "next/link";
import {
  ArrowLeft, Globe, Server, Database, Cloud, Shield,
  Zap, Map, BarChart3, Bell, Users, Lock, Smartphone,
  RefreshCw, Search, Star, MessageSquare, Flag, Clock,
  CheckCircle2, Layers, GitBranch, Mail,
} from "lucide-react";

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
    ],
  },
  {
    category: "Backend & API",
    color: "#6d28d9",
    icon: Server,
    items: [
      { name: "Next.js API Routes (Serverless)", desc: "Endpoints RESTful déployés sur l'Edge Network mondial" },
      { name: "Zod 4", desc: "Validation de données stricte côté serveur et client" },
      { name: "Rate Limiting", desc: "Protection contre les abus par IP, sans dépendances externes" },
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
      { name: "CI/CD automatisé", desc: "Déploiement continu à chaque push GitHub, rollback instantané" },
      { name: "Preview Deployments", desc: "Environnement de prévisualisation unique par branche" },
      { name: "Vercel Cron Jobs", desc: "Capture automatique des prix à intervalle configurable" },
      { name: "Resend", desc: "Livraison d'emails transactionnels avec domaine vérifié SPF/DKIM/DMARC" },
    ],
  },
];

const FEATURES = [
  {
    icon: Map,
    title: "Cartographie interactive temps réel",
    desc: "Visualisation de 2 000+ stations-service sur l'ensemble du territoire québécois avec prix mis à jour automatiquement via les données officielles de la Régie de l'énergie.",
    tags: ["Données gouvernementales", "Temps réel", "Géolocalisation"],
  },
  {
    icon: Search,
    title: "Moteur de recherche géospatial",
    desc: "Localisation de la station la moins chère dans un rayon personnalisable autour de la position de l'utilisateur, avec calcul de distance orthodromique précis.",
    tags: ["Algorithme Haversine", "Rayon ajustable", "Tri par prix"],
  },
  {
    icon: Layers,
    title: "Clustering adaptatif haute performance",
    desc: "Regroupement intelligent des marqueurs selon le niveau de zoom et les filtres actifs, avec mémoire cache SessionStorage pour un chargement quasi instantané.",
    tags: ["Cache client", "Rendu différé", "60 fps"],
  },
  {
    icon: BarChart3,
    title: "Analyse comparative multi-régions",
    desc: "Tableau de bord comparatif des prix moyens, minimums, maximums et écarts par région administrative et par ville, avec indicateurs de tendance vs moyenne provinciale.",
    tags: ["17 régions", "Stats avancées", "Delta vs moyenne"],
  },
  {
    icon: Clock,
    title: "Historique des prix 30 jours",
    desc: "Graphique SVG d'évolution des prix par station sur les 30 derniers jours, généré côté client sans dépendance externe à une librairie de graphiques.",
    tags: ["SVG natif", "30 jours", "Par type de carburant"],
  },
  {
    icon: MessageSquare,
    title: "Système de commentaires communautaire",
    desc: "Module d'avis avec réponses imbriquées, votes (like/dislike) authentifiés ou anonymes, modération admin avec suppression douce, synchronisation temps réel.",
    tags: ["Votes anonymes", "Temps réel", "Modération"],
  },
  {
    icon: Flag,
    title: "Signalement d'inexactitudes",
    desc: "Formulaire de signalement avec validation Zod, identification de l'utilisateur et workflow de traitement administratif (nouveau → en traitement → résolu).",
    tags: ["Workflow admin", "Validation stricte", "Traçabilité"],
  },
  {
    icon: Shield,
    title: "Sécurité et conformité",
    desc: "Authentification sans mot de passe (OTP), Row Level Security PostgreSQL, rate limiting par IP, validation serveur sur tous les endpoints, service role isolé.",
    tags: ["Sans mot de passe", "RLS PostgreSQL", "Rate limiting"],
  },
  {
    icon: Star,
    title: "Gestion des favoris persistante",
    desc: "Marquage de stations favorites stocké localement (localStorage), accessible hors connexion, avec vue filtrée dédiée sur la carte.",
    tags: ["Hors connexion", "Persistance locale", "Filtrage rapide"],
  },
  {
    icon: Smartphone,
    title: "Expérience mobile optimisée",
    desc: "Interface entièrement responsive avec navigation tactile fluide, popups et modals adaptés aux petits écrans, typographie et espacement calibrés pour mobile.",
    tags: ["Responsive", "Touch-friendly", "Mode sombre/clair"],
  },
  {
    icon: RefreshCw,
    title: "Synchronisation automatique des données",
    desc: "Pipeline de capture automatisé via Cron Jobs Vercel, décompression gzip des données GeoJSON de la Régie, déduplication et stockage incrémental en base.",
    tags: ["Cron automatique", "GeoJSON", "Déduplication"],
  },
  {
    icon: Lock,
    title: "Panneau d'administration sécurisé",
    desc: "Interface de gestion complète avec gestion des rôles utilisateurs, traitement des signalements, déclenchement manuel des snapshots et statistiques d'utilisation.",
    tags: ["Contrôle d'accès", "Gestion des rôles", "Audit"],
  },
];

const METRICS = [
  { value: "2 000+", label: "Stations cartographiées" },
  { value: "< 100 ms", label: "Temps de réponse API moyen" },
  { value: "99.9%", label: "Disponibilité (SLA Vercel + Supabase)" },
  { value: "40+", label: "Régions Edge mondiales" },
  { value: "4", label: "Types de carburant suivis" },
  { value: "17", label: "Régions administratives couvertes" },
];

export default function TechPage() {
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
              <div className="text-xl font-bold">Fiche technique</div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[12px] text-white/70 border border-white/20 rounded-full px-3 py-1">
            <CheckCircle2 className="size-3.5 text-green-400" />
            Production · essence-quebec.ca
          </div>
        </div>
        {/* Accent bar */}
        <div style={{ height: 4, background: "linear-gradient(90deg, #FFD700 0%, #FFD700 33%, #003DA5 33%, #003DA5 67%, #FF0000 67%)" }} />
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-16">

        {/* Hero */}
        <section className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
            Plateforme de transparence<br className="hidden sm:block" /> des prix de carburant au Québec
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Application web haute disponibilité exposant en temps réel les données officielles de la Régie de l&apos;énergie du Québec — conçue selon les standards modernes d&apos;architecture cloud et de sécurité gouvernementale.
          </p>
        </section>

        {/* Metrics */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {METRICS.map((m) => (
              <div key={m.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 text-center">
                <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-1">{m.value}</div>
                <div className="text-[12px] text-gray-500 dark:text-gray-400">{m.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Stack */}
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

        {/* Features */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Fonctionnalités livrées</h2>
            <p className="text-[13px] text-gray-500 dark:text-gray-400">Chaque fonctionnalité est opérationnelle en production, accessible publiquement sans installation.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex gap-4">
                  <div className="size-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
                    <Icon className="size-4 text-blue-700 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-gray-900 dark:text-white mb-1">{f.title}</div>
                    <div className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed mb-2">{f.desc}</div>
                    <div className="flex flex-wrap gap-1">
                      {f.tags.map((tag) => (
                        <span key={tag} className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10.5px] font-medium rounded-full px-2 py-0.5">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* DevOps & CI/CD */}
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <GitBranch className="size-5 text-gray-500" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Qualité logicielle & pratiques DevOps</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 text-[13px]">
            {[
              ["Déploiement continu (CI/CD)", "Push sur main → build Turbopack → déploiement production automatique en < 60 s"],
              ["Preview par branche", "Chaque pull request génère un environnement de prévisualisation isolé avec URL unique"],
              ["Rollback instantané", "Retour à n'importe quelle version précédente en un clic depuis le tableau de bord Vercel"],
              ["Variables d'environnement sécurisées", "Secrets injectés au build, jamais exposés côté client — séparation production/preview/dev"],
              ["Typage statique intégral", "Zero any TypeScript sur tout le codebase — erreurs détectées à la compilation, pas en production"],
              ["Validation Zod sur tous les endpoints", "Chaque entrée utilisateur est validée et assainie côté serveur avant toute opération base de données"],
              ["Rate limiting sans infrastructure", "Protection contre les abus implémentée en mémoire Edge, sans Redis ni dépendance externe"],
              ["Emails transactionnels certifiés", "SPF + DKIM + DMARC configurés sur domaine personnalisé — délivrabilité maximale"],
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

        {/* Source de données */}
        <section className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
              <Shield className="size-5 text-blue-700 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Données officielles — Régie de l&apos;énergie du Québec</h3>
              <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed">
                Les prix affichés proviennent exclusivement du flux GeoJSON officiel publié par la Régie de l&apos;énergie du Québec (<strong>REQ</strong>), organisme gouvernemental mandaté par la Loi sur la Régie de l&apos;énergie. Les données sont publiques, open data, et constituent la référence légale des prix planchers des carburants en station. Aucune donnée tierce ou estimée n&apos;est utilisée.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Open Data gouvernemental", "Mise à jour automatique", "Données vérifiées REQ", "Conformité loi sur l'énergie"].map((t) => (
                  <span key={t} className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[11px] font-semibold rounded-full px-2.5 py-0.5">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact / CTA */}
        <section className="text-center space-y-3 pb-4">
          <div className="flex items-center justify-center gap-2 text-gray-400 dark:text-gray-600">
            <div className="h-px flex-1 bg-current" />
            <Mail className="size-4" />
            <div className="h-px flex-1 bg-current" />
          </div>
          <p className="text-[13px] text-gray-500 dark:text-gray-400">
            Projet développé par <strong className="text-gray-700 dark:text-gray-300">Mathieu Fournier</strong> · Pour toute question technique ou collaboration
          </p>
          <a href="mailto:mathieufournierqc@outlook.com" className="inline-flex items-center gap-2 text-[13px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            <Mail className="size-3.5" /> mathieufournierqc@outlook.com
          </a>
        </section>

      </main>
    </div>
  );
}
