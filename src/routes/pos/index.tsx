import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TableMap } from './components/TableMap'
import { ProductGrid } from './components/ProductGrid'
import { TicketPanel } from './components/TicketPanel'
import { PaymentPanel } from './components/PaymentPanel'
import { ModifierPanel } from './components/ModifierPanel'
import { crearOrden, agregarItem, eliminarItem, pagarOrden, enviarCocina } from './api'
import type { Mesa, Producto, Orden } from '../../types'

export default function POSPage() {
  const queryClient = useQueryClient()
  const [ordenActiva, setOrdenActiva] = useState<Orden | null>(null)
  const [mostrarPayment, setMostrarPayment] = useState(false)
  const [modifierProducto, setModifierProducto] = useState<Producto | null>(null)

  const crearMutation = useMutation({
    mutationFn: crearOrden,
    onSuccess: (orden) => {
      setOrdenActiva(orden)
      queryClient.invalidateQueries({ queryKey: ['ordenes'] })
      queryClient.invalidateQueries({ queryKey: ['mesas'] })
    },
  })

  const agregarMutation = useMutation({
    mutationFn: ({ ordenId, productoId }: { ordenId: string; productoId: string }) =>
      agregarItem(ordenId, { producto_id: productoId, cantidad: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes'] })
    },
  })

  const eliminarMutation = useMutation({
    mutationFn: ({ ordenId, itemId }: { ordenId: string; itemId: string }) =>
      eliminarItem(ordenId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes'] })
    },
  })

  const cocinaMutation = useMutation({
    mutationFn: (ordenId: string) => enviarCocina(ordenId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes'] })
    },
  })

  const pagarMutation = useMutation({
    mutationFn: (data: { metodo: string; monto_recibido?: number; split?: number }) =>
      pagarOrden(ordenActiva!.id, data),
    onSuccess: () => {
      setOrdenActiva(null)
      setMostrarPayment(false)
      queryClient.invalidateQueries({ queryKey: ['ordenes'] })
      queryClient.invalidateQueries({ queryKey: ['mesas'] })
    },
  })

  const handleSelectMesa = async (mesa: Mesa) => {
    const ordenes = queryClient.getQueryData<Orden[]>(['ordenes'])
    const existente = ordenes?.find(
      (o) => o.mesa_id === mesa.id && o.estado !== 'pagada'
    )
    if (existente) {
      setOrdenActiva(existente)
    } else {
      crearMutation.mutate({ mesa_id: mesa.id })
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

  const handleModifierConfirm = async (notas: string, _modificadores: string[]) => {
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
          <div className="animate-fadeIn">
            <h2 className="font-display text-sm text-text-secondary uppercase tracking-wider mb-4">
              Selecciona una mesa
            </h2>
            <TableMap onSelectMesa={handleSelectMesa} />
          </div>
        ) : (
          <div className="flex flex-col h-full animate-fadeIn">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <button
                onClick={() => setOrdenActiva(null)}
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
        onConfirmar={(data) => pagarMutation.mutate(data)}
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
