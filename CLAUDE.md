@AGENTS.md

## Convention de commits
- Tous les messages de commit doivent être en **français**

## Règles UI
- **Jamais** de `window.confirm()`, `window.alert()` ou `window.prompt()` — utiliser des confirmations inline stylées (Tailwind/shadcn) cohérentes avec le design du site
- **Jamais d'emojis Unicode** dans le code UI — utiliser exclusivement les icônes de `lucide-react` (déjà installé dans le projet)
- **Jamais de `<Skeleton>` ou autre `<div>` à l'intérieur d'un `<p>`** — HTML invalide qui cause une erreur d'hydratation Next.js. Utiliser `<div>` au lieu de `<p>` quand le contenu peut contenir un composant block-level
- **Jamais de séquences Unicode `\u00XX`** dans le code — toujours écrire les vrais caractères UTF-8 (é, è, ê, ¢, É, etc.)

## Variables d'environnement
- Après `vercel env add` via pipe (`echo "$val" | vercel env add`), les valeurs peuvent contenir des `\n` parasites. **Toujours nettoyer** `.env.local` après un `vercel env pull` :
  ```bash
  node -e 'const fs=require("fs");let c=fs.readFileSync(".env.local","utf8");c=c.split(String.raw`\n`).join("");fs.writeFileSync(".env.local",c)'
  ```
- Les variables Supabase, Mapbox, Sentry, etc. doivent exister dans l'environnement **development** de Vercel (pas seulement production) pour que `vercel env pull` les inclue dans `.env.local`

## Outils CLI disponibles
- **Supabase CLI** (`npx supabase`) — projet lié : `dpjmmnkhlhwluytfaclz` (`regie-essence-quebec`). Utiliser `npx supabase db query --linked "SQL"` pour exécuter des migrations.
- **Vercel CLI** — projet déployé sur Vercel
- **GitHub** — repo connecté, utiliser `gh` pour les PRs/issues

## Stack technique

### Frontend
| Technologie | Version | Rôle |
|---|---|---|
| Next.js | 16.2.2 | Framework React (App Router) |
| React | 19.2.4 | Librairie UI |
| TypeScript | 5 | Typage statique |
| Tailwind CSS | 4 | Styling utilitaire |
| shadcn/ui | 4.1.2 | Composants UI (Base UI + CVA) |
| lucide-react | 1.7.0 | Icônes SVG |
| framer-motion | 12.38.0 | Animations et transitions |
| next-themes | 0.4.6 | Gestion dark/light mode |

### Carte interactive
| Technologie | Rôle |
|---|---|
| Leaflet 1.9.4 | Librairie de cartes |
| react-leaflet 5 | Bindings React pour Leaflet |
| react-leaflet-cluster | Clustering de marqueurs |
| Mapbox Directions API | Distances routières réelles + trafic temps réel |
| Mapbox Matrix API | Calcul distances multi-destinations en un appel |

### Backend / BDD
| Technologie | Rôle |
|---|---|
| Supabase (supabase-js) | PostgreSQL hébergé, Auth OTP par email, Realtime |
| API Routes Next.js | Endpoints serveur (serverless) |
| Upstash Redis | Rate limiting distribué (via Vercel Marketplace) |
| zod 4.3.6 | Validation de données (client + serveur) |

### Tests & Qualité
| Technologie | Rôle |
|---|---|
| Vitest 4.1.2 | 196 tests unitaires/intégration (28 fichiers, 90%+ couverture) |
| Playwright | Tests E2E multi-navigateurs (Chrome, Firefox, Safari) |
| @testing-library/react | Tests de composants React |
| @testing-library/jest-dom | Matchers DOM pour Vitest |
| ESLint + eslint-config-next | Linting |
| GitHub Actions | CI/CD (lint, types, tests, build sur chaque push/PR) |

### Monitoring & Analytics
| Technologie | Rôle |
|---|---|
| Sentry | Crash reporting (client + serveur), source maps, tunnel anti-adblock |
| Vercel Analytics | Page views, géo, top pages |

### Utilitaires (installés par shadcn)
| Technologie | Rôle |
|---|---|
| class-variance-authority | Variantes de composants |
| clsx + tailwind-merge | Fusion de classes CSS |
| tw-animate-css | Animations CSS |
| @base-ui/react | Primitives UI accessibles |

## Architecture du projet

```
src/
├── __tests__/                    # 196 tests (28 fichiers)
│
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Layout racine (fonts, ThemeProvider, Analytics, skip link)
│   ├── page.tsx                  # Page d'accueil (charge Map en dynamique)
│   ├── error.tsx                 # Error boundary (Sentry)
│   ├── globals.css               # Styles globaux + variables CSS dark/light
│   │
│   ├── admin/                    # Dashboard admin
│   ├── login/                    # Page de connexion (OTP)
│   ├── changelog/                # Changelog (commits Git)
│   ├── faq/                      # FAQ
│   ├── a-propos/                 # À propos
│   ├── tech/                     # Fiche technique
│   ├── confidentialite/          # Politique de confidentialité (Loi 25)
│   │
│   ├── auth/callback/route.ts    # Callback OAuth/OTP Supabase
│   │
│   └── api/                      # API Routes (serverless)
│       ├── stations/route.ts     # GET stations GeoJSON
│       ├── report/route.ts       # POST signalement
│       ├── reviews/route.ts      # GET/POST commentaires + votes
│       ├── history/route.ts      # GET historique prix
│       ├── admin/route.ts        # GET/PATCH admin (stats, users, signalements)
│       ├── cron/route.ts         # GET sync prix (Vercel Cron)
│       ├── changelog/route.ts    # GET commits GitHub
│       ├── suggestion/route.ts   # POST suggestion
│       ├── mapbox/route.ts       # POST proxy Mapbox (token serveur)
│       ├── auth/log/route.ts     # POST log connexion/déconnexion
│       └── health/route.ts       # GET liveness probe
│
├── components/
│   ├── Map.tsx                   # Composant principal carte (~550 lignes)
│   ├── map/                      # Sous-composants carte
│   │   ├── StationsLayer.tsx     # Marqueurs prix + clusters
│   │   ├── MapButtonsPanel.tsx   # Panneau boutons gauche (meilleur prix, style, etc.)
│   │   ├── LiveCursors.tsx       # Curseurs temps réel (Supabase Realtime)
│   │   ├── MapControls.tsx       # FlyTo, DevClickHandler, DragController
│   │   ├── popup-utils.ts        # HTML popups, SVG icons inline
│   │   └── leaflet-patches.ts    # Patches Chrome/React-Leaflet
│   │
│   ├── FilterBar.tsx             # Barre de recherche et filtres
│   ├── PricePanel.tsx            # Prix moyens par région/ville
│   ├── PriceChart.tsx            # Graphique SVG historique prix (30 jours)
│   ├── LoginModal.tsx            # Modal connexion OTP
│   ├── ReportModal.tsx           # Modal signalement
│   ├── SuggestionModal.tsx       # Modal suggestion
│   ├── CommentsModal.tsx         # Modal commentaires/avis
│   ├── ChangelogModal.tsx        # Modal changelog
│   └── ui/                       # Composants shadcn/ui (générés)
│
├── hooks/
│   ├── useStationsData.ts        # Fetch stations + cache sessionStorage
│   ├── useGeolocation.ts         # Géolocalisation + détection région/ville
│   ├── useMapAuth.ts             # Auth state + log connexion
│   └── useFocusTrap.ts           # Focus trap pour modals (accessibilité)
│
└── lib/
    ├── stations.ts               # Types, constantes, fonctions utilitaires stations
    ├── schemas.ts                # Schémas Zod partagés (client + serveur)
    ├── rateLimit.ts              # Rate limiting (Upstash Redis prod / mémoire dev)
    ├── activity-log.ts           # Journal d'activité (Supabase)
    ├── auth.ts                   # Client Supabase navigateur
    ├── supabase.ts               # Client Supabase serveur
    ├── station-sync.ts           # Synchronisation stations (REQ → Supabase)
    └── utils.ts                  # Utilitaire cn() (clsx + tailwind-merge)
```

## Source de données
- **Régie de l'énergie du Québec** : prix des stations-service via `https://regieessencequebec.ca/stations.geojson.gz`
- Données cachées en `sessionStorage` côté client
- Snapshots historiques sauvegardés dans Supabase (table `price_snapshots`)

## Scripts disponibles
| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run lint` | ESLint |
| `npm test` | Vitest en mode watch |
| `npm run test:run` | Vitest une seule exécution |
