import { expect, test } from '@playwright/test'

test('la page de connexion expose le formulaire principal', async ({ page }) => {
  await page.goto('/login')

  await expect(page.getByRole('heading', { name: /Essence/i })).toBeVisible()
  await expect(page.getByPlaceholder(/courriel\.com/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /Envoyer le lien/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /Retour/i })).toHaveAttribute('href', '/')
})
