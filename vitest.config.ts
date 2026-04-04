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
        // Composants UI complexes nécessitant des tests E2E (Leaflet, modals, panels)
        'src/components/Map.tsx',
        'src/components/MapClient.tsx',
        'src/components/ChangelogModal.tsx',
        'src/components/CityPricePanel.tsx',
        'src/components/CommentsModal.tsx',
        'src/components/FilterBar.tsx',
        'src/components/RadiusSlider.tsx',
        'src/components/RegionPricePanel.tsx',
        'src/components/ReportModal.tsx',
        'src/components/SiteThemeToggle.tsx',
        'src/components/SuggestionModal.tsx',
        'src/components/UserDropdown.tsx',
        'src/components/NavDropdown.tsx',
        'src/components/PricePanel.tsx',
        'src/components/types.ts',
        // Infrastructure Supabase / auth (pas de logique testable en isolation)
        'src/lib/auth.ts',
        'src/lib/supabase.ts',
        // Job de synchronisation avec dépendances externes (couvert par E2E)
        'src/lib/station-sync.ts',
        // Pages/composants UI simples sans logique métier
        'src/app/error.tsx',
        'src/app/not-found.tsx',
        'src/components/PageTracker.tsx',
        'src/hooks/**',
        // API admin : 500 lignes de requêtes complexes, couvert par tests E2E
        'src/app/api/admin/**',
        // Layouts Next.js
        'src/app/**/layout.tsx',
        'src/app/layout.tsx',
        // Pages RSC statiques sans logique métier (contenu JSX pur, couvert par E2E)
        'src/app/tech/**',
        'src/app/confidentialite/**',
        'src/app/faq/**',
        'src/app/a-propos/**',
        'src/app/admin/**',
        'src/app/global-error.tsx',
      ],
      thresholds: {
        statements: 77,
        branches: 65,
        functions: 80,
        lines: 80,
      },
    },
  },
})
