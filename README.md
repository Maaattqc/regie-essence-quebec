# Essence Québec

Carte interactive des prix de l'essence au Québec en temps réel.

Les données proviennent de la **Régie de l'énergie du Québec** et sont mises à jour quotidiennement.

**Production** : [essence-quebec.ca](https://essence-quebec.ca)

## Stack technique

| Couche | Technologies |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, Framer Motion |
| Carte | Leaflet, react-leaflet, react-leaflet-cluster, Mapbox Directions API |
| Backend | API Routes Next.js (Serverless), Zod 4 (validation) |
| Base de données | Supabase (PostgreSQL + Auth OTP + Realtime) |
| Rate limiting | Upstash Redis (distribué en prod, mémoire en dev) |
| Monitoring | Sentry (erreurs), Vercel Analytics (trafic) |
| Tests | Vitest (196 tests, 90%+ couverture), Playwright (E2E multi-navigateurs) |
| CI/CD | GitHub Actions (lint, types, tests, build), Vercel (deploy) |
| Sécurité | CSP, HSTS, X-Frame-Options, rate limiting, validation Zod, Auth OTP |

## Installation

```bash
git clone https://github.com/Maaattqc/regie-essence-quebec.git
cd regie-essence-quebec
npm install
cp .env.example .env.local
# Remplir les valeurs dans .env.local
npm run dev
```

## Variables d'environnement

Voir `.env.example` pour la liste complète. Les variables critiques :

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role (serveur uniquement) |
| `ADMIN_EMAILS` | Emails admin séparés par virgule |
| `CRON_SECRET` | Secret partagé avec Vercel Cron |
| `MAPBOX_TOKEN` | Token Mapbox (proxy serveur) |
| `KV_REST_API_URL` | URL Upstash Redis (auto-injecté via Vercel Marketplace) |
| `KV_REST_API_TOKEN` | Token Upstash Redis |

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run lint` | ESLint |
| `npm run test:run` | Tests unitaires et intégration (Vitest) |
| `npm run test:coverage` | Tests avec rapport de couverture |
| `npm run test:e2e` | Tests E2E (Playwright — Chrome, Firefox, Safari) |
| `npm run test:all` | Tous les tests |

## Architecture

```
src/
├── app/                        # Next.js App Router
│   ├── api/                    # API Routes (stations, report, reviews, cron, admin, etc.)
│   ├── admin/                  # Dashboard admin
│   ├── tech/                   # Fiche technique
│   ├── faq/                    # FAQ
│   ├── a-propos/               # À propos
│   ├── confidentialite/        # Politique de confidentialité (Loi 25)
│   ├── changelog/              # Historique des changements
│   ├── error.tsx               # Error boundary (Sentry)
│   └── layout.tsx              # Layout racine (fonts, ThemeProvider, Analytics)
│
├── components/
│   ├── Map.tsx                 # Composant principal carte (~550 lignes)
│   ├── map/                    # Sous-composants carte
│   │   ├── StationsLayer.tsx   # Marqueurs prix + clusters
│   │   ├── MapButtonsPanel.tsx # Panneau boutons gauche
│   │   ├── LiveCursors.tsx     # Curseurs temps réel (Supabase Realtime)
│   │   ├── MapControls.tsx     # FlyTo, DevClick, DragController
│   │   ├── popup-utils.ts      # HTML popups, SVG icons
│   │   └── leaflet-patches.ts  # Patches Chrome/React-Leaflet
│   ├── FilterBar.tsx           # Barre de recherche et filtres
│   ├── PricePanel.tsx          # Prix moyens par région/ville
│   ├── PriceChart.tsx          # Graphique historique prix (SVG)
│   ├── LoginModal.tsx          # Connexion OTP
│   ├── ReportModal.tsx         # Signalement inexactitude
│   ├── SuggestionModal.tsx     # Suggestion
│   ├── CommentsModal.tsx       # Commentaires/avis
│   ├── ChangelogModal.tsx      # Changelog
│   └── ui/                     # Composants shadcn/ui
│
├── hooks/
│   ├── useStationsData.ts      # Fetch stations + cache sessionStorage
│   ├── useGeolocation.ts       # Géolocalisation + détection région
│   ├── useMapAuth.ts           # Auth state + log
│   └── useFocusTrap.ts         # Focus trap pour modals (accessibilité)
│
└── lib/
    ├── stations.ts             # Types, constantes, utilitaires stations
    ├── schemas.ts              # Schémas Zod (client + serveur)
    ├── rateLimit.ts            # Rate limiting (Upstash Redis / fallback mémoire)
    ├── activity-log.ts         # Journal d'activité (Supabase)
    ├── auth.ts                 # Client Supabase navigateur
    ├── supabase.ts             # Client Supabase serveur
    └── utils.ts                # Utilitaire cn() (clsx + tailwind-merge)
```

## Licence

Tous droits réservés.
