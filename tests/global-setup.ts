import { chromium } from '@playwright/test'
import { url } from './helpers/urls'

async function globalSetup() {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  await page.goto(url('/login'))
  await page.waitForLoadState('networkidle')

  await page.getByPlaceholder('admin@demo.pos').fill('admin@demo.pos')
  await page.locator('input[type="password"]').fill('Admin123!')
  await page.getByRole('button', { name: /ingresar/i }).click()

  await page.waitForURL('**/pos', { timeout: 15000 })
  await page.waitForLoadState('networkidle')

  await page.context().storageState({ path: 'tests/.auth/session.json' })
  await browser.close()
}

export default globalSetup
