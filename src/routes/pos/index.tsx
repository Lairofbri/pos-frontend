import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryDefaults } from '../../config/queries'
import { TableMap } from './components/TableMap'
import { ProductGrid } from './components/ProductGrid'
import { TicketPanel } from './components/TicketPanel'
import { PaymentPanel } from './components/PaymentPanel'
import { ModifierPanel } from './components/ModifierPanel'
import { GerentePinModal } from '../../components/shared/GerentePinModal'
import { ConfirmDialog } from '../../components/shared/ConfirmDialog'
import { crearOrden, agregarItem, eliminarItem, cancelarItem, pagarOrden, enviarCocina, actualizarOrden, cancelarOrden, getOrdenes, getOrden } from './api'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import { useCocinaSocket } from '../../hooks/useSocket'
import type { Mesa, Producto, OrdenItem } from '../../types'

let itemIdCounter = 0
function nextId() { return `_local_${++itemIdCounter}` }

export default function POSPage() {
  const queryClient = useQueryClient()
  const showToast = useToastStore((s) => s.show)
  const tenantId = useAuthStore((s) => s.tenantId)
  const [modo, setModo] = useState<'mesa' | 'rapido'>('mesa')
  const [ordenSeleccionadaId, setOrdenSeleccionadaId] = useState<string | null>(null)
  const [mostrarPayment, setMostrarPayment] = useState(false)
  const [modifierProducto, setModifierProducto] = useState<Producto | null>(null)
  const [itemsPendientes, setItemsPendientes] = useState<OrdenItem[]>([])
  const [autorizandoItemId, setAutorizandoItemId] = useState<string | null>(null)
  const [confirmarLiberar, setConfirmarLiberar] = useState(false)
  const [itemsAlLiberar, setItemsAlLiberar] = useState<string[]>([])

  useCocinaSocket(tenantId ?? '')

  const { data: ordenes } = useQuery({
    queryKey: ['ordenes'],
    queryFn: () => getOrdenes(),
    ...queryDefaults('ordenes'),
  })

  const { data: ordenApi } = useQuery({
    queryKey: ['orden', ordenSeleccionadaId],
    queryFn: () => getOrden(ordenSeleccionadaId!),
    enabled: !!ordenSeleccionadaId,
    ...queryDefaults('orden'),
  })

  const itemsEnviados = ordenApi?.items ?? []

  const ordenActiva = (() => {
    if (!ordenApi) return null
    const enviados = ordenApi.items ?? []
    return { ...ordenApi, items: [...enviados, ...itemsPendientes] }
  })()

  const enviarPendientesApi = async (ordenId: string) => {
    if (itemsPendientes.length === 0) return
    await Promise.all(
      itemsPendientes.map((item) =>
        agregarItem(ordenId, {
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          notas: item.notas || undefined,
        })
      )
    )
    setItemsPendientes([])
  }

  const crearMutation = useMutation({
    mutationFn: (params: { tipo?: string; mesa_id?: string }) => crearOrden(params),
    onSuccess: (orden) => {
      queryClient.setQueryData(['ordenes'], (old: unknown) => {
        const prev = (old as Array<unknown>) ?? []
        return [...prev, orden]
      })
      setOrdenSeleccionadaId(orden.id)
      setItemsPendientes([])
    },
    onError: () => showToast({ type: 'error', message: 'Error al crear orden' }),
  })

  const cocinaMutation = useMutation({
    mutationFn: async (ordenId: string) => {
      await enviarPendientesApi(ordenId)
      return enviarCocina(ordenId)
    },
    onSuccess: () => {
      if (ordenSeleccionadaId) {
        queryClient.invalidateQueries({ queryKey: ['orden', ordenSeleccionadaId] })
        queryClient.invalidateQueries({ queryKey: ['ordenes'] })
        queryClient.invalidateQueries({ queryKey: ['mesas'] })
      }
      showToast({ type: 'success', message: 'Orden enviada a cocina' })
    },
    onError: () => showToast({ type: 'error', message: 'Error al enviar a cocina' }),
  })

  const pagarMutation = useMutation({
    mutationFn: async (pdata: { metodo: string; monto_efectivo?: number; monto_tarjeta?: number; referencia_tarjeta?: string }) => {
      await enviarPendientesApi(ordenSeleccionadaId!)
      return pagarOrden(ordenSeleccionadaId!, pdata)
    },
    onSuccess: () => {
      const id = ordenSeleccionadaId
      setOrdenSeleccionadaId(null)
      setMostrarPayment(false)
      setItemsPendientes([])
      queryClient.invalidateQueries({ queryKey: ['ordenes'] })
      queryClient.invalidateQueries({ queryKey: ['mesas'] })
      if (id) queryClient.removeQueries({ queryKey: ['orden', id] })
      showToast({ type: 'success', message: 'Pago completado' })
    },
    onError: () => showToast({ type: 'error', message: 'Error al procesar pago' }),
  })

  const descuentoMutation = useMutation({
    mutationFn: (pct: number) => actualizarOrden(ordenActiva!.id, { porcentaje_descuento: pct || undefined }),
    onSuccess: () => {
      if (ordenSeleccionadaId) queryClient.invalidateQueries({ queryKey: ['orden', ordenSeleccionadaId] })
      showToast({ type: 'success', message: 'Descuento actualizado' })
    },
    onError: () => showToast({ type: 'error', message: 'Error al aplicar descuento' }),
  })

  const notasMutation = useMutation({
    mutationFn: (notas: string) => actualizarOrden(ordenActiva!.id, { notas: notas || undefined }),
    onSuccess: () => {
      if (ordenSeleccionadaId) queryClient.invalidateQueries({ queryKey: ['orden', ordenSeleccionadaId] })
    },
    onError: () => showToast({ type: 'error', message: 'Error al guardar notas' }),
  })

  const eliminarMutation = useMutation({
    mutationFn: ({ ordenId, itemId }: { ordenId: string; itemId: string }) => eliminarItem(ordenId, itemId),
    onSuccess: () => {
      if (ordenSeleccionadaId) queryClient.invalidateQueries({ queryKey: ['orden', ordenSeleccionadaId] })
    },
    onError: () => showToast({ type: 'error', message: 'Error al eliminar item' }),
  })

  const cancelarItemMutation = useMutation({
    mutationFn: ({ ordenId, itemId }: { ordenId: string; itemId: string }) => cancelarItem(ordenId, itemId),
    onSuccess: () => {
      if (ordenSeleccionadaId) queryClient.invalidateQueries({ queryKey: ['orden', ordenSeleccionadaId] })
      showToast({ type: 'success', message: 'Item cancelado por gerente' })
    },
    onError: () => showToast({ type: 'error', message: 'Error al cancelar item' }),
  })

  const liberarMutation = useMutation({
    mutationFn: async () => {
      const ordenId = ordenSeleccionadaId!
      await enviarPendientesApi(ordenId)
      const itemsActuales = ordenApi?.items ?? []
      const pendientesApi = itemsActuales.filter((i) => i.estado === 'pendiente')
      await Promise.all(pendientesApi.map((i) => cancelarItem(ordenId, i.id)))
      await cancelarOrden(ordenId)
    },
    onSuccess: () => {
      const id = ordenSeleccionadaId
      setOrdenSeleccionadaId(null)
      setItemsPendientes([])
      queryClient.invalidateQueries({ queryKey: ['ordenes'] })
      queryClient.invalidateQueries({ queryKey: ['mesas'] })
      if (id) queryClient.removeQueries({ queryKey: ['orden', id] })
      showToast({ type: 'success', message: 'Mesa liberada' })
    },
    onError: () => showToast({ type: 'error', message: 'Error al liberar mesa' }),
  })

  const handleSelectMesa = (mesa: Mesa) => {
    const existente = ordenes?.find((o) => o.mesa_id === mesa.id && o.estado !== 'pagada' && o.estado !== 'cancelada')
    if (existente) {
      setOrdenSeleccionadaId(existente.id)
      setItemsPendientes([])
    } else {
      crearMutation.mutate({ tipo: 'mesa', mesa_id: mesa.id })
    }
  }

  const iniciarRapido = () => {
    setModo('rapido')
    crearMutation.mutate({ tipo: 'rapido' })
  }

  const agregarItemLocal = (p: Producto, notas?: string) => {
    const item: OrdenItem = {
      id: nextId(), producto_id: p.id, nombre: p.nombre,
      cantidad: 1, precio_unitario: p.precio, estado: 'pendiente', notas,
    }
    setItemsPendientes((prev) => {
      const idx = prev.findIndex((i) => i.producto_id === p.id && !i.notas)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], cantidad: copy[idx].cantidad + 1 }
        return copy
      }
      return [...prev, item]
    })
  }

  const handleSelectProducto = (p: Producto) => {
    if (!ordenActiva) return
    const existentePendiente = itemsPendientes.find((i) => i.producto_id === p.id && !i.notas)
    const existenteApi = itemsEnviados.find((i) => i.producto_id === p.id && i.estado === 'pendiente' && !i.notas)
    if (existentePendiente) {
      setItemsPendientes((prev) => prev.map((i) => i.id === existentePendiente.id ? { ...i, cantidad: i.cantidad + 1 } : i))
    } else if (existenteApi) {
      setItemsPendientes((prev) => [...prev, { id: nextId(), producto_id: p.id, nombre: p.nombre, cantidad: 1, precio_unitario: p.precio, estado: 'pendiente' }])
    } else {
      agregarItemLocal(p)
    }
  }

  const handleLongPressProducto = (p: Producto) => {
    if (!ordenActiva) return
    setModifierProducto(p)
  }

  const handleModifierConfirm = async (notas: string) => {
    if (!ordenActiva || !modifierProducto) return
    agregarItemLocal(modifierProducto, notas || undefined)
    setModifierProducto(null)
  }

  const handleEliminarItem = (itemId: string) => {
    if (itemId.startsWith('_local_')) {
      setItemsPendientes((prev) => prev.filter((i) => i.id !== itemId))
    } else {
      eliminarMutation.mutate({ ordenId: ordenSeleccionadaId!, itemId })
    }
  }

  const handleAutorizarEliminacion = (itemId: string) => {
    setAutorizandoItemId(itemId)
  }

  const handlePinAuthorized = () => {
    if (autorizandoItemId) {
      cancelarItemMutation.mutate({ ordenId: ordenSeleccionadaId!, itemId: autorizandoItemId })
    }
    setAutorizandoItemId(null)
  }

  const handleLiberarMesa = () => {
    const items = ordenApi?.items ?? []
    const pendientes = items.filter((i) => i.estado === 'pendiente')
    const locales = itemsPendientes.length
    const msgs: string[] = []
    if (pendientes.length > 0) msgs.push(`${pendientes.length} item(s) pendientes en API`)
    if (locales > 0) msgs.push(`${locales} item(s) locales no enviados`)
    setItemsAlLiberar(msgs)
    setConfirmarLiberar(true)
  }

  const confirmarLiberarMesa = () => {
    liberarMutation.mutate()
    setConfirmarLiberar(false)
  }

  const handleCambiarMesa = () => {
    setOrdenSeleccionadaId(null)
    setItemsPendientes([])
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      <div className="flex-1 flex flex-col min-w-0">
        {!ordenActiva ? (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setModo('mesa')} className={`px-4 py-2 rounded-lg border-2 text-sm font-body font-semibold transition-all cursor-pointer ${modo === 'mesa' ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:border-accent/50'}`}>🪑 Mesas</button>
              <button onClick={() => setModo('rapido')} className={`px-4 py-2 rounded-lg border-2 text-sm font-body font-semibold transition-all cursor-pointer ${modo === 'rapido' ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:border-accent/50'}`}>⚡ Rápido</button>
            </div>
            {modo === 'mesa' ? (
              <TableMap onSelectMesa={handleSelectMesa} />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <span className="text-5xl">⚡</span>
                <h2 className="font-display text-lg text-text-primary">Venta Rápida</h2>
                <p className="text-text-secondary text-sm font-body text-center">Agrega productos para crear una comanda sin mesa asignada</p>
                <button onClick={iniciarRapido} className="px-6 py-3 rounded-xl bg-accent text-bg-primary font-body font-semibold hover:glow-amber transition-all cursor-pointer">Iniciar venta rápida</button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <button onClick={handleCambiarMesa} className="text-sm font-body text-text-secondary hover:text-accent transition-colors cursor-pointer">← {modo === 'rapido' ? 'Nueva venta' : 'Cambiar mesa'}</button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ProductGrid onSelectProducto={handleSelectProducto} onLongPressProducto={handleLongPressProducto} />
            </div>
          </div>
        )}
      </div>

      <div className="lg:w-[360px] xl:w-[400px] shrink-0">
        <TicketPanel
          key={ordenActiva?.id ?? 'vacio'}
          orden={ordenActiva ?? null}
          onEliminarItem={handleEliminarItem}
          onEnviarCocina={() => ordenActiva && cocinaMutation.mutate(ordenActiva.id)}
          onPagar={() => setMostrarPayment(true)}
          onDescuento={(pct) => ordenActiva && descuentoMutation.mutate(pct)}
          onGuardarNotas={(n) => notasMutation.mutate(n)}
          onSolicitarAutorizacion={handleAutorizarEliminacion}
          onLiberarMesa={handleLiberarMesa}
          enviando={cocinaMutation.isPending}
        />
      </div>

      <PaymentPanel
        open={mostrarPayment}
        onClose={() => setMostrarPayment(false)}
        orden={ordenActiva ?? null}
        onConfirmar={(pdata) => pagarMutation.mutate(pdata)}
        loading={pagarMutation.isPending}
      />

      <ModifierPanel
        open={!!modifierProducto}
        onClose={() => setModifierProducto(null)}
        producto={modifierProducto}
        onConfirm={handleModifierConfirm}
      />

      <GerentePinModal
        open={!!autorizandoItemId}
        tenantId={tenantId ?? ''}
        onAuthorized={handlePinAuthorized}
        onClose={() => setAutorizandoItemId(null)}
      />

      <ConfirmDialog
        open={confirmarLiberar}
        title="Liberar mesa"
        message={
          itemsAlLiberar.length > 0
            ? `¿Estás seguro? ${itemsAlLiberar.join('. ')} se perderán.`
            : '¿Estás seguro de liberar esta mesa?'
        }
        confirmLabel="Liberar"
        onConfirm={confirmarLiberarMesa}
        onCancel={() => setConfirmarLiberar(false)}
        loading={liberarMutation.isPending}
      />
    </div>
  )
}
