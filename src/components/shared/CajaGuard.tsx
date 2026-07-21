import { type ReactNode } from 'react'
import { useCajaActiva } from '../../hooks/useCajaActiva'
import { InlineError } from './InlineError'
import { Spinner } from '../ui/Spinner'

interface CajaGuardProps {
  children: ReactNode
}

export function CajaGuard({ children }: CajaGuardProps) {
  const { caja, isLoading, isError, mensajeError, refetch } = useCajaActiva()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 px-4">
        <InlineError message={mensajeError ?? 'Error al verificar caja'} onRetry={() => refetch()} />
        <p className="text-xs text-text-secondary font-body text-center max-w-sm mt-2">
          Si el problema persiste, abre un turno desde <strong className="text-pos-accent cursor-pointer" onClick={() => window.location.href = '/admin/caja'}>Administración &gt; Caja</strong>
        </p>
      </div>
    )
  }

  if (!caja || caja.estado !== 'abierta') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <span className="text-6xl">💰</span>
        <h2 className="font-display text-xl text-text-primary">Caja Cerrada</h2>
        <p className="text-text-secondary text-sm font-body text-center max-w-sm">
          No hay una caja abierta. Ve a <strong className="text-pos-accent">Administración &gt; Caja</strong> para abrir un turno antes de operar.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
