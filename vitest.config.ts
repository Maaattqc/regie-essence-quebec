import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        // Fichiers de test
        'src/**/*.test.{ts,tsx}',
        // Composants shadcn générés (pas de logique métier)
        'src/components/ui/**',
        // Leaflet : rendu canvas impossible en jsdom (couvert par E2E)
        'src/components/Map.tsx',
        'src/components/MapClient.tsx',
        'src/components/map/**',
        // Types purs (aucune logique exécutable)
        'src/components/types.ts',
        // Clients Supabase (instanciation uniquement, ~10 lignes)
        'src/lib/auth.ts',
        'src/lib/supabase.ts',
        // Layouts Next.js (providers/metadata, pas de logique)
        'src/app/**/layout.tsx',
        'src/app/layout.tsx',
        // Error boundaries Next.js (UI minimale)
        'src/app/error.tsx',
        'src/app/not-found.tsx',
        'src/app/global-error.tsx',
        // Composant analytics (side-effect Vercel)
        'src/components/PageTracker.tsx',
        // Dashboard admin : 1700+ lignes de UI complexe derrière auth (couvert par E2E)
        'src/app/admin/page.tsx',
      ],
      thresholds: {
        statements: 93,
        branches: 79,
        functions: 96,
        lines: 94,
      },
    },
  },
})
