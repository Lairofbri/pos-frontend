import type { Page } from '@playwright/test'
import { url } from './urls'

export const CREDENCIALES = {
  admin: { email: 'admin@demo.pos', password: 'Admin123!' },
  invalidas: { email: 'admin@demo.pos', password: 'wrong-password' },
}

export async function loginComoAdmin(page: Page) {
  await page.goto(url('/login'))
  await page.waitForLoadState('networkidle')

  await page.getByPlaceholder('admin@demo.pos').fill(CREDENCIALES.admin.email)
  await page.getByPlaceholder('••••••••').fill(CREDENCIALES.admin.password)
  await page.getByRole('button', { name: /ingresar/i }).click()

  await page.waitForURL('**/pos', { timeout: 15000 })
  await page.waitForLoadState('networkidle')
}
