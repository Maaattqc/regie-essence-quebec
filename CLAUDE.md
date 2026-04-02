@AGENTS.md

## Convention de commits
- Tous les messages de commit doivent être en **français**

## Règles UI
- **Jamais** de `window.confirm()`, `window.alert()` ou `window.prompt()` — utiliser des confirmations inline stylées (Tailwind/shadcn) cohérentes avec le design du site
- **Jamais d'emojis Unicode** dans le code UI — utiliser exclusivement les icônes de `lucide-react` (déjà installé dans le projet)
- **Jamais de `<Skeleton>` ou autre `<div>` à l'intérieur d'un `<p>`** — HTML invalide qui cause une erreur d'hydratation Next.js. Utiliser `<div>` au lieu de `<p>` quand le contenu peut contenir un composant block-level
- **Jamais de séquences Unicode `\u00XX`** dans le code — toujours écrire les vrais caractères UTF-8 (é, è, ê, ¢, É, etc.)

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

### Backend / BDD
| Technologie | Rôle |
|---|---|
| Supabase (supabase-js) | PostgreSQL hébergé, Auth OTP par email |
| API Routes Next.js | Endpoints serveur |
| zod 4.3.6 | Validation de données (client + serveur) |

### Tests & Qualité
| Technologie | Rôle |
|---|---|
| Vitest 4.1.2 | Tests unitaires |
| @testing-library/react | Tests de composants React |
| @testing-library/jest-dom | Matchers DOM pour Vitest |
| ESLint + eslint-config-next | Linting |

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
├── __tests__/                    # Tests unitaires
│   ├── stations.test.ts          # Tests des fonctions utilitaires (19 tests)
│   └── report-schema.test.ts     # Tests du schéma zod de signalement (8 tests)
│
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Layout racine (fonts, ThemeProvider)
│   ├── page.tsx                  # Page d'accueil (charge Map en dynamique)
│   ├── globals.css               # Styles globaux + variables CSS dark/light
│   │
│   ├── admin/
│   │   └── page.tsx              # Dashboard admin (stats, cron, users, signalements)
│   ├── login/
│   │   └── page.tsx              # Page de connexion standalone (OTP)
│   ├── changelog/
│   │   └── page.tsx              # Page changelog (commits Git)
│   │
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts          # Callback OAuth/OTP Supabase
│   │
│   └── api/                      # API Routes (serverless)
│       ├── report/route.ts       # POST signalement (validation zod + rate limit)
│       ├── history/route.ts      # GET historique prix d'une station
│       ├── changelog/route.ts    # GET commits Git via GitHub API
│       ├── cron/route.ts         # GET déclenche un snapshot des prix
│       └── reviews/route.ts      # GET/POST avis sur les stations
│
├── components/
│   ├── Map.tsx                   # Composant principal (~1500 lignes)
│   │                             #   - FilterBar (recherche, filtres, type essence)
│   │                             #   - StationsLayer (marqueurs prix sur carte)
│   │                             #   - RegionPricePanel (prix moyens par région)
│   │                             #   - LoginModal, ReportModal, ChangelogModal
│   │                             #   - RadiusSlider, SiteThemeToggle
│   │                             #   - Recherche meilleur prix dans un rayon
│   │
│   ├── PriceChart.tsx            # Graphique SVG d'historique des prix (30 jours)
│   │
│   └── ui/                       # Composants shadcn/ui (générés)
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── slider.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       └── textarea.tsx
│
└── lib/                          # Modules partagés
    ├── stations.ts               # Types, constantes, fonctions utilitaires stations
    ├── schemas.ts                # Schémas zod partagés (client + serveur)
    ├── auth.ts                   # Client Supabase navigateur
    ├── supabase.ts               # Client Supabase serveur
    ├── rateLimit.ts              # Rate limiting pour les API routes
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
