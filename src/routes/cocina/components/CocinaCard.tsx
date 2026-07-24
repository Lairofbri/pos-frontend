import { useState, useEffect, useMemo } from 'react'
import { Gift, Printer, X } from 'lucide-react'
import type { ItemCocina } from '../api'

interface CocinaCardProps {
  item: {
    orden_id: string
    numero_orden: number
    orden_estado: string
    mesa_numero: number | null
    mesa_nombre: string | null
    items: ItemCocina[]
  }
  onMarcarListo: (ordenId: string, itemId: string) => void
  onCompletada: (ordenId: string) => void
  onImprimir: (ordenId: string) => void
}

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pendiente: { label: 'Pendiente', color: '#4E9AD4', bg: 'bg-blue-500/10', dot: 'bg-blue-500' },
  en_proceso: { label: 'Cocinando', color: '#D97A43', bg: 'bg-orange-500/10', dot: 'bg-orange-500' },
  listo: { label: 'Listo', color: '#4A9D6E', bg: 'bg-green-500/10', dot: 'bg-green-500' },
  cancelado: { label: 'Cancelado', color: '#8C8177', bg: 'bg-gray-500/10', dot: 'bg-gray-400' },
}

function TimerDisplay({ baseMinutes, done }: { baseMinutes: number; done?: boolean }) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick(prev => prev + 1), 60000)
    return () => clearInterval(interval)
  }, [])

  const elapsed = done ? baseMinutes : baseMinutes + tick

  const minutes = elapsed
  const isOverdue = minutes > 20
  const isCritical = minutes > 30

  const display = minutes < 60
    ? `${minutes}min`
    : `${Math.floor(minutes / 60)}h ${minutes % 60}m`

  return (
    <span className={`font-mono text-sm font-bold tracking-tight ${
      done
        ? 'text-green-500'
        : isCritical
        ? 'text-red-500 animate-pulse'
        : isOverdue
        ? 'text-orange-500'
        : 'text-text-secondary'
    }`}>
      {done ? `✓ ${display}` : display}
    </span>
  )
}

function ItemRow({ item, ordenId, onMarcarListo, esCombo }: {
  item: ItemCocina
  ordenId: string
  onMarcarListo: (ordenId: string, itemId: string) => void
  esCombo?: boolean
}) {
  const cfg = ESTADO_CONFIG[item.estado] ?? ESTADO_CONFIG.pendiente
  const isFinal = item.estado === 'listo' || item.estado === 'cancelado'

  return (
    <div className={`flex items-center gap-2 py-1.5 ${esCombo ? 'pl-5' : ''}`}>
      <span className={`size-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      <span className="font-mono text-sm font-bold text-text-primary tabular-nums w-8 shrink-0 text-right">
        {item.cantidad}x
      </span>
      <span className="flex-1 text-sm font-medium text-text-primary truncate">
        {item.nombre_producto}
      </span>
      <button
        onClick={() => onMarcarListo(ordenId, item.id)}
        disabled={isFinal}
        className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
          item.estado === 'listo'
            ? 'bg-green-500/10 text-green-600 border-green-500/30 dark:text-green-400'
            : item.estado === 'cancelado'
            ? 'border-text-secondary text-text-secondary'
            : 'border-accent/40 text-accent hover:bg-accent hover:text-white'
        }`}
      >
        {item.estado === 'listo' ? 'Hecho' : item.estado === 'cancelado' ? <X className="size-3" /> : 'Listo'}
      </button>
    </div>
  )
}

export function CocinaCard({ item, onMarcarListo, onCompletada, onImprimir }: CocinaCardProps) {
  const grouped = useMemo(() => {
    const normales: ItemCocina[] = []
    const combos: Record<string, { nombre: string; items: ItemCocina[] }> = {}
    for (const i of item.items) {
      if (i.combo_id) {
        if (!combos[i.combo_id]) combos[i.combo_id] = { nombre: i.combo_nombre ?? 'Combo', items: [] }
        combos[i.combo_id].items.push(i)
      } else {
        normales.push(i)
      }
    }
    return { normales, combos: Object.values(combos) }
  }, [item.items])

  const itemsPendientes = useMemo(() => item.items.filter(i => i.estado === 'pendiente'), [item])
  const itemsEnProceso = useMemo(() => item.items.filter(i => i.estado === 'en_proceso'), [item])
  const itemsListos = useMemo(() => item.items.filter(i => i.estado === 'listo'), [item])

  const ordenLista = item.orden_estado === 'lista'
  const allDone = ordenLista || (itemsPendientes.length === 0 && itemsEnProceso.length === 0)
  const total = item.items.length

  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(interval)
  }, [])

  const tiempoBase = item.items.length > 0
    ? Math.floor((now - new Date(item.items[0].enviado_en).getTime()) / 60000)
    : 0

  return (
    <div className="bg-bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className={`px-4 py-3 flex items-center justify-between border-b border-border/60 ${
        allDone ? 'bg-green-500/5' : itemsPendientes.length > 0 ? 'bg-blue-500/5' : 'bg-orange-500/5'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider font-display shrink-0">
            #{item.numero_orden}
          </span>
          <span className="font-display text-base font-bold text-text-primary truncate">
            {item.mesa_numero ? `Mesa ${item.mesa_numero}${item.mesa_nombre ? ` · ${item.mesa_nombre}` : ''}` : 'Venta rápida'}
          </span>
          {ordenLista && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 shrink-0">
              Lista
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <TimerDisplay key={tiempoBase} baseMinutes={tiempoBase} done={allDone} />
        </div>
      </div>

      <div className="px-4 py-2 divide-y divide-border/20">
        {grouped.combos.map((combo) => (
          <div key={combo.nombre} className="py-1">
            <div className="flex items-center gap-1.5 px-1 py-1 mb-0.5">
              <Gift className="size-3.5 text-pos-accent" />
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">{combo.nombre}</span>
            </div>
            {combo.items.map((i) => (
              <ItemRow key={i.id} item={i} ordenId={item.orden_id} onMarcarListo={onMarcarListo} esCombo />
            ))}
          </div>
        ))}
        {grouped.normales.map((i) => (
          <div key={i.id} className="py-0.5">
            <ItemRow item={i} ordenId={item.orden_id} onMarcarListo={onMarcarListo} />
          </div>
        ))}
      </div>

      <div className="px-4 py-2.5 flex items-center justify-between border-t border-border/60 bg-bg-primary/50">
        <div className="flex items-center gap-2 text-[11px] text-text-secondary font-medium">
          <span>{total} {total === 1 ? 'item' : 'items'}</span>
          {itemsPendientes.length > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
              {itemsPendientes.length} pend.
            </span>
          )}
          {itemsEnProceso.length > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold">
              {itemsEnProceso.length} en cocina
            </span>
          )}
          {itemsListos.length > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 font-semibold">
              {itemsListos.length} listos
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onImprimir(item.orden_id)}
            className="text-xs px-2 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-accent/50 transition-all cursor-pointer"
            title="Imprimir ticket"
          >
            <Printer className="size-4" />
          </button>
          {!ordenLista && (
            <button
              onClick={() => onCompletada(item.orden_id)}
              disabled={itemsPendientes.length > 0}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-accent text-white hover:bg-accent-dark transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {allDone ? 'Marcar Lista' : 'Completada'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
