import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getItemsActivos, marcarItemListo, marcarOrdenCompletada, getTicket } from './api'
import { CocinaCard } from './components/CocinaCard'
import { useCocinaSocket } from '../../hooks/useSocket'
import { useAuthStore } from '../../store/authStore'
import { PageSkeleton } from '../../components/shared/PageSkeleton'
import { EmptyState } from '../../components/shared/EmptyState'
import { ErrorState } from '../../components/shared/ErrorState'

export default function CocinaPage() {
  const tenantId = useAuthStore((s) => s.tenantId)
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['cocina'],
    queryFn: getItemsActivos,
    refetchInterval: 10_000,
  })

  useCocinaSocket(tenantId ?? '')

  const listoMutation = useMutation({
    mutationFn: marcarItemListo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cocina'] }),
  })

  const completadaMutation = useMutation({
    mutationFn: marcarOrdenCompletada,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cocina'] }),
  })

  if (isLoading) return <PageSkeleton />
  if (error) return <ErrorState message="Error al cargar cocina" onRetry={() => refetch()} />

  if (!data || data.length === 0) {
    return <EmptyState message="No hay órdenes activas" icon="🍳" />
  }

  const handlePrint = async (ordenId: string) => {
    try {
      const texto = await getTicket(ordenId)
      const win = window.open('', '_blank')
      win?.document.write(
        `<pre style="font-family: monospace; font-size: 12px">${texto}</pre>`
      )
      win?.print()
    } catch {
      // ignore print errors
    }
  }

  return (
    <div className="h-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
        {data.map((orden) => (
          <CocinaCard
            key={orden.orden_id}
            item={orden}
            onMarcarListo={(itemId) => listoMutation.mutate(itemId)}
            onCompletada={(ordenId) => completadaMutation.mutate(ordenId)}
            onImprimir={handlePrint}
          />
        ))}
      </div>
    </div>
  )
}
