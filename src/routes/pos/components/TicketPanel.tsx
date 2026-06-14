import { useState, useMemo, useEffect } from 'react'
import type { Orden } from '../../../types'
import { Button } from '../../../components/ui/Button'
import { printOrden } from '../../../components/shared/PrintTicket'

interface TicketPanelProps {
  orden: Orden
  onEliminarItem: (itemId: string) => void
  onEnviarCocina: () => void
  onPagar: () => void
  onDescuento?: (pct: number) => void
  onGuardarNotas?: (notas: string) => void
  onSolicitarAutorizacion?: (itemId: string) => void
  onLiberarMesa?: () => void
  enviando?: boolean
}

const ESTADO_ORDEN_CONFIG: Record<string, { label: string; color: string }> = {
  abierta: { label: 'Abierta', color: 'bg-accent/10 text-accent border-accent/30' },
  en_proceso: { label: 'En cocina', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  lista: { label: 'Lista', color: 'bg-status-libre/10 text-status-libre border-status-libre/30' },
  entregada: { label: 'Entregada', color: 'bg-status-libre/10 text-status-libre border-status-libre/30' },
  pagada: { label: 'Pagada', color: 'bg-status-libre/10 text-status-libre border-status-libre/30' },
  cancelada: { label: 'Cancelada', color: 'bg-status-pendiente/10 text-status-pendiente border-status-pendiente/30' },
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
  onSolicitarAutorizacion,
  onLiberarMesa,
  enviando,
}: TicketPanelProps) {
  const [descuentoInput, setDescuentoInput] = useState('')
  const [notasTexto, setNotasTexto] = useState('')
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(() => Date.now()), 30000)
    return () => clearInterval(id)
  }, [])

  const tieneItemsPendientes = (orden.items ?? []).some((i) => i.estado === 'pendiente')

  const elapsed = useMemo(
    () => Math.floor((now - new Date(orden.created_at).getTime()) / 60000),
    [now, orden.created_at]
  )

  const estadoCfg = ESTADO_ORDEN_CONFIG[orden.estado] ?? { label: orden.estado, color: 'bg-bg-surface text-text-secondary border-border' }

  const descuentoPct = orden.porcentaje_descuento ?? 0
  let subtotal = 0
  for (const item of orden.items) {
    const descItem = item.descuento_porcentaje ?? 0
    const precioConDesc = Math.round(item.precio_unitario * item.cantidad * (1 - descItem / 100) * 100) / 100
    subtotal += precioConDesc
  }
  const descuentoMonto = subtotal * (descuentoPct / 100)
  const totalConDescuento = subtotal - descuentoMonto

  const handleDescuentoApply = () => {
    const pct = parseFloat(descuentoInput)
    if (isNaN(pct) || pct < 0 || pct > 100) return
    onDescuento?.(pct)
    setDescuentoInput('')
  }

  return (
    <div className="h-full flex flex-col bg-bg-surface rounded-xl border border-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg text-text-primary">
              {orden.mesa_numero ? `Mesa ${orden.mesa_numero}` : 'Venta Rápida'}
            </span>
            <span className={`text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full border ${estadoCfg.color}`}>
              {estadoCfg.label}
            </span>
          </div>
          <span className="text-xs font-mono text-text-secondary bg-bg-primary px-2 py-1 rounded-lg border border-border/50">
            ⏱ {formatTiempo(elapsed)}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-text-secondary font-body uppercase tracking-wider">{orden.zona}</span>
          <div className="text-right text-text-secondary font-body">
            {orden.usuario_nombre && <span>{orden.usuario_nombre}</span>}
            {orden.cliente_nombre && <span className="ml-2">{orden.cliente_nombre}</span>}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
        {orden.items.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-8 font-body">Agrega productos tocándolos</p>
        ) : (
          orden.items.map((item) => {
            const descItem = item.descuento_porcentaje ?? 0
            const precioLinea = Math.round(item.precio_unitario * item.cantidad * (1 - descItem / 100) * 100) / 100
            const locked = item.estado !== 'pendiente'

            return (
              <div key={item.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-bg-primary border border-border/50 hover:border-border transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-text-secondary font-semibold w-6 text-right">{item.cantidad}x</span>
                    <span className="text-sm font-body text-text-primary truncate">{item.nombre}</span>
                    {descItem > 0 && <span className="text-[10px] text-danger bg-danger/10 px-1.5 py-0.5 rounded font-mono">-{descItem}%</span>}
                    {locked && (
                      <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded font-mono">
                        {item.estado === 'en_proceso' ? 'Cocina' : item.estado === 'listo' ? 'Listo' : item.estado}
                      </span>
                    )}
                  </div>
                  {item.notas && <p className="text-[11px] text-text-secondary mt-0.5 italic truncate">{item.notas}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-sm font-mono text-text-primary font-semibold">${precioLinea.toFixed(2)}</span>
                  {locked ? (
                    <button
                      onClick={() => onSolicitarAutorizacion?.(item.id)}
                      className="text-text-secondary hover:text-accent transition-colors cursor-pointer text-xs px-1"
                      title="Requiere autorización de gerente"
                    >
                      🔓
                    </button>
                  ) : (
                    <button
                      onClick={() => onEliminarItem(item.id)}
                      className="text-text-secondary hover:text-danger transition-colors cursor-pointer text-xs px-1"
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border shrink-0 space-y-2">
        {onGuardarNotas && (
          <textarea
            value={notasTexto}
            onChange={(e) => setNotasTexto(e.target.value)}
            onBlur={() => notasTexto !== (orden.notas ?? '') && onGuardarNotas(notasTexto)}
            placeholder="Notas para la orden..."
            rows={2}
            className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-xs text-text-primary font-body placeholder:text-text-secondary/50 outline-none focus:border-accent resize-none transition-colors"
          />
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs font-body text-text-secondary">Subtotal</span>
          <span className="text-sm font-mono text-text-primary">${subtotal.toFixed(2)}</span>
        </div>

        {descuentoPct > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs font-body text-danger">Descuento Gral ({descuentoPct}%)</span>
            <span className="text-sm font-mono text-danger">-${descuentoMonto.toFixed(2)}</span>
          </div>
        )}

        {onDescuento && (
          <div className="flex items-center gap-2">
            <input
              type="number" min="0" max="100" value={descuentoInput}
              onChange={(e) => setDescuentoInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDescuentoApply()}
              placeholder="% desc"
              className="w-20 bg-bg-primary border border-border rounded-lg px-2 py-1.5 text-xs font-mono text-text-primary outline-none focus:border-accent text-center transition-colors"
            />
            <button onClick={handleDescuentoApply} disabled={!descuentoInput} className="text-xs px-2 py-1.5 rounded-lg bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 transition-colors cursor-pointer disabled:opacity-40 font-semibold">Aplicar</button>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-2">
          <span className="text-sm font-body text-text-primary font-semibold">Total</span>
          <span className="text-lg font-mono text-accent font-bold">${(descuentoPct > 0 ? totalConDescuento : subtotal).toFixed(2)}</span>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onEnviarCocina} disabled={!tieneItemsPendientes || enviando} loading={enviando}>
            Enviar Cocina
          </Button>
          <Button variant="ghost" size="sm" onClick={() => printOrden(orden)} disabled={orden.items.length === 0} title="Imprimir ticket">🖨️</Button>
          <Button size="sm" className="flex-1" onClick={onPagar} disabled={orden.items.length === 0 || tieneItemsPendientes}>
            Pagar
          </Button>
        </div>

        {onLiberarMesa && orden.mesa_numero && (
          <button
            onClick={onLiberarMesa}
            className="w-full text-xs py-2 rounded-lg border border-border text-text-secondary hover:text-danger hover:border-danger/50 transition-colors cursor-pointer font-body"
          >
            Liberar mesa
          </button>
        )}
      </div>
    </div>
  )
}
