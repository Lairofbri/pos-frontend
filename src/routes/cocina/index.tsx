import { useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryDefaults } from '../../config/queries'
import { getItemsActivos, getTicket, marcarItemListo, marcarOrdenCompletada } from './api'
import { CocinaCard } from './components/CocinaCard'
import { KanbanBoard } from '../../components/shared/KanbanBoard'
import { Spinner } from '../../components/ui/Spinner'
import { useCocinaSocket } from '../../hooks/useSocket'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import type { CocinaItem } from './api'

type ColumnaId = 'pendientes' | 'preparacion' | 'listos'

const columnasConfig: { id: ColumnaId; title: string }[] = [
  { id: 'pendientes', title: 'Nuevas' },
  { id: 'preparacion', title: 'En Preparación' },
  { id: 'listos', title: 'Listas' },
]

export default function CocinaPage() {
  const queryClient = useQueryClient()
  const showToast = useToastStore((s) => s.show)
  const tenantId = useAuthStore((s) => s.tenantId)

  useCocinaSocket(tenantId ?? '')

  const { data: items, isLoading } = useQuery({
    queryKey: ['cocina'],
    queryFn: getItemsActivos,
    ...queryDefaults('cocina'),
  })

  const marcarListoMutation = useMutation({
    mutationFn: ({ ordenId, itemId }: { ordenId: string; itemId: string }) =>
      marcarItemListo(ordenId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cocina'] })
      queryClient.invalidateQueries({ queryKey: ['orden'] })
      queryClient.invalidateQueries({ queryKey: ['ordenes'] })
    },
    onError: () => showToast({ type: 'error', message: 'Error al marcar item listo' }),
  })

  const completarMutation = useMutation({
    mutationFn: (ordenId: string) => marcarOrdenCompletada(ordenId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cocina'] })
      queryClient.invalidateQueries({ queryKey: ['orden'] })
      queryClient.invalidateQueries({ queryKey: ['ordenes'] })
      showToast({ type: 'success', message: 'Orden completada' })
    },
    onError: () => showToast({ type: 'error', message: 'Error al completar orden' }),
  })

  const imprimirTicket = useCallback(async (ordenId: string) => {
    try {
      const html = await getTicket(ordenId)
      const w = window.open('', '_blank')
      if (w) {
        w.document.write(html)
        w.document.close()
        w.print()
      }
    } catch {
      showToast({ type: 'error', message: 'Error al imprimir ticket' })
    }
  }, [showToast])

  function itemEstado(item: CocinaItem): ColumnaId {
    const estados = new Set(item.items.map((i) => i.estado))
    if (estados.has('pendiente')) return 'pendientes'
    if (estados.has('en_proceso')) return 'preparacion'
    return 'listos'
  }

  const columnas = useMemo(() => {
    const grouped: Record<ColumnaId, CocinaItem[]> = {
      pendientes: [],
      preparacion: [],
      listos: [],
    }
    for (const item of items ?? []) {
      const col = itemEstado(item)
      grouped[col].push(item)
    }
    return columnasConfig.map((cfg) => ({
      id: cfg.id,
      title: cfg.title,
      items: grouped[cfg.id].map((item) => ({
        id: item.orden_id,
        content: (
          <CocinaCard
            key={item.orden_id}
            item={item}
            onMarcarListo={(ordenId, itemId) => marcarListoMutation.mutate({ ordenId, itemId })}
            onCompletada={(ordenId) => completarMutation.mutate(ordenId)}
            onImprimir={imprimirTicket}
          />
        ),
      })),
    }))
  }, [items, marcarListoMutation, completarMutation, imprimirTicket])

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div>
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 shrink-0">
        <h1 className="font-display text-xl text-text-primary">Cocina</h1>
      </div>
      <div className="flex-1 overflow-hidden">
        <KanbanBoard columns={columnas} renderItem={(item) => item.content} />
      </div>
    </div>
  )
}
