# Plan de sauvegarde et de reprise

## Sauvegarde automatique — Supabase (PostgreSQL)

Supabase assure la sauvegarde automatique de la base de données sans intervention manuelle.

| Plan | Type | Rétention | Fréquence |
|---|---|---|---|
| Free | Snapshots quotidiens | 7 jours | 1x/jour |
| Pro | Point-in-Time Recovery (PITR) | 7 jours | Continu (WAL) |
| Team/Enterprise | PITR | 28 jours | Continu (WAL) |

Le projet utilise le plan **Pro** — la restauration est possible à n'importe quelle seconde dans les 7 derniers jours.

### Accéder aux sauvegardes

1. Tableau de bord Supabase → projet `regie-essence-quebec`
2. **Database** → **Backups**
3. Choisir un point de restauration ou un snapshot

---

## RTO / RPO

| Métrique | Valeur | Description |
|---|---|---|
| **RPO** (Recovery Point Objective) | ~0s | PITR — aucune donnée perdue après le dernier WAL flush |
| **RTO** (Recovery Time Objective) | ~15-30 min | Temps de restauration Supabase selon le volume |

---

## Procédure de restauration

### Restauration PITR (Pro)

1. Aller dans Supabase Dashboard → **Database** → **Backups** → **Point in Time**
2. Sélectionner la date/heure cible
3. Cliquer **Restore** — Supabase crée un nouveau projet à partir du point choisi
4. Mettre à jour les variables d'environnement Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) avec les nouvelles valeurs
5. Vérifier via `/api/health` que la connexion est rétablie

### Restauration depuis un snapshot

1. Supabase Dashboard → **Database** → **Backups** → **Scheduled backups**
2. Sélectionner le snapshot souhaité → **Restore**
3. Même étapes 4-5 que ci-dessus

---

## Données hors base de données

| Donnée | Stockage | Sauvegarde |
|---|---|---|
| Code source | GitHub (`main`) | Git — historique complet |
| Variables d'environnement | Vercel Dashboard | Exporter manuellement si besoin |
| Configuration Vercel | `vercel.json` (Git) | Versionné |

---

## Test de restauration recommandé

Tester une restauration sur un projet Supabase de test **une fois par trimestre** pour valider le RTO réel.

```bash
# Vérifier la santé après restauration
curl https://essence-quebec.ca/api/health
```

---

## Contact

En cas d'incident nécessitant une restauration : **mathieufournierqc@outlook.com**
