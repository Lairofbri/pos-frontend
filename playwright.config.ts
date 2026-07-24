import { defineConfig, devices } from '@playwright/test'

const PORT = process.env.CI ? 4173 : 5173
const BASE = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  globalSetup: './tests/global-setup.ts',
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: BASE,
    screenshot: 'only-on-failure',
    video: 'on',
    trace: 'on-first-retry',
    storageState: 'tests/.auth/session.json',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: process.env.CI ? 'pnpm run preview' : 'pnpm run dev',
    url: BASE,
    reuseExistingServer: true,
    timeout: 120000,
  },
})
