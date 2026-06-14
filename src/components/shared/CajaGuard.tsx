import { type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCajaActiva } from '../../routes/admin/caja/api'
import { Spinner } from '../ui/Spinner'
import { queryDefaults } from '../../config/queries'

interface CajaGuardProps {
  children: ReactNode
}

export function CajaGuard({ children }: CajaGuardProps) {
  const { data: cajaActiva, isLoading } = useQuery({
    queryKey: ['caja-activa'],
    queryFn: getCajaActiva,
    ...queryDefaults('caja-activa'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!cajaActiva || cajaActiva.estado !== 'abierta') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <span className="text-6xl">💰</span>
        <h2 className="font-display text-xl text-text-primary">Caja Cerrada</h2>
        <p className="text-text-secondary text-sm font-body text-center max-w-sm">
          No hay una caja abierta. Ve a <strong className="text-accent">Administración &gt; Caja</strong> para abrir un turno antes de operar.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
