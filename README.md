# Essence Québec

Carte interactive des prix de l'essence au Québec en temps réel.

Les données proviennent de la **Régie de l'énergie du Québec** et sont mises à jour quotidiennement.

**Production** : [essence-quebec.ca](https://essence-quebec.ca)

## Stack technique

| Couche | Technologies |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| Carte | Leaflet, react-leaflet, react-leaflet-cluster |
| Backend | API Routes Next.js, Supabase (PostgreSQL + Auth OTP) |
| Validation | Zod 4 |
| Monitoring | Sentry (erreurs + session replay) |
| Tests | Vitest (unitaires/intégration), Playwright (E2E) |
| CI/CD | GitHub Actions, Vercel |

## Installation

```bash
git clone https://github.com/Maaattqc/regie-essence-quebec.git
cd regie-essence-quebec
npm install
cp .env.example .env.local
# Remplir les valeurs dans .env.local
npm run dev
```

## Variables d'environnement requises

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role (serveur uniquement) |
| `ADMIN_EMAILS` | Emails admin séparés par virgule |
| `NEXT_PUBLIC_SENTRY_DSN` | DSN Sentry pour le monitoring |

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run lint` | ESLint |
| `npm run test:run` | Tests unitaires et intégration (Vitest) |
| `npm run test:coverage` | Tests avec rapport de couverture |
| `npm run test:e2e` | Tests E2E (Playwright) |
| `npm run test:all` | Tous les tests |

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API Routes (report, history, reviews, stations, cron, health)
│   ├── admin/              # Dashboard admin
│   ├── confidentialite/    # Politique de confidentialité (Loi 25)
│   ├── tech/               # Fiche technique
│   └── ...
├── components/             # Composants React
│   ├── Map.tsx             # Carte interactive principale
│   ├── CookieConsent.tsx   # Bannière de consentement Loi 25
│   └── ui/                 # Composants shadcn/ui
└── lib/                    # Modules partagés (auth, validation, utilitaires)
```

## Licence

Tous droits réservés.
