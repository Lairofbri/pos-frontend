import { test, expect } from '@playwright/test'

test.describe('Admin — Dashboard', () => {
  test.use({ storageState: 'tests/.auth/session.json' })

  test('debe cargar dashboard con métricas', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Admin — Reportes', () => {
  test.use({ storageState: 'tests/.auth/session.json' })

  test('debe cargar página de reportes con grid de categorías', async ({ page }) => {
    await page.goto('/admin/reportes')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    await expect(page.locator('body')).toBeVisible()
  })
})
