# Essence Québec

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000?logo=vercel)](https://vercel.com/)
[![CI](https://github.com/Maaattqc/regie-essence-quebec/actions/workflows/ci.yml/badge.svg)](https://github.com/Maaattqc/regie-essence-quebec/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Real-time interactive map of gas prices across Quebec, powered by official data from the **Régie de l'énergie du Québec**.

**Live** — [essence-quebec.ca](https://essence-quebec.ca)

---

## Overview

Essence Québec is a full-stack web application that displays up-to-date fuel prices for every gas station in the province of Quebec. The app fetches and synchronizes data from the Régie de l'énergie's public feed, geocodes stations, and renders them on an interactive Leaflet map with color-coded price markers, clustering, filtering, and geolocation support.

Built as a modern, production-grade project showcasing server-side data synchronization, real-time features, comprehensive testing (600+ tests, 93%+ coverage), and CI/CD automation.

## Features

- **Interactive map** — Leaflet-based map with color-coded price markers (green = cheap, red = expensive) and marker clustering for performance
- **Fuel type filtering** — Switch between Regular, Mid-grade, Premium, and Diesel
- **Geolocation** — Auto-center the map on the user's position with browser Geolocation API
- **Radius search** — Find the cheapest station within a configurable distance (km)
- **Price panels** — Average prices by region and by city, with expandable detail views
- **Price history chart** — SVG-rendered 30-day price trend per station
- **Directions** — Route display via Mapbox Directions API (server-proxied token)
- **Live cursors** — See other users browsing the map in real time (Supabase Realtime)
- **Authentication** — Passwordless OTP login via Supabase Auth
- **User reports** — Report price inaccuracies or suggest new stations
- **Reviews & comments** — Community station reviews with vote system
- **Admin dashboard** — Manage reports, suggestions, and station data
- **Dark mode** — System-aware theme toggle (next-themes)
- **Bilingual** — Full EN/FR internationalization
- **Accessibility** — Focus traps, ARIA labels, keyboard navigation, axe-core E2E audits
- **SEO** — Dynamic sitemap, robots.txt, structured semantic HTML
- **Security** — CSP, HSTS, X-Frame-Options, Zod validation on all inputs, distributed rate limiting

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, Framer Motion |
| Map | Leaflet, react-leaflet, react-leaflet-cluster, Mapbox Directions API |
| Backend | Next.js API Routes (serverless), Zod 4 schema validation |
| Database | Supabase (PostgreSQL + Auth OTP + Realtime channels) |
| Rate Limiting | Upstash Redis (distributed in prod, in-memory fallback in dev) |
| Monitoring | Sentry (error tracking), Vercel Analytics (traffic) |
| Testing | Vitest (600+ unit/integration tests, 93%+ coverage), Playwright (E2E — Chrome, Firefox, Safari), axe-core (accessibility) |
| CI/CD | GitHub Actions (lint → typecheck → test → build → auto-promote dev→main), Vercel (deploy) |

## Architecture

```
src/
├── app/                          # Next.js App Router
│   ├── api/
│   │   ├── stations/route.ts     # Station feed endpoint (stale-while-revalidate)
│   │   ├── cron/route.ts         # Scheduled data sync (Vercel Cron)
│   │   ├── cron/cleanup/route.ts # Periodic cleanup of old datasets
│   │   ├── history/route.ts      # 30-day price history
│   │   ├── report/route.ts       # User inaccuracy reports
│   │   ├── reviews/route.ts      # Community reviews & votes
│   │   ├── suggestion/route.ts   # Station suggestions
│   │   ├── mapbox/route.ts       # Server-side Mapbox proxy
│   │   ├── changelog/route.ts    # GitHub releases proxy
│   │   ├── admin/route.ts        # Admin operations
│   │   └── health/route.ts       # Health check
│   ├── admin/                    # Admin dashboard (protected)
│   ├── a-propos/                 # About page
│   ├── faq/                      # FAQ
│   ├── tech/                     # Technical overview page
│   ├── confidentialite/          # Privacy policy (Quebec Law 25)
│   ├── conditions-utilisation/   # Terms of use
│   ├── changelog/                # Public changelog
│   └── login/                    # Auth page
│
├── components/
│   ├── Map.tsx                   # Main map component (~550 lines)
│   ├── map/
│   │   ├── StationsLayer.tsx     # Price markers + clusters
│   │   ├── LiveCursors.tsx       # Real-time user cursors (Supabase Realtime)
│   │   ├── MapButtonsPanel.tsx   # Left-side control panel
│   │   ├── MapControls.tsx       # FlyTo, DevClick, DragController
│   │   └── popup-utils.ts       # Popup HTML generation, SVG icons
│   ├── FilterBar.tsx             # Search bar + fuel type / brand filters
│   ├── PricePanel.tsx            # Regional average prices
│   ├── CityPricePanel.tsx        # City-level price breakdown
│   ├── PriceChart.tsx            # SVG price history chart
│   ├── LoginModal.tsx            # OTP authentication modal
│   ├── ReportModal.tsx           # Inaccuracy report form
│   ├── CommentsModal.tsx         # Station reviews
│   └── ui/                      # shadcn/ui primitives
│
├── hooks/
│   ├── useStationsData.ts        # Fetch + sessionStorage cache
│   ├── useGeolocation.ts         # Geolocation + region detection
│   ├── useEffectivePrice.ts      # Price computation with multi-type logic
│   ├── useMapAuth.ts             # Auth state management
│   ├── useComments.ts            # Reviews data hook
│   └── useFocusTrap.ts           # Accessibility focus trap
│
├── lib/
│   ├── station-sync.ts           # Data sync engine (fetch → parse → geocode → upsert)
│   ├── stations.ts               # Types, constants, coordinate overrides
│   ├── schemas.ts                # Zod schemas (client + server)
│   ├── rateLimit.ts              # Upstash Redis / LRU fallback
│   ├── activity-log.ts           # Audit trail (Supabase)
│   ├── auth.ts                   # Browser Supabase client
│   ├── supabase.ts               # Server Supabase client (service role)
│   ├── i18n/                     # EN/FR translation files
│   └── utils.ts                  # cn() utility (clsx + tailwind-merge)
│
├── contexts/
│   └── LanguageContext.tsx        # i18n context provider
│
└── middleware.ts                  # Request middleware
```

**Data pipeline:** A Vercel Cron job triggers `/api/cron`, which calls `station-sync.ts` to fetch the Régie de l'énergie's GeoJSON feed, parse station properties & prices, apply coordinate overrides for mislocated stations, and batch-upsert everything into Supabase PostgreSQL. The `/api/stations` endpoint serves the latest dataset with `stale-while-revalidate` caching and triggers a background refresh when data is stale.

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com/) project (PostgreSQL + Auth)
- A [Mapbox](https://www.mapbox.com/) token (for directions)
- Optional: [Upstash Redis](https://upstash.com/) (for distributed rate limiting)

### Installation

```bash
git clone https://github.com/Maaattqc/regie-essence-quebec.git
cd regie-essence-quebec
npm install
cp .env.example .env.local
# Fill in the values — see .env.example for documentation
npm run dev
```

### Environment Variables

See [`.env.example`](./.env.example) for the full list. Key variables:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public (anon) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `MAPBOX_TOKEN` | Mapbox token (proxied server-side, never exposed to client) |
| `CRON_SECRET` | Shared secret for Vercel Cron authentication |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Upstash Redis credentials |

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run test:run` | Unit & integration tests (Vitest) |
| `npm run test:coverage` | Tests with coverage report |
| `npm run test:e2e` | E2E tests (Playwright — Chrome, Firefox, Safari) |
| `npm run test:all` | Run all tests |
| `npm run lint` | ESLint |

## License

[MIT](./LICENSE)

## Author

**Mathieu Fournier** · mathieufournierqc@outlook.com — [@Maaattqc](https://github.com/Maaattqc)

---

## Version française

### Aperçu

Essence Québec est une application web full-stack qui affiche en temps réel les prix du carburant pour toutes les stations-service de la province de Québec. L'application récupère et synchronise les données du flux public de la Régie de l'énergie, géocode les stations et les affiche sur une carte interactive Leaflet avec des marqueurs colorés selon le prix, du regroupement (clustering), des filtres et la géolocalisation.

### Fonctionnalités

- **Carte interactive** — Marqueurs colorés (vert = bas prix, rouge = élevé) avec regroupement pour la performance
- **Filtres par carburant** — Ordinaire, intermédiaire, super et diesel
- **Géolocalisation** — Centrage automatique sur la position de l'utilisateur
- **Recherche par rayon** — Trouver la station la moins chère dans un rayon configurable (km)
- **Panneaux de prix** — Moyennes par région et par ville
- **Historique des prix** — Graphique SVG sur 30 jours par station
- **Itinéraire** — Affichage du trajet via l'API Mapbox Directions
- **Curseurs en direct** — Voir les autres utilisateurs sur la carte en temps réel (Supabase Realtime)
- **Authentification** — Connexion sans mot de passe par OTP (Supabase Auth)
- **Signalements** — Signaler une inexactitude de prix ou suggérer une nouvelle station
- **Avis et commentaires** — Système de commentaires et de votes communautaires
- **Tableau de bord admin** — Gestion des signalements, suggestions et données
- **Mode sombre** — Basculement automatique selon le système
- **Bilingue** — Internationalisation complète EN/FR
- **Accessibilité** — Focus traps, attributs ARIA, navigation clavier, audits axe-core E2E
- **Sécurité** — CSP, HSTS, validation Zod, rate limiting distribué

### Installation

```bash
git clone https://github.com/Maaattqc/regie-essence-quebec.git
cd regie-essence-quebec
npm install
cp .env.example .env.local
# Remplir les valeurs — voir .env.example
npm run dev
```

### Licence

[MIT](./LICENSE)

### Auteur

**Mathieu Fournier** · mathieufournierqc@outlook.com — [@Maaattqc](https://github.com/Maaattqc)
