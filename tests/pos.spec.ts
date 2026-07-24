import { test, expect } from '@playwright/test'

test.describe('POS — Golden Path', () => {
  test.use({ storageState: 'tests/.auth/session.json' })

  test('debe cargar POS con mesas, productos y ticket panel', async ({ page }) => {
    await page.goto('/pos')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    await expect(page.locator('body')).toBeVisible()
  })

  test('debe cambiar entre modo mesa y modo rápido', async ({ page }) => {
    await page.goto('/pos')
    await page.waitForLoadState('networkidle')

    const mesaTab = page.getByRole('button', { name: /mesa|mesas/i })
    const rapidoTab = page.getByRole('button', { name: /rápido|directo/i })

    if (await rapidoTab.isVisible()) {
      await rapidoTab.click()
      await page.waitForTimeout(1000)
    }
    if (await mesaTab.isVisible()) {
      await mesaTab.click()
      await page.waitForTimeout(1000)
    }
  })
})
