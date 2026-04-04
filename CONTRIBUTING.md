# Contribuer à Essence Québec

Merci de votre intérêt pour le projet ! Voici les étapes pour contribuer.

## Prérequis

- Node.js 24+
- npm 10+
- Compte Supabase (pour les variables d'environnement)

## Installation

```bash
git clone https://github.com/Maaattqc/regie-essence-quebec.git
cd regie-essence-quebec
npm install
cp .env.example .env.local
# Remplir les valeurs dans .env.local
npm run dev
```

## Workflow de développement

1. Créer une branche depuis `main` : `git checkout -b feat/ma-feature`
2. Coder les changements
3. Vérifier : `npm run lint && npx tsc --noEmit && npm run test:run`
4. Commit en français (convention du projet)
5. Push et ouvrir une Pull Request vers `main`

## Convention de commits

Les messages de commit doivent être en **français** et suivre le format :

```
type: description courte

- feat: nouvelle fonctionnalité
- fix: correction de bug
- docs: documentation
- refactor: refactoring sans changement fonctionnel
- test: ajout ou modification de tests
- build: dépendances, CI/CD
```

## Pipeline CI

Chaque push/PR déclenche automatiquement :
1. **ESLint** — 0 warning toléré
2. **TypeScript** — vérification des types
3. **Vitest** — 196 tests unitaires/intégration
4. **Build production** — vérifie que le build Next.js passe

## Tests

```bash
npm run test:run        # Tests unitaires/intégration
npm run test:coverage   # Avec rapport de couverture (seuil : 90%+)
npm run test:e2e        # Tests E2E Playwright (Chrome, Firefox, Safari)
```

## Structure du code

Voir `CLAUDE.md` pour l'architecture complète du projet.

## Signaler un bug

Ouvrir un [issue GitHub](https://github.com/Maaattqc/regie-essence-quebec/issues) avec :
- Description du problème
- Étapes de reproduction
- Comportement attendu vs observé
- Screenshots si applicable

## Sécurité

Pour signaler une vulnérabilité, voir `SECURITY.md`.
