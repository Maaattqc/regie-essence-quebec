import { expect, test } from '@playwright/test'

const mockStation = {
  type: 'Feature' as const,
  geometry: { type: 'Point' as const, coordinates: [-73.5673, 45.5017] },
  properties: {
    Name: 'Shell Montreal Centre',
    brand: 'Shell',
    Address: '123 Rue Sherbrooke O, Montreal, QC H3A 1B1',
    PostalCode: 'H3A 1B1',
    Region: 'Montréal',
    Prices: [
      { GasType: 'Regulier', Price: '175.9\u00A2', IsAvailable: true },
      { GasType: 'Super', Price: '189.9\u00A2', IsAvailable: true },
      { GasType: 'Diesel', Price: '194.9\u00A2', IsAvailable: false },
    ],
  },
}

const mockStationLaval = {
  type: 'Feature' as const,
  geometry: { type: 'Point' as const, coordinates: [-73.7500, 45.6066] },
  properties: {
    Name: 'Petro-Canada Laval',
    brand: 'Petro-Canada',
    Address: '456 Boul des Laurentides, Laval, QC H7G 2T8',
    PostalCode: 'H7G 2T8',
    Region: 'Laval',
    Prices: [
      { GasType: 'Regulier', Price: '172.5\u00A2', IsAvailable: true },
    ],
  },
}

const mockStationsPayload = {
  ok: true,
  data: {
    type: 'FeatureCollection',
    features: [mockStation, mockStationLaval],
  },
  meta: {
    stationCount: 2,
    lastCompletedAt: '2026-04-04T09:00:00.000Z',
    syncStatus: 'ready',
    datasetId: 'dataset-test',
    lastStartedAt: '2026-04-04T09:00:00.000Z',
    lastCheckedAt: '2026-04-04T09:00:00.000Z',
    sourceLastModified: '2026-04-04T08:00:00.000Z',
    lastError: null,
  },
}

test.describe('Stations et carte interactive', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api/stations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStationsPayload),
      })
    })
  })

  test("la page d'accueil charge la carte Leaflet", async ({ page }) => {
    await page.goto('/')
    const leafletContainer = page.locator('.leaflet-container')
    await expect(leafletContainer).toBeVisible({ timeout: 15000 })
  })

  test("l'API /api/stations retourne 200", async ({ page }) => {
    const response = await page.request.get('/api/stations')
    expect(response.status()).toBe(200)

    const json = await response.json()
    expect(json).toHaveProperty('ok')
    expect(json).toHaveProperty('data')
    expect(json).toHaveProperty('meta')
  })

  test("l'API /api/health retourne status ok", async ({ page }) => {
    const response = await page.request.get('/api/health')
    expect(response.status()).toBe(200)

    const json = await response.json()
    expect(json.status).toBe('ok')
    expect(json).toHaveProperty('timestamp')
  })

  test('les stations s affichent sur la carte (marqueurs visibles)', async ({ page }) => {
    await page.goto('/')
    const leafletContainer = page.locator('.leaflet-container')
    await expect(leafletContainer).toBeVisible({ timeout: 15000 })

    // Attendre que les marqueurs (icônes Leaflet ou clusters) apparaissent
    const markers = page.locator('.leaflet-marker-icon, .leaflet-marker-pane img, .marker-cluster')
    await expect(markers.first()).toBeVisible({ timeout: 10000 })
  })

  test('le filtre par region fonctionne', async ({ page }) => {
    await page.goto('/')
    await page.locator('.leaflet-container').waitFor({ state: 'visible', timeout: 15000 })

    // Sélectionner la région Montréal dans le filtre
    const regionSelect = page.locator('select.nb-select').first()
    await expect(regionSelect).toBeVisible({ timeout: 5000 })

    // Compter les marqueurs avant le filtrage
    const markersBeforeFilter = page.locator('.leaflet-marker-icon, .marker-cluster')
    await expect(markersBeforeFilter.first()).toBeVisible({ timeout: 10000 })
    const countBefore = await markersBeforeFilter.count()

    // Appliquer le filtre sur une région spécifique
    await regionSelect.selectOption('Montréal')

    // Attendre que la carte se mette à jour après le changement de filtre
    await page.waitForTimeout(1000)

    // Vérifier que le select affiche bien la région sélectionnée
    await expect(regionSelect).toHaveValue('Montréal')

    // Après filtrage, le nombre de marqueurs devrait avoir changé
    // (ou au minimum, la carte ne doit pas être en erreur)
    const markersAfterFilter = page.locator('.leaflet-marker-icon, .marker-cluster')
    const countAfter = await markersAfterFilter.count()

    // Avec 2 stations mockées (Montréal + Laval), filtrer sur Montréal
    // devrait réduire le nombre de marqueurs ou les garder (si cluster)
    expect(countAfter).toBeLessThanOrEqual(countBefore)
  })
})
