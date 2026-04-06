# Déclaration d'accessibilité — Essence Québec

**Type** : Déclaration volontaire (auto-évaluation)
**Norme visée** : SGQRI 008 — WCAG 2.1 niveau AA
**Date** : 2026-04-05
**Responsable** : Mathieu Fournier — mathieufournierqc@outlook.com
**URL du site** : https://regie-essence-quebec.vercel.app

---

## 1. Statut de conformité

**Partiellement conforme** — Le site vise la conformité WCAG 2.1 AA. Les tests automatisés (axe-core) ne détectent aucune violation sur les pages testées. Une validation manuelle complète (lecteur d'écran, navigation clavier exhaustive) n'a pas encore été réalisée par un auditeur indépendant.

---

## 2. Périmètre évalué

### Pages testées (audit automatisé axe-core)

| Page | URL | Résultat axe-core |
|------|-----|-------------------|
| Accueil (carte) | `/` | 0 violation |
| Connexion | `/login` | 0 violation |
| FAQ | `/faq` | 0 violation |
| À propos / Fiche technique | `/a-propos`, `/tech` | 0 violation |
| Politique de confidentialité | `/confidentialite` | 0 violation |
| Déclaration d'accessibilité | `/accessibilite` | 0 violation |

### Composants évalués

- Modaux (signalement, commentaires, suggestion, connexion) — focus trap, ARIA, Échap
- Barre de filtres et recherche — labels, rôles ARIA
- Carte Leaflet — exclue des tests automatisés (canvas interactif)
- Navigation principale — skip link, keyboard focus

---

## 3. Méthodologie

### Tests automatisés
- **Outil** : `@axe-core/playwright` v4.x
- **Balises WCAG testées** : `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`
- **Navigateurs** : Chromium, Firefox, WebKit (via Playwright)
- **Fréquence** : À chaque déploiement (CI/CD GitHub Actions)
- **Résultat** : 0 violation sur 6 pages testées

### Tests manuels réalisés
- Navigation clavier (Tab, Shift+Tab, Entrée, Échap) sur les flux principaux
- Vérification des focus traps dans les modaux
- Vérification des attributs `aria-label`, `aria-modal`, `role="dialog"`
- Vérification du lien d'évitement « Passer au contenu principal »
- Vérification du contraste couleurs (design system shadcn/ui + Tailwind)

### Tests non réalisés
- Audit avec lecteur d'écran (NVDA, JAWS, VoiceOver) par un utilisateur réel
- Test avec des utilisateurs en situation de handicap
- Évaluation exhaustive des 50 critères WCAG 2.1 AA (audit ATTEST officiel)

---

## 4. Fonctionnalités d'accessibilité implémentées

| Fonctionnalité | Implémentation |
|---------------|----------------|
| Lien d'évitement | `<a href="#main-content">Passer au contenu principal</a>` dans le layout |
| Navigation clavier | Focus visible sur tous les éléments interactifs |
| Focus trap modaux | Hook `useFocusTrap` sur tous les modaux (LoginModal, ReportModal, etc.) |
| Attributs ARIA | `role="dialog"`, `aria-modal`, `aria-label`, `aria-labelledby` sur les modaux |
| Gestion Échap | Fermeture des modaux via touche Échap |
| Mode sombre/clair | Contraste adapté en dark mode via CSS variables |
| Composants accessibles | shadcn/ui basé sur Base UI (primitives accessibles ARIA) |
| Texte alternatif | Icônes décoratives masquées avec `aria-hidden` |
| Structure sémantique | `<h1>`, `<h2>`, `<nav>`, `<main>`, `<header>`, `<footer>` présents |
| Langue déclarée | `lang="fr"` sur `<html>` (défaut), changeable via toggle FR/EN |

---

## 5. Limitations connues

### Carte Leaflet (limitation technique)
La carte interactive utilise un canvas HTML — les marqueurs de stations ne sont pas accessibles au clavier ni aux lecteurs d'écran. C'est une limitation connue de la librairie Leaflet 1.9.

**Mesures compensatoires** :
- Le panneau de prix par région et ville offre une alternative textuelle aux données cartographiques
- La fonction de recherche de la station la moins chère est accessible sans la carte
- Les prix peuvent être consultés sans interaction avec la carte

### Contenu dynamique temps réel
Les curseurs en temps réel (Live Cursors) et les mises à jour de prix via WebSocket ne sont pas annoncés aux lecteurs d'écran (pas de `aria-live` sur ces éléments).

---

## 6. Résultats WCAG 2.1 AA (critères principaux)

| Critère | Libellé | Statut |
|---------|---------|--------|
| 1.1.1 | Contenu non textuel | ✅ Conforme |
| 1.3.1 | Information et relations | ✅ Conforme |
| 1.3.2 | Ordre séquentiel logique | ✅ Conforme |
| 1.4.1 | Utilisation de la couleur | ✅ Conforme |
| 1.4.3 | Contraste (minimum) | ✅ Conforme |
| 1.4.4 | Redimensionnement du texte | ✅ Conforme |
| 2.1.1 | Clavier | ✅ Conforme (hors carte Leaflet) |
| 2.1.2 | Pas de piège clavier | ✅ Conforme |
| 2.4.1 | Contournement de blocs | ✅ Conforme (skip link) |
| 2.4.2 | Titre de page | ✅ Conforme |
| 2.4.3 | Parcours du focus | ✅ Conforme |
| 2.4.7 | Visibilité du focus | ✅ Conforme |
| 3.1.1 | Langue de la page | ✅ Conforme (`lang="fr"`) |
| 3.2.1 | Au focus | ✅ Conforme |
| 3.3.1 | Identification des erreurs | ✅ Conforme |
| 3.3.2 | Étiquettes ou instructions | ✅ Conforme |
| 4.1.1 | Analyse syntaxique | ✅ Conforme |
| 4.1.2 | Nom, rôle, valeur | ✅ Conforme |
| 2.5.3 | Étiquette dans le nom | ⚠️ Non évalué manuellement |
| 1.4.11 | Contraste des composants | ⚠️ Non évalué manuellement |
| 2.1.x | Navigation clavier carte | ❌ Non conforme (Leaflet) |

---

## 7. Technologies utilisées

- HTML5 sémantique
- CSS (Tailwind CSS 4, CSS variables)
- JavaScript / TypeScript (React 19, Next.js 16)
- shadcn/ui + Base UI (composants accessibles)
- Framer Motion (animations — respecte `prefers-reduced-motion`)

---

## 8. Signalement d'une barrière d'accessibilité

Si vous rencontrez un problème d'accessibilité sur ce site :

**Courriel** : mathieufournierqc@outlook.com
**Objet suggéré** : `[Accessibilité] Description du problème`

Nous nous engageons à répondre dans un délai de 5 jours ouvrables et à corriger les barrières identifiées dans les meilleurs délais.

---

## 9. Mise à jour

Ce document est mis à jour à chaque changement majeur de l'interface ou lors de la découverte d'une nouvelle barrière d'accessibilité.

| Version | Date | Changement |
|---------|------|-----------|
| 1.0 | 2026-04-05 | Création initiale — audit axe-core 0 violation sur 6 pages |
