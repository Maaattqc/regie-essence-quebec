import { expect, test } from '@playwright/test'

// Station mockée réutilisée dans tous les scénarios
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
    ],
  },
}

const mockStationsPayload = {
  ok: true,
  data: { type: 'FeatureCollection', features: [mockStation] },
  meta: {
    stationCount: 1,
    lastCompletedAt: '2026-04-05T09:00:00.000Z',
    syncStatus: 'ready',
    datasetId: 'dataset-test',
    lastStartedAt: '2026-04-05T09:00:00.000Z',
    lastCheckedAt: '2026-04-05T09:00:00.000Z',
    sourceLastModified: '2026-04-05T08:00:00.000Z',
    lastError: null,
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Flux 1 : Carte → Popup → Modal signalement → Soumission → Confirmation
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Flux signalement — carte vers confirmation', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api/stations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStationsPayload),
      })
    })
    await page.route('/api/report', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      })
    })
  })

  test('carte → marqueur → popup → bouton Signaler ouvre le modal', async ({ page }) => {
    await page.goto('/')
    await page.locator('.leaflet-container').waitFor({ state: 'visible', timeout: 15000 })

    // Attendre que les marqueurs soient rendus
    const marker = page.locator('.leaflet-marker-icon, .leaflet-marker-pane img').first()
    await expect(marker).toBeVisible({ timeout: 10000 })
    await marker.click()

    // Le popup Leaflet doit apparaître avec le bouton Signaler
    const reportBtn = page.getByRole('button', { name: /signaler/i })
    await expect(reportBtn).toBeVisible({ timeout: 5000 })
  })

  test('modal signalement → remplir → soumettre → confirmation', async ({ page }) => {
    await page.goto('/')
    await page.locator('.leaflet-container').waitFor({ state: 'visible', timeout: 15000 })

    // Ouvrir le popup en cliquant sur le marqueur
    const marker = page.locator('.leaflet-marker-icon, .leaflet-marker-pane img').first()
    await expect(marker).toBeVisible({ timeout: 10000 })
    await marker.click()

    // Cliquer sur "Signaler" dans le popup
    await page.getByRole('button', { name: /signaler/i }).click()

    // Le modal doit être ouvert (role=dialog)
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // Remplir le formulaire — les placeholders sont en FR ou EN selon le navigateur
    await page.getByPlaceholder(/prénom|first name/i).fill('Jean')
    await page.getByPlaceholder(/nom|last name/i).fill('Tremblay')
    await page.getByPlaceholder(/courriel|email/i).fill('jean@example.com')
    await page.locator('textarea').fill('Le prix affiché ne correspond pas au prix réel à la pompe.')

    // Soumettre le formulaire
    await page.getByRole('button', { name: /envoyer|send/i }).click()

    // Vérifier le message de confirmation
    await expect(page.getByText(/merci|thank you/i)).toBeVisible({ timeout: 5000 })
  })

  test('modal signalement — erreur serveur affiche un message derreur', async ({ page }) => {
    // Surcharger le mock pour simuler une erreur 500
    await page.route('/api/report', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Erreur serveur' }),
      })
    })

    await page.goto('/')
    await page.locator('.leaflet-container').waitFor({ state: 'visible', timeout: 15000 })

    const marker = page.locator('.leaflet-marker-icon, .leaflet-marker-pane img').first()
    await expect(marker).toBeVisible({ timeout: 10000 })
    await marker.click()

    await page.getByRole('button', { name: /signaler/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })

    await page.getByPlaceholder(/prénom|first name/i).fill('Jean')
    await page.getByPlaceholder(/nom|last name/i).fill('Tremblay')
    await page.getByPlaceholder(/courriel|email/i).fill('jean@example.com')
    await page.locator('textarea').fill('Message de test pour vérifier la gestion derreur serveur.')

    await page.getByRole('button', { name: /envoyer|send/i }).click()

    // Un message d'erreur doit apparaître (pas de confirmation)
    await expect(page.getByText(/erreur|error/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/merci|thank you/i)).not.toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Flux 2 : Dashboard admin — chargement + action de modération
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Flux admin — tableau de bord et modération', () => {
  const mockInitResponse = {
    stats: {
      totalSnapshots: 260000,
      lastSnapshot: '2026-04-05T09:00:00Z',
      totalReports: 3,
      totalUsers: 12,
      avgRegulier: 172.4,
      avgSuper: 192.1,
      avgDiesel: 188.5,
      totalPageViews: 5000,
      todayPageViews: 120,
      weekPageViews: 800,
      monthPageViews: 3200,
    },
    users: [
      { id: 'u1', email: 'j***@e***.com', role: 'user', created_at: '2026-01-01' },
    ],
    reports: [
      {
        id: 1,
        station_name: 'Shell Test',
        address: '123 Rue Test',
        first_name: 'J***',
        last_name: 'T*******',
        email: 'j***@e***.com',
        message: 'Prix incorrect',
        status: 'pending',
        created_at: '2026-04-05T08:00:00Z',
      },
    ],
    suggestions: [],
  }

  test.beforeEach(async ({ page }) => {
    await page.route('/api/stations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStationsPayload),
      })
    })
    await page.route('/api/admin*', async (route) => {
      const url = new URL(route.request().url())
      if (url.searchParams.get('type') === 'init') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockInitResponse),
        })
      } else if (url.searchParams.get('type') === 'me') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ isAdmin: false }),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        })
      }
    })
  })

  test('le tableau de bord admin charge sans erreur (non authentifié)', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('body')).not.toContainText('Something went wrong')
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
    await expect(page.locator('body')).not.toContainText('404')
  })

  test('les statistiques du dashboard sont affichées', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle', { timeout: 10000 })

    // Le dashboard doit afficher au moins un compteur de snapshot ou stats
    await expect(page.getByText(/260\s*000|260000|snapshots/i)).toBeVisible({ timeout: 8000 })
  })

  test('PATCH sans token admin retourne 403', async ({ page }) => {
    const response = await page.request.patch('/api/admin', {
      data: { action: 'report_status', id: 1, status: 'resolved' },
      headers: { 'Content-Type': 'application/json' },
    })

    expect(response.status()).toBe(403)
    const json = await response.json()
    expect(json.error).toMatch(/autorisé|unauthorized/i)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Flux 3 : API directe — validation et rate limiting
// ─────────────────────────────────────────────────────────────────────────────
test.describe('API /api/report — validation des champs', () => {
  test('retourne 400 si le courriel est invalide', async ({ page }) => {
    const response = await page.request.post('/api/report', {
      data: {
        station_name: 'Shell Test',
        address: '123 Rue Test',
        first_name: 'Jean',
        last_name: 'Tremblay',
        email: 'pas-un-courriel',
        message: 'Message de test suffisamment long.',
      },
      headers: { 'Content-Type': 'application/json' },
    })

    expect(response.status()).toBe(400)
    const json = await response.json()
    expect(typeof json.error).toBe('string')
  })

  test('retourne 400 si le message est trop court', async ({ page }) => {
    const response = await page.request.post('/api/report', {
      data: {
        station_name: 'Shell Test',
        address: '123 Rue Test',
        first_name: 'Jean',
        last_name: 'Tremblay',
        email: 'jean@example.com',
        message: 'Court',
      },
      headers: { 'Content-Type': 'application/json' },
    })

    expect(response.status()).toBe(400)
  })
})
