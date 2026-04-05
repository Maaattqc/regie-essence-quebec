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

---

## Procédure de notification de brèche (Loi 25)

En cas de brèche de confidentialité affectant des renseignements personnels, la procédure suivante s'applique conformément à la **Loi sur la protection des renseignements personnels dans le secteur privé (Loi 25)** du Québec.

### Critères déclencheurs

Une notification est obligatoire si la brèche présente un **risque de préjudice sérieux** pour les personnes concernées (usurpation d'identité, atteinte à la réputation, préjudice financier, etc.).

### Délais (Loi 25, art. 3.5)

| Action | Délai |
|---|---|
| Évaluation du risque de préjudice sérieux | Dès la découverte |
| Notification à la **Commission d'accès à l'information (CAI)** | Sans délai raisonnable |
| Notification aux **personnes concernées** | Sans délai raisonnable (si risque sérieux) |
| Consignation dans le **registre des brèches** | Immédiatement |

### Contacts obligatoires

- **Commission d'accès à l'information du Québec (CAI)**
  - Site : [cai.gouv.qc.ca](https://www.cai.gouv.qc.ca/)
  - Formulaire de déclaration : [Déclarer une incident de confidentialité](https://www.cai.gouv.qc.ca/organisations/incidents-confidentialite/)
  - Téléphone : 1-888-528-7741

- **Personnes concernées**
  - Via l'adresse courriel associée au compte (si connue)
  - Avis public sur le site si les personnes ne peuvent être jointes individuellement

### Responsable du traitement

**Mathieu Fournier** — mathieufournierqc@outlook.com

### Informations à inclure dans la notification

1. Date et nature de la brèche
2. Renseignements personnels impliqués (type, volume)
3. Personnes ou catégories de personnes concernées
4. Mesures prises pour réduire le risque
5. Coordonnées du responsable du traitement
6. Droits des personnes concernées (accès, rectification)

### Registre des brèches

Toute brèche, même sans risque sérieux, doit être consignée dans un registre interne (date, nature, mesures correctives). Ce registre est conservé 5 ans.
