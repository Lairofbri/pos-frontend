import { useState, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { TableMap } from './components/TableMap'
import { ProductGrid } from './components/ProductGrid'
import { TicketPanel } from './components/TicketPanel'
import { PaymentPanel } from './components/PaymentPanel'
import { ModifierPanel } from './components/ModifierPanel'
import { crearOrden, agregarItem, eliminarItem, pagarOrden, enviarCocina, getOrdenes } from './api'
import { useToastStore } from '../../store/toastStore'
import type { Mesa, Producto, Orden } from '../../types'

export default function POSPage() {
  const queryClient = useQueryClient()
  const showToast = useToastStore((s) => s.show)
  const [mesaSeleccionadaId, setMesaSeleccionadaId] = useState<string | null>(null)
  const [mostrarPayment, setMostrarPayment] = useState(false)
  const [modifierProducto, setModifierProducto] = useState<Producto | null>(null)

  const { data: ordenes } = useQuery({
    queryKey: ['ordenes'],
    queryFn: () => getOrdenes(),
    staleTime: 30_000,
  })

  const ordenActiva = useMemo(() => {
    if (!mesaSeleccionadaId || !ordenes) return null
    return ordenes.find(o => o.mesa_id === mesaSeleccionadaId && o.estado !== 'pagada') ?? null
  }, [mesaSeleccionadaId, ordenes])

  const crearMutation = useMutation({
    mutationFn: (mesaId: string) => crearOrden({ mesa_id: mesaId }),
    onSuccess: (orden) => {
      queryClient.setQueryData<Orden[]>(['ordenes'], (old) => [...(old || []), orden])
      setMesaSeleccionadaId(orden.mesa_id)
      queryClient.invalidateQueries({ queryKey: ['ordenes'] })
      queryClient.invalidateQueries({ queryKey: ['mesas'] })
    },
    onError: () => showToast({ type: 'error', message: 'Error al crear orden' }),
  })

  const agregarMutation = useMutation({
    mutationFn: ({ ordenId, productoId }: { ordenId: string; productoId: string }) =>
      agregarItem(ordenId, { producto_id: productoId, cantidad: 1 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ordenes'] }),
    onError: () => showToast({ type: 'error', message: 'Error al agregar producto' }),
  })

  const eliminarMutation = useMutation({
    mutationFn: ({ ordenId, itemId }: { ordenId: string; itemId: string }) =>
      eliminarItem(ordenId, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ordenes'] }),
    onError: () => showToast({ type: 'error', message: 'Error al eliminar item' }),
  })

  const cocinaMutation = useMutation({
    mutationFn: (ordenId: string) => enviarCocina(ordenId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes'] })
      showToast({ type: 'success', message: 'Orden enviada a cocina' })
    },
    onError: () => showToast({ type: 'error', message: 'Error al enviar a cocina' }),
  })

  const pagarMutation = useMutation({
    mutationFn: (pdata: { metodo: string; monto_efectivo?: number; monto_tarjeta?: number; referencia_tarjeta?: string }) =>
      pagarOrden(ordenActiva!.id, pdata),
    onSuccess: () => {
      setMesaSeleccionadaId(null)
      setMostrarPayment(false)
      queryClient.invalidateQueries({ queryKey: ['ordenes'] })
      queryClient.invalidateQueries({ queryKey: ['mesas'] })
      showToast({ type: 'success', message: 'Pago completado' })
    },
    onError: () => showToast({ type: 'error', message: 'Error al procesar pago' }),
  })

  const handleSelectMesa = (mesa: Mesa) => {
    const existente = ordenes?.find(
      (o) => o.mesa_id === mesa.id && o.estado !== 'pagada'
    )
    if (existente) {
      setMesaSeleccionadaId(mesa.id)
    } else {
      crearMutation.mutate(mesa.id)
    }
  }

  const handleSelectProducto = (p: Producto) => {
    if (!ordenActiva) return
    agregarMutation.mutate({ ordenId: ordenActiva.id, productoId: p.id })
  }

  const handleLongPressProducto = (p: Producto) => {
    if (!ordenActiva) return
    setModifierProducto(p)
  }

  const handleModifierConfirm = async (notas: string) => {
    if (!ordenActiva || !modifierProducto) return
    await agregarItem(ordenActiva.id, {
      producto_id: modifierProducto.id,
      cantidad: 1,
      notas: notas || undefined,
    })
    setModifierProducto(null)
    queryClient.invalidateQueries({ queryKey: ['ordenes'] })
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      <div className="flex-1 flex flex-col min-w-0">
        {!ordenActiva ? (
          <div>
            <h2 className="font-display text-sm text-text-secondary uppercase tracking-wider mb-4">
              Selecciona una mesa
            </h2>
            <TableMap onSelectMesa={handleSelectMesa} />
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <button
                onClick={() => setMesaSeleccionadaId(null)}
                className="text-sm font-body text-text-secondary hover:text-accent transition-colors cursor-pointer"
              >
                ← Cambiar mesa
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ProductGrid
                onSelectProducto={handleSelectProducto}
                onLongPressProducto={handleLongPressProducto}
              />
            </div>
          </div>
        )}
      </div>

      <div className="lg:w-[360px] xl:w-[400px] shrink-0">
        <TicketPanel
          orden={ordenActiva}
          onEliminarItem={(itemId) =>
            ordenActiva && eliminarMutation.mutate({ ordenId: ordenActiva.id, itemId })
          }
          onEnviarCocina={() => ordenActiva && cocinaMutation.mutate(ordenActiva.id)}
          onPagar={() => setMostrarPayment(true)}
          enviando={cocinaMutation.isPending}
        />
      </div>

      <PaymentPanel
        open={mostrarPayment}
        onClose={() => setMostrarPayment(false)}
        orden={ordenActiva}
        onConfirmar={(pdata) => pagarMutation.mutate(pdata)}
        loading={pagarMutation.isPending}
      />

      <ModifierPanel
        open={!!modifierProducto}
        onClose={() => setModifierProducto(null)}
        producto={modifierProducto}
        onConfirm={handleModifierConfirm}
      />
    </div>
  )
}
