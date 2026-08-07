import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryDefaults } from '../../config/queries'
import { TableMap } from './components/TableMap'
import { ProductGrid } from './components/ProductGrid'
import { TicketPanel } from './components/TicketPanel'
import { RestaurantSummary } from './components/RestaurantSummary'
import { PaymentPanel } from './components/PaymentPanel'
import { ModifierPanel } from './components/ModifierPanel'
import { ItemCustomizer } from './components/ItemCustomizer'
import { GerentePinModal } from '../../components/shared/GerentePinModal'
import { SwitchUserModal } from '../../components/shared/SwitchUserModal'
import { ConfirmDialog } from '../../components/shared/ConfirmDialog'
import { Icon } from '../../components/shared/Icon'
import { crearOrden, agregarItem, actualizarItem, eliminarItem, cancelarItem, pagarOrden, enviarCocina, actualizarOrden, cancelarOrden, getOrdenes, getOrden, actualizarPropina } from './api'
import type { ComboPos } from './api'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'

import { useCocinaSocket } from '../../hooks/useSocket'
import { imprimirTicket } from '../admin/impresoras/api'
import type { Mesa, Producto, Orden, OrdenItem } from '../../types'

export default function POSPage() {
  const queryClient = useQueryClient()
  const showToast = useToastStore((s) => s.show)
  const tenantId = useAuthStore((s) => s.tenantId)
  const usuario = useAuthStore((s) => s.usuario)
  const [modo, setModo] = useState<'mesa' | 'rapido'>('mesa')
  const [ordenSeleccionadaId, setOrdenSeleccionadaId] = useState<string | null>(null)
  const [mostrarPayment, setMostrarPayment] = useState(false)
  const [modifierProducto, setModifierProducto] = useState<Producto | null>(null)
  const [autorizandoItemId, setAutorizandoItemId] = useState<string | null>(null)
  const [confirmarLiberar, setConfirmarLiberar] = useState(false)
  const [mostrarSwitchUser, setMostrarSwitchUser] = useState(false)
  const [mobileTab, setMobileTab] = useState<'productos' | 'ticket'>('productos')
  const [customizingItem, setCustomizingItem] = useState<OrdenItem | null>(null)
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

  type AgregarParams = { ordenId: string; productoId: string; cantidad: number; notas?: string; _nombre: string; _precio: number; _esCombo?: boolean }
  const agregarItemMutation = useMutation({
    mutationFn: (params: AgregarParams) =>
      agregarItem(params.ordenId, { producto_id: params.productoId, cantidad: params.cantidad, notas: params.notas }),
    onMutate: async (params: AgregarParams) => {
      if (params._esCombo) return { previous: null }
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

  const printMutation = useMutation({
    mutationFn: ({ ordenId, tipo }: { ordenId: string; tipo: 'pre-cuenta' | 'ticket-consumo' }) =>
      imprimirTicket(ordenId, tipo),
    onError: () => { /* silent — fallback to browser print */ },
  })

  const pagarMutation = useMutation({
    mutationFn: (pdata: Record<string, unknown>) => {
      const idempotencyKey = crypto.randomUUID()
      return pagarOrden(ordenSeleccionadaId!, pdata, idempotencyKey)
    },
    onSuccess: () => {
      const id = ordenSeleccionadaId
      if (id) printMutation.mutate({ ordenId: id, tipo: 'ticket-consumo' })
      limpiarOrden(id)
      showToast({ type: 'success', message: 'Pago completado' })
    },
  })

  const modificarItemMutation = useMutation({
    mutationFn: ({ itemId, modificaciones, notas }: { itemId: string; modificaciones: { sin?: string[]; extra?: Array<{ producto_id: string; cantidad: number; precio: number }>; notas_extra?: string }; notas: string }) =>
      actualizarItem(ordenSeleccionadaId!, itemId, { modificaciones, notas }),
    onSuccess: () => {
      invalidarOrden()
      setCustomizingItem(null)
    },
  })

  const descuentoMutation = useMutation({
    mutationFn: (pct: number) => actualizarOrden(ordenActiva!.id, { porcentaje_descuento: pct || undefined }),
    onSuccess: () => { invalidarOrden() },
  })

  const propinaMutation = useMutation({
    mutationFn: (pct: number) => actualizarPropina(ordenActiva!.id, { porcentaje: pct }),
    onSuccess: () => { invalidarOrden() },
  })

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mostrarPayment) { setMostrarPayment(false); return }
        if (modifierProducto) { setModifierProducto(null); return }
        if (mostrarSwitchUser) { setMostrarSwitchUser(false); return }
        if (autorizandoItemId) { setAutorizandoItemId(null); return }
        if (confirmarLiberar) { setConfirmarLiberar(false); return }
        return
      }
      const target = e.target as HTMLElement
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return
      if (mostrarPayment || modifierProducto || mostrarSwitchUser || autorizandoItemId || confirmarLiberar) return

      if (!ordenActiva) {
        if (e.key === 'F1') { e.preventDefault(); setModo('mesa'); return }
        if (e.key === 'F2') { e.preventDefault(); setModo('rapido'); return }
        return
      }
      if (e.key === 'c' || e.key === 'C') {
        const tienePendientes = ordenActiva.items.some((i) => i.estado === 'pendiente')
        if (tienePendientes) {
          e.preventDefault()
          cocinaMutation.mutate(ordenActiva.id)
        }
        return
      }
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        setMostrarPayment(true)
        return
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [ordenActiva, mostrarPayment, modifierProducto, mostrarSwitchUser, autorizandoItemId, confirmarLiberar, modo, cocinaMutation])

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

  const handleSelectCombo = (c: ComboPos) => {
    if (!ordenActiva) return
    agregarItemMutation.mutate({
      ordenId: ordenActiva.id,
      productoId: c.id,
      cantidad: 1,
      _nombre: c.nombre,
      _precio: c.precio,
      _esCombo: true,
    })
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

  const handleImprimirPreCuenta = () => {
    if (ordenSeleccionadaId) {
      printMutation.mutate({ ordenId: ordenSeleccionadaId, tipo: 'pre-cuenta' })
    }
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

  return (
    <>
      <div className="flex items-center justify-between px-4 lg:px-6 py-2 border-b border-border bg-bg-surface/80 shrink-0">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span className="size-2 rounded-full bg-green-500" />
          <span className="font-body">{usuario?.nombre} <span className="text-text-tertiary">({usuario?.rol})</span></span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMostrarSwitchUser(true)}
            className="text-xs text-text-secondary hover:text-pos-accent transition-colors cursor-pointer border border-border rounded-lg px-3 py-1.5 hover:border-pos-accent"
          >
            Cambiar usuario
          </button>
        </div>
      </div>

      <div
        className="flex flex-col lg:grid lg:grid-cols-[1fr_max-w-md] xl:grid-cols-[1fr_420px] gap-6 h-full overflow-hidden pb-16 lg:pb-0"
      >
        {/* LEFT COLUMN */}
        <div className={`flex flex-col overflow-hidden min-h-0 px-4 lg:pl-6 lg:pr-0 lg:py-6 ${mobileTab === 'ticket' ? 'hidden md:flex' : ''}`}>
          {!ordenActiva ? (
            <>
              {/* Modo toggle */}
              <div className="flex flex-wrap items-center justify-end gap-2 mb-4 lg:mb-6 shrink-0">
                <div className="flex items-center gap-1.5 lg:gap-2">
                  <button
                    onClick={() => setModo('mesa')}
                    className={`h-9 px-3.5 rounded-[10px] text-[13px] font-medium transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                      modo === 'mesa'
                        ? 'bg-pos-accent text-white border-transparent shadow-[0_8px_18px_rgba(199,102,46,0.22)]'
                        : 'bg-white text-pos-text border border-pos-border'
                    }`}
                  >
                    <Icon name="table" className="size-3.5" />
                    Mesas
                  </button>
                  <button
                    onClick={iniciarRapido}
                    className={`h-9 px-3.5 rounded-[10px] text-[13px] font-medium transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                      modo === 'rapido'
                        ? 'bg-pos-accent text-white border-transparent'
                        : 'bg-white text-pos-text border border-pos-border'
                    }`}
                  >
                    <Icon name="shopping-cart" className="size-3.5" />
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
                    <p className="text-base text-pos-text-secondary">
                      Inicia una venta rápida sin mesa asignada
                    </p>
                    <button
                      onClick={iniciarRapido}
                      className="h-11 px-6 rounded-xl bg-pos-accent text-white text-base font-semibold cursor-pointer hover:bg-pos-accent-hover transition-colors"
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
                  className="flex items-center gap-1.5 text-[13px] font-medium text-pos-text-secondary cursor-pointer hover:text-pos-accent transition-colors"
                >
                  <Icon name="arrow-left" className="size-4" />
                  {modo === 'rapido' ? 'Nueva venta' : 'Cambiar mesa'}
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ProductGrid
                  onSelectProducto={handleSelectProducto}
                  onSelectCombo={handleSelectCombo}
                  onLongPressProducto={handleLongPressProducto}
                />
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className={`flex flex-col overflow-hidden min-h-0 px-4 lg:pl-0 lg:pr-6 lg:py-6 ${mobileTab === 'productos' ? 'hidden md:flex' : ''}`}>
          {ordenActiva ? (
            <div className="flex-1 overflow-y-auto">
              <TicketPanel
                key={ordenActiva.id}
                orden={ordenActiva}
                onEliminarItem={handleEliminarItem}
                onModificarItem={(item) => setCustomizingItem(item)}
                onEnviarCocina={() => ordenActiva && cocinaMutation.mutate(ordenActiva.id)}
                onPagar={() => setMostrarPayment(true)}
                onDescuento={(pct) => ordenActiva && descuentoMutation.mutate(pct)}
                onGuardarNotas={(n) => notasMutation.mutate(n)}
                onSolicitarAutorizacion={handleAutorizarEliminacion}
                onLiberarMesa={handleLiberarMesa}
                onImprimirPreCuenta={handleImprimirPreCuenta}
                onActualizarPropina={(pct) => ordenActiva && propinaMutation.mutate(pct)}
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

      {/* Mobile bottom tabs */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-border flex items-center justify-around h-14 px-2 pb-1">
          <button
            onClick={() => setMobileTab('productos')}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-lg transition-colors ${
              mobileTab === 'productos' ? 'text-pos-accent bg-pos-accent/5' : 'text-text-secondary'
            }`}
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-[10px] font-semibold">Ticket</span>
            {ordenActiva && ordenActiva.items.length > 0 && (
              <span className="absolute -top-0.5 right-1/4 min-w-[18px] h-[18px] rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center px-1">
                {ordenActiva.items.reduce((s, i) => s + i.cantidad, 0)}
              </span>
            )}
          </button>
        </div>

      {ordenActiva && (
        <PaymentPanel
          open={mostrarPayment}
          onClose={() => setMostrarPayment(false)}
          orden={ordenActiva}
          onConfirmar={(pdata) => pagarMutation.mutate(pdata)}
          loading={pagarMutation.isPending}
        />
      )}

      <ModifierPanel
        open={!!modifierProducto}
        onClose={() => setModifierProducto(null)}
        producto={modifierProducto}
        onConfirm={handleModifierConfirm}
      />

      <ItemCustomizer
        open={!!customizingItem}
        onClose={() => setCustomizingItem(null)}
        item={customizingItem}
        onSave={(modificaciones, notas) => {
          if (customizingItem) {
            modificarItemMutation.mutate({ itemId: customizingItem.id, modificaciones, notas })
          }
        }}
      />

      <GerentePinModal
        open={!!autorizandoItemId}
        tenantId={tenantId ?? ''}
        onAuthorized={handlePinAuthorized}
        onClose={() => setAutorizandoItemId(null)}
      />

      <SwitchUserModal
        open={mostrarSwitchUser}
        onClose={() => setMostrarSwitchUser(false)}
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

