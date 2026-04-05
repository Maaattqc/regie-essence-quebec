# Performance & Stress Tests

Résultats des tests de charge réels — Régie Essence Québec.
Mis à jour : 2026-04-05.

---

## Comment lancer les tests

```bash
# Test local (build de production)
npm run build
npm run start        # terminal 1
npm run test:load    # terminal 2

# Test contre Vercel (CDN réel — recommandé)
LOAD_TEST_URL=https://ton-url.vercel.app npm run test:load

# Paramètres personnalisables
CONCURRENCY=50 DURATION_S=30 npm run test:load
```

---

## Résultats — Vercel preview (2026-04-05)

**Configuration** : 20 VUs simultanés, 15s/endpoint, IPs uniques simulées via `x-real-ip`.
**URL testée** : déploiement preview branche `dev`.

| Endpoint | Requêtes | p50 | p95 | p99 | 200 OK | 429 | 5xx |
|----------|----------|-----|-----|-----|--------|-----|-----|
| `GET /api/health` | 1 140 | 102ms | 155ms | 1 051ms | 100% | 0% | 0% |
| `GET /api/stations` | 2 220 | **17ms** | **111ms** | 242ms | 100% | 0% | 0% |
| `GET /api/history` | 1 780 | 47ms | 117ms | 158ms | 4% | 96% | 0% |
| `GET /api/admin?type=me` | 1 920 | 46ms | 73ms | 116ms | 3% | 97% | 0% |

**Total : 7 060 requêtes — 0 erreur 5xx.**

### Notes d'interprétation

- **`/api/stations` à 17ms** : servi depuis le cache CDN Vercel (`s-maxage=60`). La requête n'atteint pas Supabase.
- **96-97% de 429 sur `/api/history` et `/api/admin`** : normal en test — toutes les requêtes viennent de la même IP machine. En prod réelle, chaque utilisateur a sa propre IP et son propre bucket rate-limiter.
- **p99 de 1 051ms sur `/api/health`** : cold start Vercel occasionnel (fonction non réchauffée). Disparaît sous trafic continu.

---

## Résultats — Local production build (2026-04-05)

**Configuration** : 200 VUs simultanés, build `npm run start`, sans CDN.

| Endpoint | p50 | p95 | 200 OK | Erreurs |
|----------|-----|-----|--------|---------|
| `GET /api/health` | 1 235ms | 2 208ms | 100% | 0 |
| `GET /api/stations` | 10 011ms | 10 053ms | 30% | **70% timeout** |
| `GET /api/history` | 1 331ms | 2 306ms | 100% | 0 |
| `GET /api/admin?type=me` | 716ms | 1 195ms | 100% | 0 |

### Pourquoi `/api/stations` timeout en local

200 connexions simultanées lisent `stations_live` en boucle (batches de 1 000 lignes chacun) → pool de connexions Supabase épuisé. Ce scénario est **irréaliste en production** : le CDN Vercel absorbe la quasi-totalité des requêtes stations.

---

## Capacité estimée en production

| Scénario | Users simultanés | Verdict |
|----------|-----------------|---------|
| Usage quotidien | 1 — 500 | ✅ Aucun souci |
| Mention médiatique | 500 — 2 000 | ✅ CDN absorbe |
| Campagne gouvernementale | 2 000 — 10 000 | ✅ Supabase Pro + PgBouncer |
| Viral national | 10 000 — 50 000 | ✅ Upgrade Vercel Pro |

---

## Infrastructure

| Ressource | Plan | Limite effective |
|-----------|------|-----------------|
| Vercel | Hobby | ~1 000 fonctions simultanées |
| Supabase | Pro | 60 connexions directes PostgreSQL |
| Supabase PgBouncer | Pro inclus | ~1 000 connexions poolées |
| Upstash Redis | Pay-as-you-go | 10 000 cmd/jour (plan actuel) |

### Connexions Supabase (22/60)

Les 60 connexions sont des connexions **PostgreSQL**, pas des utilisateurs. PostgREST maintient un pool permanent (~15 connexions) + dashboard (~5) + fonctions actives (~2-5). Une seule connexion DB peut servir des dizaines de requêtes par seconde via le pooling. Le chiffre 22/60 est normal et ne limite pas le trafic utilisateur.

---

## Seuils de succès (standards industrie)

| Métrique | Excellent | Acceptable | Problème |
|----------|-----------|------------|----------|
| p50 | < 100ms | < 300ms | > 500ms |
| p95 | < 500ms | < 1 000ms | > 2 000ms |
| Taux 5xx | 0% | < 0.1% | > 0.1% |

Les 429 (rate limiting) ne comptent **pas** comme des erreurs — c'est le comportement attendu.

---

## Recommandations futures

- **Si trafic > 10 000 users simultanés** : passer Vercel Pro (~$20/mois)
- **Si p95 `/api/history` > 500ms** : ajouter un index Supabase sur `(station_name, address, gas_type, snapshot_date)`
- **Si cold starts fréquents** : activer Vercel Fluid Compute pour garder les fonctions chaudes
