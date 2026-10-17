import { useRouteError } from 'react-router-dom'
import { TriangleAlert } from 'lucide-react'
import { Button } from '../ui/Button'

/**
 * Pantalla de error de las rutas (reemplaza la `errorElement` por defecto de
 * React Router, que mostraba «Unexpected Application Error!» + texto para
 * desarrolladores).
 *
 * El caso más común en producción es un **despliegue nuevo**: el navegador pide
 * un chunk que ya no existe («Failed to fetch dynamically imported module») y
 * `vite:preloadError` de `main.tsx` recarga solo. Si algo llega hasta acá, la
 * salida segura es recargar.
 */
const esChunkViejo = (mensaje: string) =>
  /dynamically imported module|importing a module script failed|error loading dynamically imported|load failed/i.test(
    mensaje,
  )

export function RouteError() {
  const error = useRouteError() as { message?: string; statusText?: string } | undefined
  const mensaje = error?.message || error?.statusText || 'Ocurrió un error inesperado.'

  return (
    <div className="flex flex-col items-center justify-center min-h-svh px-6 text-center">
      <TriangleAlert className="size-14 text-danger mb-4" />
      <h1 className="font-display text-xl text-text-primary mb-2">Algo salió mal</h1>
      <p className="text-sm text-text-secondary font-body mb-6 max-w-md">
        {esChunkViejo(mensaje)
          ? 'La aplicación se actualizó mientras la usabas. Recargá la página para seguir trabajando.'
          : mensaje}
      </p>
      <Button onClick={() => window.location.reload()}>Recargar</Button>
    </div>
  )
}
