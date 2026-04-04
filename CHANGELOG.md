# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le versioning [SemVer](https://semver.org/lang/fr/).

## [1.1.0] - 2026-04-04

### Ajouté
- Rate limiting distribué via Upstash Redis (Vercel Marketplace)
- Error boundary (`error.tsx`) avec capture Sentry
- Accessibilité : skip link, focus trap modals, `role=dialog`, `aria-modal`, popups ARIA
- Pipeline CI/CD GitHub Actions (lint, types, tests, build)
- Vercel Analytics
- Tests : 171 → 196 (28 fichiers), couverture 90%+
- Playwright multi-navigateurs (Chrome, Firefox, Safari)
- `.env.example`, `LICENSE` MIT, `SECURITY.md`, `CONTRIBUTING.md`
- Validation enum status dans admin PATCH (report + suggestion)
- Guard `CRON_SECRET` absent → 500 explicite

### Modifié
- Map.tsx refactoré : 1229 → 550 lignes (6 sous-composants + 4 hooks)
- Catch silencieux remplacés par `console.error` + `logActivity("erreur")`
- Headers sécurité ajoutés : `X-XSS-Protection`, `X-DNS-Prefetch-Control`
- Page tech mise à jour (Upstash, 196 tests, multi-navigateurs)
- README et CLAUDE.md mis à jour avec nouvelle architecture

### Corrigé
- Accents manquants dans les messages d'erreur API (`Trop de requêtes`)
- Filtrage des pages invalides dans le trafic admin

## [1.0.0] - 2026-04-01

### Ajouté
- Carte interactive 2 500+ stations-service (Leaflet + React-Leaflet)
- Prix en temps réel depuis la Régie de l'énergie du Québec
- Recherche par ville, région, marque
- Meilleur prix effectif avec distances routières Mapbox (trafic temps réel)
- Historique des prix sur 30 jours (graphique SVG)
- Système de commentaires avec votes (likes/dislikes) et réponses imbriquées
- Signalement de prix inexacts
- Suggestions utilisateurs
- Authentification OTP sans mot de passe (Supabase)
- Curseurs en temps réel (Supabase Realtime)
- Stations favorites (persistance locale)
- Dashboard admin (stats, users, signalements, suggestions, trafic, logs)
- Mode sombre/clair
- 3 styles de carte (OpenStreetMap, Satellite, Dark)
- Pages statiques : FAQ, À propos, Tech, Confidentialité (Loi 25), Changelog
- SEO : JSON-LD, Open Graph, sitemap, robots.txt
- Sentry crash reporting (client + serveur, tunnel anti-adblock)
- Vercel Cron Jobs (sync automatique des prix)
- Emails transactionnels via Resend (SPF/DKIM/DMARC)
- security.txt (RFC 9116)
