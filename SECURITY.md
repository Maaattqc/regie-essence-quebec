# Politique de sécurité

## Signaler une vulnérabilité

Si vous découvrez une vulnérabilité de sécurité dans ce projet, veuillez la signaler de manière responsable.

**Ne publiez pas** la vulnérabilité dans un issue public.

### Contact

- **Email** : mathieufournierqc@outlook.com
- **Objet** : `[SECURITY] Essence Québec — description courte`
- **Fichier** : [/.well-known/security.txt](https://essence-quebec.ca/.well-known/security.txt)

### Informations à inclure

- Description de la vulnérabilité
- Étapes de reproduction
- Impact potentiel
- Suggestion de correctif (si applicable)

### Délai de réponse

- **Accusé de réception** : 48 heures
- **Évaluation initiale** : 7 jours
- **Correctif déployé** : 30 jours (selon la gravité)

### Périmètre

| Dans le périmètre | Hors périmètre |
|---|---|
| essence-quebec.ca | Services tiers (Supabase, Vercel, Sentry) |
| API Routes (/api/*) | Attaques par déni de service (DoS) |
| Authentification OTP | Ingénierie sociale |
| Données utilisateurs | Vulnérabilités dans les dépendances non corrigées en amont |

### Reconnaissance

Les chercheurs en sécurité qui signalent des vulnérabilités valides de manière responsable seront remerciés publiquement (avec leur accord) dans le changelog du projet.
