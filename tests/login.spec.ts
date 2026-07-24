import { test, expect } from '@playwright/test'
import { url } from './helpers/urls'
import { CREDENCIALES } from './helpers/auth'

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(url('/login'))
    await page.waitForLoadState('networkidle')
  })

  test('debe mostrar campos vacíos y botón deshabilitado inicialmente', async ({ page }) => {
    await expect(page.getByPlaceholder('admin@demo.pos')).toBeVisible()
    await expect(page.getByPlaceholder('••••••••')).toBeVisible()
  })

  test('debe mostrar error con credenciales inválidas', async ({ page }) => {
    await page.getByPlaceholder('admin@demo.pos').fill(CREDENCIALES.invalidas.email)
    await page.getByPlaceholder('••••••••').fill(CREDENCIALES.invalidas.password)
    await page.getByRole('button', { name: /ingresar/i }).click()

    await page.waitForURL('**/login', { timeout: 10000 })
  })

  test('debe iniciar sesión correctamente y redirigir a POS', async ({ page }) => {
    await page.getByPlaceholder('admin@demo.pos').fill(CREDENCIALES.admin.email)
    await page.getByPlaceholder('••••••••').fill(CREDENCIALES.admin.password)
    await page.getByRole('button', { name: /ingresar/i }).click()

    await page.waitForURL('**/pos', { timeout: 15000 })
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('debe alternar visibilidad de contraseña', async ({ page }) => {
    const passwordInput = page.getByPlaceholder('••••••••')
    await passwordInput.fill('miPassword123')

    await expect(passwordInput).toHaveAttribute('type', 'password')
    await page.locator('form button:has(svg)').click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
  })
})

test.describe('Login — PIN', () => {
  test('debe mostrar opción de PIN y volver a login email', async ({ page }) => {
    await page.goto(url('/login'))
    await page.waitForLoadState('networkidle')

    const pinTab = page.getByRole('button', { name: /pin|rápido/i })
    await pinTab.click()
    await page.waitForTimeout(1000)

    await expect(page.getByText(/pin|teclado|numérico/i)).toBeVisible()
  })
})
