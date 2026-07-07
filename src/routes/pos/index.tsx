import { useState, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryDefaults } from '../../config/queries'
import { TableMap } from './components/TableMap'
import { ProductGrid } from './components/ProductGrid'
import { TicketPanel } from './components/TicketPanel'
import { RestaurantSummary } from './components/RestaurantSummary'
import { PaymentPanel } from './components/PaymentPanel'
import { ModifierPanel } from './components/ModifierPanel'
import { GerentePinModal } from '../../components/shared/GerentePinModal'
import { ConfirmDialog } from '../../components/shared/ConfirmDialog'
import { Icon } from '../../components/shared/Icon'
import { crearOrden, agregarItem, actualizarItem, eliminarItem, cancelarItem, pagarOrden, enviarCocina, actualizarOrden, cancelarOrden, getOrdenes, getOrden } from './api'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import { useCocinaSocket } from '../../hooks/useSocket'
import { useZoneStore } from '../../store/zoneStore'
import { useCatalogo } from '../../hooks/useCatalogo'
import type { Mesa, Producto, Orden, OrdenItem } from '../../types'

export default function POSPage() {
  const queryClient = useQueryClient()
  const showToast = useToastStore((s) => s.show)
  const tenantId = useAuthStore((s) => s.tenantId)
  const [modo, setModo] = useState<'mesa' | 'rapido'>('mesa')
  const [ordenSeleccionadaId, setOrdenSeleccionadaId] = useState<string | null>(null)
  const [mostrarPayment, setMostrarPayment] = useState(false)
  const [modifierProducto, setModifierProducto] = useState<Producto | null>(null)
  const [autorizandoItemId, setAutorizandoItemId] = useState<string | null>(null)
  const [confirmarLiberar, setConfirmarLiberar] = useState(false)
  const [mobileTab, setMobileTab] = useState<'productos' | 'ticket'>('productos')

  const zonaActiva = useZoneStore((s) => s.zona)
  const setZona = useZoneStore((s) => s.setZona)
  const { data: zonas } = useCatalogo('zonas')

  useCocinaSocket(tenantId ?? '')

  const { data: ordenes } = useQuery({
    queryKey: ['ordenes'],
    queryFn: () => getOrdenes(),
    ...queryDefaults('ordenes'),
  })

  const { data: ordenActiva } = useQuery({
    queryKey: ['orden', ordenSeleccionadaId],
    queryFn: () => getOrden(ordenSeleccionadaId!),
    enabled: !!ordenSeleccionadaId,
    ...queryDefaults('orden'),
  })

  const setOrdenConReset = (id: string | null) => {
    setOrdenSeleccionadaId(id)
    if (id) setMobileTab('productos')
  }

  const invalidarOrden = () => {
    if (ordenSeleccionadaId) {
      queryClient.invalidateQueries({ queryKey: ['orden', ordenSeleccionadaId] })
      queryClient.invalidateQueries({ queryKey: ['ordenes'] })
      queryClient.invalidateQueries({ queryKey: ['mesas'] })
    }
  }

  const limpiarOrden = (id: string | null) => {
    setOrdenConReset(null)
    setMostrarPayment(false)
    queryClient.invalidateQueries({ queryKey: ['ordenes'] })
    queryClient.invalidateQueries({ queryKey: ['mesas'] })
    if (id) queryClient.removeQueries({ queryKey: ['orden', id] })
  }

  const crearMutation = useMutation({
    mutationFn: (params: { tipo?: string; mesa_id?: string }) => crearOrden(params),
    onSuccess: (orden) => {
      queryClient.setQueryData(['ordenes'], (old: unknown) => {
        const prev = (old as Array<unknown>) ?? []
        return [...prev, orden]
      })
      queryClient.invalidateQueries({ queryKey: ['mesas'] })
      setOrdenConReset(orden.id)
    },
  })

  type AgregarParams = { ordenId: string; productoId: string; cantidad: number; notas?: string; _nombre: string; _precio: number }
  const agregarItemMutation = useMutation({
    mutationFn: (params: AgregarParams) =>
      agregarItem(params.ordenId, { producto_id: params.productoId, cantidad: params.cantidad, notas: params.notas }),
    onMutate: async (params: AgregarParams) => {
      await queryClient.cancelQueries({ queryKey: ['orden', params.ordenId] })
      const previous = queryClient.getQueryData(['orden', params.ordenId])
      queryClient.setQueryData(['orden', params.ordenId], (old: Orden | undefined) => {
        if (!old) return old
        const idx = old.items.findIndex(
          (i) => i.producto_id === params.productoId && i.estado === 'pendiente' && !i.notas && !params.notas
        )
        if (idx >= 0) {
          const newItems = [...old.items]
          newItems[idx] = { ...newItems[idx], cantidad: newItems[idx].cantidad + 1 }
          return { ...old, items: newItems }
        }
        const optItem: OrdenItem = {
          id: `_opt_${Date.now()}`, producto_id: params.productoId,
          nombre: params._nombre, cantidad: params.cantidad,
          precio_unitario: params._precio,
          subtotal: params._precio * params.cantidad,
          descuento_porcentaje: 0, estado: 'pendiente', notas: params.notas,
        }
        return { ...old, items: [...old.items, optItem] }
      })
      return { previous }
    },
    onError: (_, params, context) => {
      if (context?.previous) queryClient.setQueryData(['orden', params.ordenId], context.previous)
      showToast({ type: 'error', message: 'Error al agregar producto' })
    },
    onSettled: (_, __, params) => {
      queryClient.invalidateQueries({ queryKey: ['orden', params.ordenId] })
    },
  })

  const incrementarItemMutation = useMutation({
    mutationFn: ({ ordenId, itemId, cantidad }: { ordenId: string; itemId: string; cantidad: number }) =>
      actualizarItem(ordenId, itemId, { cantidad }),
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: ['orden', params.ordenId] })
      const previous = queryClient.getQueryData(['orden', params.ordenId])
      queryClient.setQueryData(['orden', params.ordenId], (old: Orden | undefined) => {
        if (!old) return old
        return { ...old, items: old.items.map((item) => item.id === params.itemId ? { ...item, cantidad: params.cantidad } : item) }
      })
      return { previous }
    },
    onError: (_, params, context) => {
      if (context?.previous) queryClient.setQueryData(['orden', params.ordenId], context.previous)
      showToast({ type: 'error', message: 'Error al actualizar cantidad' })
    },
    onSettled: (_, __, params) => {
      queryClient.invalidateQueries({ queryKey: ['orden', params.ordenId] })
    },
  })

  const cocinaMutation = useMutation({
    mutationFn: (ordenId: string) => enviarCocina(ordenId),
    onSuccess: () => {
      invalidarOrden()
      showToast({ type: 'success', message: 'Orden enviada a cocina' })
    },
  })

  const pagarMutation = useMutation({
    mutationFn: (pdata: { metodo: string; monto_efectivo?: number; monto_tarjeta?: number; referencia_tarjeta?: string }) =>
      pagarOrden(ordenSeleccionadaId!, pdata),
    onSuccess: () => {
      const id = ordenSeleccionadaId
      limpiarOrden(id)
      showToast({ type: 'success', message: 'Pago completado' })
    },
  })

  const descuentoMutation = useMutation({
    mutationFn: (pct: number) => actualizarOrden(ordenActiva!.id, { porcentaje_descuento: pct || undefined }),
    onSuccess: () => { invalidarOrden() },
  })

  const notasMutation = useMutation({
    mutationFn: (notas: string) => actualizarOrden(ordenActiva!.id, { notas: notas || undefined }),
    onSuccess: () => { invalidarOrden() },
  })

  const eliminarMutation = useMutation({
    mutationFn: ({ ordenId, itemId }: { ordenId: string; itemId: string }) => eliminarItem(ordenId, itemId),
    onSuccess: () => { invalidarOrden() },
  })

  const cancelarItemMutation = useMutation({
    mutationFn: ({ ordenId, itemId }: { ordenId: string; itemId: string }) => cancelarItem(ordenId, itemId),
    onSuccess: () => {
      invalidarOrden()
      showToast({ type: 'success', message: 'Item cancelado por gerente' })
    },
  })

  const liberarMutation = useMutation({
    mutationFn: async () => {
      const ordenId = ordenSeleccionadaId!
      const items = ordenActiva?.items ?? []
      const pendientes = items.filter((i) => i.estado === 'pendiente')
      await Promise.all(pendientes.map((i) => cancelarItem(ordenId, i.id)))
      await cancelarOrden(ordenId)
    },
    onSuccess: () => {
      const id = ordenSeleccionadaId
      setOrdenConReset(null)
      queryClient.invalidateQueries({ queryKey: ['ordenes'] })
      queryClient.invalidateQueries({ queryKey: ['mesas'] })
      if (id) queryClient.removeQueries({ queryKey: ['orden', id] })
      showToast({ type: 'success', message: 'Mesa liberada' })
    },
  })

  const handleSelectMesa = (mesa: Mesa) => {
    if (mesa.orden_activa) {
      setOrdenConReset(mesa.orden_activa.id)
    } else {
      const existente = ordenes?.find((o) => o.mesa_id === mesa.id && o.estado !== 'pagada' && o.estado !== 'cancelada')
      if (existente) {
        setOrdenConReset(existente.id)
      } else {
        crearMutation.mutate({ tipo: 'mesa', mesa_id: mesa.id })
      }
    }
  }

  const iniciarRapido = () => {
    setModo('rapido')
    crearMutation.mutate({ tipo: 'rapido' })
  }

  const handleSelectProducto = (p: Producto) => {
    if (!ordenActiva) return
    const existingPending = ordenActiva.items.find(
      (i) => i.producto_id === p.id && i.estado === 'pendiente' && !i.notas
    )
    if (existingPending) {
      incrementarItemMutation.mutate({
        ordenId: ordenActiva.id,
        itemId: existingPending.id,
        cantidad: existingPending.cantidad + 1,
      })
    } else {
      agregarItemMutation.mutate({
        ordenId: ordenActiva.id,
        productoId: p.id,
        cantidad: 1,
        _nombre: p.nombre,
        _precio: p.precio,
      })
    }
  }

  const handleLongPressProducto = (p: Producto) => {
    if (!ordenActiva) return
    setModifierProducto(p)
  }

  const handleModifierConfirm = (notas: string) => {
    if (!ordenActiva || !modifierProducto) return
    agregarItemMutation.mutate({
      ordenId: ordenActiva.id,
      productoId: modifierProducto.id,
      cantidad: 1,
      notas: notas || undefined,
      _nombre: modifierProducto.nombre,
      _precio: modifierProducto.precio,
    })
    setModifierProducto(null)
  }

  const handleEliminarItem = (itemId: string) => {
    eliminarMutation.mutate({ ordenId: ordenSeleccionadaId!, itemId })
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
    setConfirmarLiberar(true)
  }

  const confirmarLiberarMesa = () => {
    liberarMutation.mutate()
    setConfirmarLiberar(false)
  }

  const handleCambiarMesa = () => {
    setOrdenConReset(null)
  }

  const opcionesZona = useMemo(
    () => (zonas ?? []).map((z) => ({ value: z.valor, label: z.label })),
    [zonas]
  )

  return (
    <>
      <div
        className="flex flex-col lg:grid lg:grid-cols-[1fr_max-w-md] xl:grid-cols-[1fr_420px] gap-6 h-full overflow-hidden pb-16 lg:pb-0"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* LEFT COLUMN */}
        <div className={`flex flex-col overflow-hidden min-h-0 px-4 lg:pl-6 lg:pr-0 lg:py-6 ${ordenActiva && mobileTab === 'ticket' ? 'hidden lg:flex' : ''}`}>
          {!ordenActiva ? (
            <>
              {/* Zone tabs + modo toggle */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 lg:mb-6 shrink-0">
                <div className="flex items-center gap-1.5 lg:gap-2 flex-wrap">
                  {opcionesZona.map((z) => (
                    <button
                      key={z.value}
                      onClick={() => setZona(z.value)}
                      style={{
                        height: 34,
                        padding: '0 14px',
                        borderRadius: 10,
                        border: zonaActiva === z.value ? 'none' : '1px solid #D6C6B6',
                        background: zonaActiva === z.value ? '#C7672F' : '#FFFFFF',
                        color: zonaActiva === z.value ? '#FFFFFF' : '#3E2A1F',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: zonaActiva === z.value ? '0 8px 18px rgba(199,102,46,0.22)' : 'none',
                      }}
                    >
                      {z.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 lg:gap-2">
                  <button
                    onClick={() => setModo('mesa')}
                    style={{
                      height: 34,
                      padding: '0 14px',
                      borderRadius: 10,
                      border: modo === 'mesa' ? 'none' : '1px solid #D6C6B6',
                      background: modo === 'mesa' ? '#C7672F' : '#FFFFFF',
                      color: modo === 'mesa' ? '#FFFFFF' : '#3E2A1F',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Icon name="table" className="w-3.5 h-3.5 inline mr-1" />
                    Mesas
                  </button>
                  <button
                    onClick={iniciarRapido}
                    style={{
                      height: 34,
                      padding: '0 14px',
                      borderRadius: 10,
                      border: modo === 'rapido' ? 'none' : '1px solid #D6C6B6',
                      background: modo === 'rapido' ? '#C7672F' : '#FFFFFF',
                      color: modo === 'rapido' ? '#FFFFFF' : '#3E2A1F',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Icon name="shopping-cart" className="w-3.5 h-3.5 inline mr-1" />
                    Rápido
                  </button>
                </div>
              </div>

              {/* TableMap */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {modo === 'mesa' ? (
                  <TableMap onSelectMesa={handleSelectMesa} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: '#6D5B4E' }}>
                      Inicia una venta rápida sin mesa asignada
                    </p>
                    <button
                      onClick={iniciarRapido}
                      style={{
                        height: 44,
                        padding: '0 24px',
                        borderRadius: 12,
                        background: '#C7662E',
                        color: '#FFFFFF',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 16,
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Iniciar venta rápida
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Back button + ProductGrid */}
              <div className="flex items-center justify-between mb-3 lg:mb-4 shrink-0">
                <button
                  onClick={handleCambiarMesa}
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#6D5B4E',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Icon name="arrow-left" className="w-4 h-4" />
                  {modo === 'rapido' ? 'Nueva venta' : 'Cambiar mesa'}
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ProductGrid
                  onSelectProducto={handleSelectProducto}
                  onLongPressProducto={handleLongPressProducto}
                />
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className={`flex flex-col overflow-hidden min-h-0 px-4 lg:pl-0 lg:pr-6 lg:py-6 ${!ordenActiva ? 'hidden md:flex' : ordenActiva && mobileTab === 'productos' ? 'hidden lg:flex' : ''}`}>
          {ordenActiva ? (
            <div className="flex-1 overflow-y-auto">
              <TicketPanel
                key={ordenActiva.id}
                orden={ordenActiva}
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
          ) : (
            <div className="overflow-y-auto">
              <RestaurantSummary />
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom tabs — only when order active */}
      {ordenActiva && (
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-border flex items-center justify-around h-14 px-2 pb-1">
          <button
            onClick={() => setMobileTab('productos')}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-lg transition-colors ${
              mobileTab === 'productos' ? 'text-pos-accent bg-pos-accent/5' : 'text-text-secondary'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
            <span className="text-[10px] font-semibold">Productos</span>
          </button>
          <button
            onClick={() => setMobileTab('ticket')}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-lg transition-colors relative ${
              mobileTab === 'ticket' ? 'text-pos-accent bg-pos-accent/5' : 'text-text-secondary'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-[10px] font-semibold">Ticket</span>
            {ordenActiva.items.length > 0 && (
              <span className="absolute -top-0.5 right-1/4 min-w-[18px] h-[18px] rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center px-1">
                {ordenActiva.items.reduce((s, i) => s + i.cantidad, 0)}
              </span>
            )}
          </button>
        </div>
      )}

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
        message="¿Estás seguro de liberar esta mesa? Se cancelarán los items pendientes."
        confirmLabel="Liberar"
        onConfirm={confirmarLiberarMesa}
        onCancel={() => setConfirmarLiberar(false)}
        loading={liberarMutation.isPending}
      />
    </>
  )
}
