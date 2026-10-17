import { defineConfig } from 'vitest/config'

// Config propia (no extiende `vite.config.ts`): las pruebas de `src/lib` son de
// Node puro — no necesitan React ni el plugin de PWA — y así arrancan rápido.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
