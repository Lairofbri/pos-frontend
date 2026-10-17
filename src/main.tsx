import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import './index.css'
import App from './App'

// Recuperación ante despliegues: si el navegador pide un chunk que el deploy
// nuevo ya no tiene (shell viejo servido por el service worker), Vite emite
// `vite:preloadError` en vez de propagar el fallo. Se recarga UNA vez para
// tomar la versión nueva; el guard evita bucles si el fallo es real (p. ej.
// sin red o con el asset roto de verdad).
const CLAVE_RELOAD = 'amber-chunk-reload'
const VENTANA_RELOAD_MS = 10_000

window.addEventListener('vite:preloadError', (evento: Event) => {
  const ultimo = Number(sessionStorage.getItem(CLAVE_RELOAD) ?? 0)
  if (Number.isFinite(ultimo) && Date.now() - ultimo < VENTANA_RELOAD_MS) return

  sessionStorage.setItem(CLAVE_RELOAD, String(Date.now()))
  evento.preventDefault()
  window.location.reload()
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="amber-theme">
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
