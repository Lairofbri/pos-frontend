import { useState, useMemo, useEffect, useRef } from 'react'
import { Unlock, ClipboardList, Printer, Minus } from 'lucide-react'
import { printOrden } from '../../../components/shared/PrintTicket'
import { DTEQR } from './DTEQR'
import { ClientSelector } from './ClientSelector'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import type { Orden, OrdenItem, Cliente } from '../../../types'

interface TicketPanelProps {
  orden: Orden
  onEliminarItem: (itemId: string) => void
  onEnviarCocina: () => void
  onPagar: () => void
  onDescuento?: (pct: number) => void
  onGuardarNotas?: (notas: string) => void
  onModificarItem?: (item: OrdenItem) => void
  onSolicitarAutorizacion?: (itemId: string) => void
  onLiberarMesa?: () => void
  onImprimirPreCuenta?: () => void
  onActualizarPropina?: (pct: number) => void
  enviando?: boolean
  ocultarCocina?: boolean
  separadores: Set<string>
  onAgregarSeparador: () => void
  numPersonas: number
  onCambiarPersonas: (n: number) => void
  clienteNombre?: string
  onAsignarCliente?: (cliente: Cliente | null) => void
}

const ESTADO_LABEL: Record<string, string> = {
  abierta: 'Abierta',
  en_proceso: 'Cocina',
  lista: 'Lista',
  entregada: 'Entregada',
  pagada: 'Pagada',
  cancelada: 'Cancelada',
}

function formatTiempo(minutos: number): string {
  if (minutos < 60) return `${minutos} min`
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function TicketPanel({
  orden,
  onEliminarItem,
  onEnviarCocina,
  onPagar,
  onDescuento,
  onGuardarNotas,
  onModificarItem,
  onSolicitarAutorizacion,
  onLiberarMesa,
  onImprimirPreCuenta,
  onActualizarPropina,
  enviando,
  ocultarCocina,
  separadores,
  onAgregarSeparador,
  numPersonas,
  onCambiarPersonas,
  clienteNombre,
  onAsignarCliente,
}: TicketPanelProps) {
  const [descuentoInput, setDescuentoInput] = useState('')
  const [notasTexto, setNotasTexto] = useState('')
  const [mostrarOpciones, setMostrarOpciones] = useState(false)
  const [imprimiendo, setImprimiendo] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const itemsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = setInterval(() => setNow(() => Date.now()), 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    itemsRef.current?.scrollTo({ top: itemsRef.current.scrollHeight, behavior: 'smooth' })
  }, [orden.items.length])

  const tieneItemsPendientes = (orden.items ?? []).some((i) => i.estado === 'pendiente')

  const elapsed = useMemo(
    () => Math.floor((now - new Date(orden.creado_en).getTime()) / 60000),
    [now, orden.creado_en]
  )

  const descuentoPct = orden.porcentaje_descuento
  let subtotal = 0
  for (const item of orden.items) {
    const descItem = item.descuento_porcentaje
    const precioConDesc = Math.round(item.precio_unitario * item.cantidad * (1 - descItem / 100) * 100) / 100
    subtotal = Math.round((subtotal + precioConDesc) * 100) / 100
  }
  const descuentoMonto = subtotal * (descuentoPct / 100)
  const totalConDescuento = subtotal - descuentoMonto
  const propinaPct = orden.propina_porcentaje
  const propinaMonto = orden.propina_monto
  const totalAPagar = totalConDescuento + propinaMonto

  const handleDescuentoApply = () => {
    const pct = parseFloat(descuentoInput)
    if (isNaN(pct) || pct < 0 || pct > 100) return
    onDescuento?.(pct)
    setDescuentoInput('')
  }

  const totalItems = orden.items.reduce((s, i) => s + i.cantidad, 0)

  const itemsAgrupados = useMemo(() => {
    const normales: typeof orden.items = []
    const combos: Record<string, typeof orden.items> = {}
    for (const item of orden.items) {
      if (item.combo_id) {
        if (!combos[item.combo_id]) combos[item.combo_id] = []
        combos[item.combo_id].push(item)
      } else {
        normales.push(item)
      }
    }
    return { normales, combos }
  }, [orden])

  const renderItem = (item: typeof orden.items[0], esCombo = false) => {
    const descItem = item.descuento_porcentaje ?? 0
    const precioLinea = Math.round(item.precio_unitario * item.cantidad * (1 - descItem / 100) * 100) / 100
    const locked = item.estado !== 'pendiente'

    return (
      <div key={item.id}
        className={`flex items-center gap-2 py-1.5 lg:py-2 min-h-0 ${esCombo ? 'pl-4' : ''} ${onModificarItem && !item.combo_id ? 'cursor-pointer hover:bg-accent/5 rounded px-1 -mx-1' : ''}`}
        onClick={() => { if (!item.combo_id && !locked) onModificarItem?.(item) }}>
        <span className="text-xs font-mono text-text-secondary font-semibold w-5 shrink-0 text-right tabular-nums">
          {item.cantidad}
        </span>
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          <span className="text-sm font-body text-text-primary truncate">{item.nombre}</span>
          {descItem > 0 && (
            <span className="text-[9px] text-danger bg-danger/10 px-1 py-[1px] rounded font-mono shrink-0">-{descItem}%</span>
          )}
          {locked && (
            <span className="text-[9px] text-blue-400 bg-blue-500/10 px-1 py-[1px] rounded font-mono shrink-0">
              {item.estado === 'en_proceso' ? 'Cocina' : item.estado === 'listo' ? 'Listo' : item.estado}
            </span>
          )}
        </div>
        <span className="text-xs font-mono text-text-primary font-semibold shrink-0 tabular-nums w-[62px] text-right">
          ${precioLinea.toFixed(2)}
        </span>
        <div className="w-5 shrink-0 flex justify-center">
          {locked ? (
            <button
              onClick={() => onSolicitarAutorizacion?.(item.id)}
              className="text-text-secondary/50 hover:text-accent transition-colors cursor-pointer text-[11px]"
              title="Autorización de gerente"
            >
              <Unlock className="size-3.5" />
            </button>
          ) : (
            <button
              onClick={() => onEliminarItem(item.id)}
              className="text-text-secondary/30 hover:text-danger transition-colors cursor-pointer text-sm leading-none"
              title="Eliminar"
            >
              ×
            </button>
          )}
        </div>
        {item.notas && (
          <p className="text-[10px] text-text-secondary italic truncate col-span-full -mt-1 ml-7">{item.notas}</p>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-bg-surface rounded-xl border border-border">
      {/* Header */}
      <div className="px-3 lg:px-4 py-2 border-b border-border/60 shrink-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-display text-sm lg:text-base text-text-primary truncate">
            {orden.mesa_numero ? `Mesa ${orden.mesa_numero}` : 'Venta Rápida'}
          </span>
          <span className={`text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full border shrink-0 ${
            orden.estado === 'abierta' ? 'bg-accent/10 text-accent border-accent/30' :
            orden.estado === 'en_proceso' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
            orden.estado === 'lista' ? 'bg-status-libre/10 text-status-libre border-status-libre/30' :
            'bg-bg-surface text-text-secondary border-border'
          }`}>
            {ESTADO_LABEL[orden.estado] ?? orden.estado}
          </span>
          {onAsignarCliente && (
            <ClientSelector
              selectedClienteId={orden.cliente_id}
              selectedClienteNombre={clienteNombre || orden.cliente_nombre || 'Consumidor Final'}
              onSelect={onAsignarCliente}
            />
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-text-secondary/60 font-mono">{totalItems} ítems</span>
          <span className="text-[10px] font-mono text-text-secondary bg-bg-primary px-2 py-0.5 rounded-md border border-border/50">
            ⏱ {formatTiempo(elapsed)}
          </span>
        </div>
      </div>

      {/* Items — compact list */}
      <div ref={itemsRef} className="flex-1 overflow-y-auto px-3 lg:px-4 divide-y divide-border/20">
        {orden.items.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-8 font-body">Agrega productos tocándolos</p>
        ) : (
          <>
            {/* Combos agrupados */}
            {Object.entries(itemsAgrupados.combos).map(([comboId, comboItems]) => (
              <div key={comboId} className="py-1">
                <div className="flex items-center gap-2 px-2 py-1 mb-1 rounded-lg bg-wood-light/50 border border-wood-mid/30">
                  <span className="text-sm">🎁</span>
                  <span className="text-xs font-semibold text-pos-text truncate">{comboItems[0]?.combo_nombre || 'Combo'}</span>
                  <span className="text-xs font-mono text-pos-accent font-semibold ml-auto">
                    ${comboItems.reduce((s, i) => s + i.subtotal, 0).toFixed(2)}
                  </span>
                </div>
                {comboItems.map(item => renderItem(item, true))}
              </div>
            ))}
            {/* Items normales con separadores */}
            {itemsAgrupados.normales.map((item) => {
              const result = [renderItem(item)]
              if (separadores.has(item.id)) {
                result.push(
                  <div key={`sep-${item.id}`} className="py-1">
                    <div className="border-t-2 border-dashed border-accent/30" />
                  </div>,
                )
              }
              return result
            })}
          </>
        )}
      </div>

      {/* Footer — compact */}
      <div className="border-t border-border/60 shrink-0">
        {/* Notes — 1 row, no space waste */}
        {onGuardarNotas && (
          <div className="px-3 lg:px-4 pt-2 pb-1">
            <Textarea
              value={notasTexto}
              onChange={(e) => setNotasTexto(e.target.value)}
              onBlur={() => notasTexto !== (orden.notas ?? '') && onGuardarNotas(notasTexto)}
              placeholder="Notas para la orden..."
              rows={1}
              className="min-h-[28px] text-[11px]"
            />
          </div>
        )}

        {/* Totals */}
        <div className="px-3 lg:px-4 py-2 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-secondary">Subtotal</span>
            <span className="text-xs font-mono text-text-primary tabular-nums">${subtotal.toFixed(2)}</span>
          </div>

          {descuentoPct > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-danger">Dto. ({descuentoPct}%)</span>
              <span className="text-xs font-mono text-danger tabular-nums">-${descuentoMonto.toFixed(2)}</span>
            </div>
          )}

          {onDescuento && (
            <div className="flex items-center gap-1.5">
              <Input
                type="number" min="0" max="100" value={descuentoInput}
                onChange={(e) => setDescuentoInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDescuentoApply()}
                placeholder="%"
                className="w-14 text-center [&>input]:text-center"
              />
              <button onClick={handleDescuentoApply} disabled={!descuentoInput} className="text-[10px] px-1.5 py-1 rounded-md bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-colors cursor-pointer disabled:opacity-40 font-semibold">Aplicar</button>
            </div>
          )}

          {onActualizarPropina && orden.estado !== 'pagada' && orden.estado !== 'cancelada' && (
            <div className="flex items-center gap-1 pt-1">
              {[0, 10, 15, 20].map(pct => (
                <button
                  key={pct}
                  onClick={() => onActualizarPropina(pct)}
                  className={`flex-1 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                    propinaPct === pct
                      ? 'bg-pos-accent/10 text-pos-accent border border-pos-accent/30'
                      : 'bg-bg-primary text-text-secondary border border-border/50 hover:border-pos-accent/40'
                  }`}
                >
                  {pct === 0 ? 'Sin propina' : `${pct}%`}
                </button>
              ))}
            </div>
          )}

          {propinaMonto > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-pos-accent">Propina ({propinaPct}%)</span>
              <span className="text-xs font-mono text-pos-accent tabular-nums">+${propinaMonto.toFixed(2)}</span>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border/40 pt-1.5">
            <span className="text-xs font-body text-text-primary font-semibold">Total a pagar</span>
            <span className="text-base lg:text-lg font-mono text-accent font-bold tabular-nums">${totalAPagar.toFixed(2)}</span>
          </div>
        </div>

        {/* Personas */}
        {onCambiarPersonas && (
          <div className="px-3 lg:px-4 pb-1 flex items-center justify-between">
            <span className="text-[11px] text-text-secondary">Personas</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => numPersonas > 1 && onCambiarPersonas(numPersonas - 1)}
                disabled={numPersonas <= 1}
                className="size-6 flex items-center justify-center rounded border border-border/50 text-text-secondary hover:border-accent/40 hover:text-accent transition-colors cursor-pointer disabled:opacity-30 text-sm"
              >&minus;</button>
              <span className="text-sm font-mono font-semibold text-text-primary tabular-nums w-5 text-center">{numPersonas}</span>
              <button
                onClick={() => onCambiarPersonas(numPersonas + 1)}
                className="size-6 flex items-center justify-center rounded border border-border/50 text-text-secondary hover:border-accent/40 hover:text-accent transition-colors cursor-pointer text-sm"
              >+</button>
              <span className="text-[10px] text-text-secondary/60 font-mono ml-1">
                ${(totalAPagar / numPersonas).toFixed(2)}/pers
              </span>
            </div>
          </div>
        )}

        {/* DTE QR */}
        {orden.estado === 'pagada' && (
          <DTEQR ordenId={orden.id} cerradoEn={orden.cerrado_en} />
        )}

        {/* Action buttons — compact row */}
        <div className="px-3 lg:px-4 pb-2.5 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setMostrarOpciones(!mostrarOpciones)}
            className="h-8 px-2 rounded-lg border border-border/50 text-text-secondary hover:text-text-primary hover:border-border transition-colors cursor-pointer text-xs shrink-0"
            title="Más opciones"
          >
            ⋯
          </button>
          {!ocultarCocina && (
            <button
              onClick={onEnviarCocina}
              disabled={!tieneItemsPendientes || enviando}
              className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                !tieneItemsPendientes || enviando
                  ? 'bg-bg-primary text-text-secondary/40 border border-border/50'
                  : 'bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20'
              }`}
            >
              {enviando ? '...' : 'Cocina'}
            </button>
          )}
          <button
            onClick={onAgregarSeparador}
            className="h-8 px-2 rounded-lg border border-border/50 text-text-secondary hover:text-accent hover:border-accent/40 transition-colors cursor-pointer shrink-0"
            title="Agregar separador visual"
          >
            <Minus className="size-3.5" />
          </button>
          <div className="flex-1" />
          <button
            onClick={() => { setImprimiendo(true); onImprimirPreCuenta?.(); setTimeout(() => setImprimiendo(false), 1000) }}
            disabled={orden.items.length === 0 || imprimiendo}
            className="h-8 px-2 rounded-lg border border-border/50 text-text-secondary hover:text-text-primary hover:border-border transition-colors cursor-pointer text-[10px] disabled:opacity-30 shrink-0"
            title="Imprimir pre-cuenta"
          >
            {imprimiendo ? '...' : <ClipboardList className="size-4" />}
          </button>
          <button
            onClick={() => printOrden(orden)}
            disabled={orden.items.length === 0}
            className="h-8 w-8 rounded-lg border border-border/50 text-text-secondary hover:text-text-primary hover:border-border transition-colors cursor-pointer disabled:opacity-30 shrink-0 flex items-center justify-center"
            title="Imprimir ticket (navegador)"
          >
            <Printer className="size-4" />
          </button>
          <button
            onClick={onPagar}
            disabled={orden.items.length === 0 || (!ocultarCocina && tieneItemsPendientes)}
            className="h-8 px-4 rounded-lg bg-accent text-white text-xs font-bold transition-colors hover:bg-accent-dark cursor-pointer disabled:opacity-40 shrink-0"
          >
            Pagar
          </button>
        </div>

        {/* Expandable extra options */}
        {mostrarOpciones && (
          <div className="px-3 lg:px-4 pb-2.5 flex flex-col gap-1.5">
            {onLiberarMesa && orden.mesa_numero && (
              <button
                onClick={onLiberarMesa}
                className="text-[11px] py-1.5 rounded-lg border border-border/50 text-text-secondary/60 hover:text-danger hover:border-danger/40 transition-colors cursor-pointer font-body"
              >
                Liberar mesa
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

