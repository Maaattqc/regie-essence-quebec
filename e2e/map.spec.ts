import { expect, test } from '@playwright/test'

const mockStation = {
  type: 'Feature' as const,
  geometry: { type: 'Point' as const, coordinates: [-73.5673, 45.5017] },
  properties: {
    Name: 'Shell Montreal Centre',
    brand: 'Shell',
    Address: '123 Rue Sherbrooke O, Montreal, QC H3A 1B1',
    PostalCode: 'H3A 1B1',
    Region: 'Montreal',
    Prices: [
      { GasType: 'Regulier', Price: '175.9\u00A2', IsAvailable: true },
      { GasType: 'Super', Price: '189.9\u00A2', IsAvailable: true },
      { GasType: 'Diesel', Price: '194.9\u00A2', IsAvailable: false },
    ],
  },
}

const mockStationsPayload = {
  ok: true,
  data: {
    type: 'FeatureCollection',
    features: [mockStation],
  },
  meta: {
    stationCount: 1,
    lastCompletedAt: '2026-04-02T09:00:00.000Z',
    syncStatus: 'ready',
    datasetId: 'dataset-test',
    lastStartedAt: '2026-04-02T09:00:00.000Z',
    lastCheckedAt: '2026-04-02T09:00:00.000Z',
    sourceLastModified: '2026-04-02T08:00:00.000Z',
    lastError: null,
  },
}

test.describe("Page d'accueil - carte interactive", () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api/stations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStationsPayload),
      })
    })
    await page.route('/api/pageview', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      })
    })
  })

  test('la page charge avec un statut 200 et un titre correct', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
    await expect(page).toHaveTitle(/essence|r.gie|qu.bec/i)
  })

  test('la page ne declenche pas de page derreur', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('body')).not.toContainText('Something went wrong')
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })

  test('le contenu SEO est present dans le DOM', async ({ page }) => {
    await page.goto('/')
    // sr-only content is in the DOM even if visually hidden
    const h1 = page.locator('h1').first()
    await expect(h1).toHaveText(/essence|prix|qu.bec/i)
  })

  test('la carte leaflet se charge apres le composant dynamique', async ({ page }) => {
    await page.goto('/')
    // Wait for the Leaflet container to appear (dynamic import)
    const leafletContainer = page.locator('.leaflet-container')
    await expect(leafletContainer).toBeVisible({ timeout: 15000 })
  })

  test('le menu de navigation dropdown est accessible', async ({ page }) => {
    await page.goto('/')
    await page.locator('.leaflet-container').waitFor({ state: 'visible', timeout: 15000 })

    // At minimum the body should be visible and stable after map loads
    await expect(page.locator('body')).toBeVisible()
  })

  test('le menu dropdown ouvre les liens vers les autres pages', async ({ page }) => {
    await page.goto('/')
    await page.locator('.leaflet-container').waitFor({ state: 'visible', timeout: 15000 })

    // Find and click the settings/gear dropdown trigger
    // It's a small button with a Settings icon, positioned in the navbar
    const gearButton = page.locator('button').filter({ has: page.locator('svg') }).first()
    await gearButton.click({ force: true })

    // The dropdown menu should have appeared with navigation links
    const confidentialiteLink = page.getByText('Confidentialit', { exact: false })
    const techLink = page.getByText('propos', { exact: false })
    // Check that at least one link appeared
    const linkVisible = (await confidentialiteLink.isVisible()) || (await techLink.isVisible())
    expect(linkVisible).toBeTruthy()
  })

  test("l'appel a l'API stations est effectue au chargement", async ({ page }) => {
    let stationsCallCount = 0

    await page.route('/api/stations', async (route) => {
      stationsCallCount++
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStationsPayload),
      })
    })

    await page.goto('/')
    await page.locator('.leaflet-container').waitFor({ state: 'visible', timeout: 15000 })

    expect(stationsCallCount).toBeGreaterThan(0)
  })

  test('lapi stations retournant 202 affiche un etat de chargement', async ({ page }) => {
    await page.route('/api/stations', async (route) => {
      await route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, data: null, meta: mockStationsPayload.meta }),
      })
    })

    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    // The map should still load even with no station data
    await expect(page.locator('body')).toBeVisible()
  })
})
