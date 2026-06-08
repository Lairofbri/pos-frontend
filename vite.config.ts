import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import Pages from 'vite-plugin-pages'

export default defineConfig({
  plugins: [react(), tailwindcss(), Pages()],
})
