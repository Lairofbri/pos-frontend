import { test, expect } from '@playwright/test'

test.describe('Cocina', () => {
  test.use({ storageState: 'tests/.auth/session.json' })

  test('debe cargar vista de cocina', async ({ page }) => {
    await page.goto('/cocina')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    await expect(page.locator('body')).toBeVisible()
  })
})
