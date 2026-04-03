"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import {
  ArrowLeft, Sun, Moon, Shield, Database, Mail,
  Server, Lock, UserCheck, Trash2, Download, Eye,
} from "lucide-react";
const LAST_UPDATED = "2 avril 2026";

const PROCESSORS = [
  {
    name: "Vercel Inc.",
    role: "Hébergement de l'application web",
    location: "Canada",
    link: "https://vercel.com/legal/privacy-policy",
  },
  {
    name: "Supabase Inc.",
    role: "Base de données PostgreSQL et authentification",
    location: "Canada (AWS ca-central-1)",
    link: "https://supabase.com/privacy",
  },
  {
    name: "Resend Inc.",
    role: "Envoi des emails de connexion (OTP)",
    location: "États-Unis",
    link: "https://resend.com/legal/privacy-policy",
  },
];

const DATA_COLLECTED = [
  {
    icon: Eye,
    label: "Session anonyme (UUID)",
    purpose: "Comptage des visites pour les statistiques d'utilisation du service.",
    retention: "90 jours",
    optional: false,
  },
  {
    icon: Mail,
    label: "Adresse courriel",
    purpose: "Authentification par code à usage unique (OTP). Jamais utilisée à des fins commerciales.",
    retention: "Jusqu'à suppression du compte",
    optional: true,
  },
  {
    icon: UserCheck,
    label: "Commentaires et avis publics",
    purpose: "Affichage communautaire des avis sur les stations-service.",
    retention: "Jusqu'à suppression par l'utilisateur ou l'administrateur",
    optional: true,
  },
  {
    icon: Shield,
    label: "Signalements de prix",
    purpose: "Traitement des signalements de prix inexacts par l'équipe d'administration.",
    retention: "12 mois",
    optional: true,
  },
  {
    icon: Server,
    label: "Adresse IP (temporaire)",
    purpose: "Protection contre les abus (rate limiting). Non stockée de façon permanente.",
    retention: "Non persistée — mémoire uniquement",
    optional: false,
  },
];

const RIGHTS = [
  { icon: Eye, label: "Droit d'accès", desc: "Obtenir une copie de toutes les données vous concernant." },
  { icon: UserCheck, label: "Droit de rectification", desc: "Corriger des informations inexactes ou incomplètes." },
  { icon: Trash2, label: "Droit à l'effacement", desc: "Demander la suppression de votre compte et de vos données." },
  { icon: Download, label: "Droit à la portabilité", desc: "Recevoir vos données dans un format structuré et lisible." },
  { icon: Lock, label: "Droit de retrait du consentement", desc: "Retirer votre consentement à tout moment, sans préjudice." },
];

export default function ConfidentialitePage() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header style={{ background: "#003DA5" }} className="text-white">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center justify-center size-8 rounded-lg hover:bg-white/15 transition-colors">
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-white/60 mb-0.5">Essence Québec</div>
              <div className="text-xl font-bold">Politique de confidentialité</div>
            </div>
          </div>
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="flex items-center justify-center size-8 rounded-lg hover:bg-white/15 transition-colors border-none cursor-pointer bg-transparent text-white/70 hover:text-white"
            aria-label={isDark ? "Mode clair" : "Mode sombre"}
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
        <div style={{ height: 4, background: "linear-gradient(90deg, #FFD700 0%, #FFD700 33%, #003DA5 33%, #003DA5 67%, #FF0000 67%)" }} />
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-12">

        {/* Intro */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            <span>Conforme à la Loi 25 (Québec)</span>
            <span>·</span>
            <span>Mise à jour : {LAST_UPDATED}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Protection de vos renseignements personnels
          </h1>
          <p className="text-[14px] text-gray-600 dark:text-gray-400 leading-relaxed">
            Cette politique explique quelles données sont collectées lors de votre utilisation d&apos;Essence Québec,
            pourquoi elles le sont, comment elles sont protégées, et quels droits vous avez en vertu de la{" "}
            <strong>Loi sur la protection des renseignements personnels dans le secteur privé</strong> (Loi 25, Québec)
            et du <strong>Règlement général sur la protection des données</strong> (RGPD, pour les visiteurs européens).
          </p>
        </section>

        {/* Responsable */}
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-3">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserCheck className="size-4 text-blue-600 dark:text-blue-400" />
            Responsable du traitement
          </h2>
          <div className="text-[13px] text-gray-600 dark:text-gray-400 space-y-1">
            <div><strong className="text-gray-800 dark:text-gray-200">Mathieu Fournier</strong></div>
            <div>Développeur indépendant — Québec, Canada</div>
            <a href="mailto:mathieufournierqc@outlook.com" className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline font-medium">
              <Mail className="size-3.5" /> mathieufournierqc@outlook.com
            </a>
          </div>
        </section>

        {/* Données collectées */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Database className="size-4 text-blue-600 dark:text-blue-400" />
            Données collectées
          </h2>
          <div className="space-y-3">
            {DATA_COLLECTED.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex gap-3">
                  <div className="size-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
                    <Icon className="size-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-semibold text-gray-900 dark:text-white">{item.label}</span>
                      <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${item.optional ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400" : "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"}`}>
                        {item.optional ? "Optionnel (compte requis)" : "Automatique"}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-500 dark:text-gray-400">{item.purpose}</p>
                    <div className="text-[11px] text-gray-400 dark:text-gray-500">
                      Conservation : <span className="font-medium">{item.retention}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 px-1">
            Aucun cookie publicitaire ni traceur tiers n&apos;est utilisé. Aucune donnée n&apos;est vendue ou partagée à des fins commerciales.
          </p>
        </section>

        {/* Sous-traitants */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Server className="size-4 text-blue-600 dark:text-blue-400" />
            Sous-traitants (fournisseurs de services)
          </h2>
          <p className="text-[13px] text-gray-500 dark:text-gray-400">
            Ces entreprises traitent des données en notre nom et sont liées par des obligations contractuelles de confidentialité.
            Les données sont principalement hébergées au Canada. L&apos;envoi des courriels (Resend) transite par des serveurs aux États-Unis. Des garanties contractuelles appropriées sont en place.
          </p>
          <div className="space-y-3">
            {PROCESSORS.map((p) => (
              <div key={p.name} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-0.5">
                  <div className="text-[13px] font-semibold text-gray-900 dark:text-white">{p.name}</div>
                  <div className="text-[12px] text-gray-500 dark:text-gray-400">{p.role}</div>
                  <div className="text-[11px] text-gray-400 dark:text-gray-500">Localisation : {p.location}</div>
                </div>
                <a
                  href={p.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                >
                  Politique de confidentialité
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Vos droits */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Lock className="size-4 text-blue-600 dark:text-blue-400" />
            Vos droits
          </h2>
          <p className="text-[13px] text-gray-500 dark:text-gray-400">
            Conformément à la Loi 25 et au RGPD, vous disposez des droits suivants. Pour les exercer, contactez-nous par courriel.
            Nous répondons dans un délai de <strong className="text-gray-700 dark:text-gray-300">30 jours</strong>.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {RIGHTS.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex gap-3">
                  <Icon className="size-4 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">{r.label}</div>
                    <div className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">{r.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Sécurité */}
        <section className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-6 space-y-2">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="size-4 text-blue-600 dark:text-blue-400" />
            Mesures de sécurité
          </h2>
          <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed">
            Vos données sont protégées par le chiffrement TLS en transit, la sécurité au niveau des lignes (RLS) de PostgreSQL,
            une authentification sans mot de passe, et une séparation stricte des privilèges entre le code client et le code serveur.
            Aucun mot de passe n&apos;est jamais stocké.
          </p>
        </section>

        {/* Contact & modifications */}
        <section className="text-center space-y-3 pb-4">
          <div className="flex items-center justify-center gap-2 text-gray-300 dark:text-gray-700">
            <div className="h-px flex-1 bg-current" />
            <Mail className="size-4" />
            <div className="h-px flex-1 bg-current" />
          </div>
          <p className="text-[13px] text-gray-500 dark:text-gray-400">
            Pour toute question relative à la protection de vos données ou pour exercer vos droits :
          </p>
          <a href="mailto:mathieufournierqc@outlook.com" className="inline-flex items-center gap-2 text-[13px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            <Mail className="size-3.5" /> mathieufournierqc@outlook.com
          </a>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 pt-2">
            Cette politique peut être mise à jour. La date de dernière modification est indiquée en haut de page.
            L&apos;utilisation continue du service après modification vaut acceptation.
          </p>
        </section>

      </main>
    </div>
  );
}
