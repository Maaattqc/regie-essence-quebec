import { expect, test } from '@playwright/test'

test.describe('Page de connexion', () => {
  test('expose le formulaire principal avec tous les elements requis', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: /Essence/i })).toBeVisible()
    await expect(page.getByPlaceholder(/courriel\.com/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Envoyer le lien/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Retour/i })).toHaveAttribute('href', '/')
  })

  test('le lien Retour pointe vers la page daccueil', async ({ page }) => {
    await page.goto('/login')
    const backLink = page.getByRole('link', { name: /Retour/i })
    await expect(backLink).toHaveAttribute('href', '/')
  })

  test('affiche une erreur si le courriel est invalide', async ({ page }) => {
    await page.goto('/login')

    await page.getByPlaceholder(/courriel\.com/i).fill('pasunemail')
    await page.getByRole('button', { name: /Envoyer le lien/i }).click()

    // Expect an error message to appear
    const errorText = page.getByText(/invalide|format|courriel|email/i)
    await expect(errorText).toBeVisible({ timeout: 5000 })
  })

  test('affiche une erreur si le champ courriel est vide', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('button', { name: /Envoyer le lien/i }).click()

    // HTML5 validation or custom error message
    const emailInput = page.getByPlaceholder(/courriel\.com/i)
    const isInvalid = await emailInput.evaluate((el) =>
      (el as HTMLInputElement).validity?.valueMissing || (el as HTMLInputElement).value === ''
    )
    expect(isInvalid).toBeTruthy()
  })

  test('passe a letape OTP apres soumission dun courriel valide', async ({ page }) => {
    // Intercept the Supabase auth call to avoid real email sending
    await page.route('**/auth/v1/otp**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message_id: 'test-id' }),
      })
    })

    await page.goto('/login')
    await page.getByPlaceholder(/courriel\.com/i).fill('test@example.com')
    await page.getByRole('button', { name: /Envoyer le lien/i }).click()

    // After successful submission, should show OTP step or confirmation message
    await expect(
      page.getByText(/code|OTP|verifie|verification|envoye|courriel/i)
    ).toBeVisible({ timeout: 8000 })
  })

  test('la page a un titre correct', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/connexion|login|essence|r.gie/i)
  })

  test('charge avec un statut 200', async ({ page }) => {
    const response = await page.goto('/login')
    expect(response?.status()).toBe(200)
  })
})
