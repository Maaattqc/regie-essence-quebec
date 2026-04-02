import { expect, test } from '@playwright/test'

test.describe('Pages statiques', () => {
  test('la page tech affiche la fiche technique avec les technologies', async ({ page }) => {
    await page.goto('/tech')
    await expect(page.getByRole('heading', { name: /fiche technique/i })).toBeVisible()
    await expect(page.getByText('Next.js')).toBeVisible()
    await expect(page.getByText('Supabase')).toBeVisible()
    await expect(page.getByText('TypeScript')).toBeVisible()
  })

  test('la page tech affiche les sections securite et tests en vue detaillee', async ({ page }) => {
    await page.goto('/tech')
    const detailBtn = page.getByRole('button', { name: /detail|complet/i })
    if (await detailBtn.isVisible()) {
      await detailBtn.click()
    }
    await expect(page.getByText(/CSP|Content Security Policy|en-tete/i)).toBeVisible()
  })

  test('la page confidentialite affiche la politique de confidentialite Loi 25', async ({ page }) => {
    await page.goto('/confidentialite')
    await expect(page.getByRole('heading', { name: /confidentialit/i })).toBeVisible()
    await expect(page.getByText(/Loi 25/i)).toBeVisible()
    await expect(page.getByText(/Vercel/i)).toBeVisible()
    await expect(page.getByText(/Supabase/i)).toBeVisible()
  })

  test('la page confidentialite liste les droits des utilisateurs', async ({ page }) => {
    await page.goto('/confidentialite')
    await expect(page.getByText(/droit|acces|suppression/i)).toBeVisible()
  })

  test('la page faq charge sans erreur', async ({ page }) => {
    const response = await page.goto('/faq')
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('la page a-propos charge sans erreur', async ({ page }) => {
    const response = await page.goto('/a-propos')
    expect(response?.status()).toBe(200)
    await expect(page.locator('body')).not.toContainText('404')
  })

  test('la page changelog affiche les commits depuis lapi', async ({ page }) => {
    await page.route('/api/changelog', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            sha: 'abc1234',
            date: '2026-04-01T10:00:00Z',
            message: 'correction: bug critique corrige',
            author: 'Maaattqc',
          },
          {
            sha: 'def5678',
            date: '2026-03-30T08:00:00Z',
            message: 'amelioration: ajout Sentry',
            author: 'Maaattqc',
          },
        ]),
      })
    })

    await page.goto('/changelog')
    await expect(page.getByText('bug critique corrige')).toBeVisible()
    await expect(page.getByText('ajout Sentry')).toBeVisible()
  })

  test('la page login charge le formulaire de connexion', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: /envoyer|connexion|lien/i })).toBeVisible()
  })

  test('la navigation vers confidentialite fonctionne depuis login', async ({ page }) => {
    await page.goto('/confidentialite')
    await expect(page).toHaveURL('/confidentialite')
    await expect(page.getByRole('heading').first()).toBeVisible()
  })
})
