import { useApiQuery } from './useApiQuery'
import { queryDefaults } from '../config/queries'
import { getCajaActiva } from '../routes/admin/caja/api'
import { useAuthStore } from '../store/authStore'
import type { CajaTurno } from '../types'

export function useCajaActiva() {
  const sucursalId = useAuthStore((s) => s.sucursalId)

  const { data, isLoading, isError, mensajeError, refetch } = useApiQuery<CajaTurno | null>(
    ['caja-activa', sucursalId],
    getCajaActiva,
    queryDefaults('caja-activa'),
  )

  return {
    caja: data ?? null,
    isLoading,
    isError,
    mensajeError,
    refetch,
  }
}
