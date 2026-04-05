import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// Pages statiques testées pour conformité WCAG 2.1 AA (SGQRI 008)
const STATIC_PAGES = [
  { path: '/login', name: 'Connexion' },
  { path: '/faq', name: 'FAQ' },
  { path: '/a-propos', name: 'À propos' },
  { path: '/confidentialite', name: 'Confidentialité' },
  { path: '/accessibilite', name: 'Accessibilité' },
]

test.describe('Accessibilité WCAG 2.1 AA — pages statiques', () => {
  for (const { path, name } of STATIC_PAGES) {
    test(`${name} (${path}) — aucune violation critique`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('domcontentloaded')

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      // Afficher les violations pour faciliter le débogage
      if (results.violations.length > 0) {
        const summary = results.violations.map((v) =>
          `[${v.impact}] ${v.id}: ${v.description} — ${v.nodes.length} élément(s)`
        )
        console.error(`Violations WCAG sur ${path}:\n${summary.join('\n')}`)
      }

      expect(results.violations).toHaveLength(0)
    })
  }

  test('page accueil (/) — aucune violation critique (hors carte Leaflet)', async ({ page }) => {
    // Mocker les stations pour éviter les appels réseau réels
    await page.route('/api/stations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, data: { type: 'FeatureCollection', features: [] }, meta: {} }),
      })
    })

    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      // Exclure le conteneur Leaflet (canvas interactif — couvert par tests manuels SGQRI)
      .exclude('.leaflet-container')
      .analyze()

    if (results.violations.length > 0) {
      const summary = results.violations.map((v) =>
        `[${v.impact}] ${v.id}: ${v.description} — ${v.nodes.length} élément(s)`
      )
      console.error(`Violations WCAG sur /:\n${summary.join('\n')}`)
    }

    expect(results.violations).toHaveLength(0)
  })
})
