import { useQuery } from '@tanstack/react-query'
import { queryDefaults } from '../../../config/queries'
import { useAuthStore } from '../../../store/authStore'
import { useNavigate } from 'react-router-dom'
import { getCajaActiva, getResumenDiario } from '../../admin/caja/api'
import { getMesas, getOrdenes } from '../api'
import { useMemo } from 'react'

interface ResumenDiario {
  total_ventas?: number
  total_efectivo?: number
  total_tarjeta?: number
  cantidad_ordenes?: number
  ticket_promedio?: number
  clientes_atendidos?: number
}

function StatusBox({
  label,
  count,
  color,
  pulse,
}: {
  label: string
  count: number
  color: string
  pulse?: boolean
}) {
  return (
    <div className={`rounded-xl border ${color} p-3 flex flex-col gap-1`}>
      <span className={`text-2xl font-display font-bold ${pulse ? 'animate-pulse' : ''}`}>
        {count}
      </span>
      <span className="text-[11px] font-body uppercase tracking-wider opacity-80">
        {label}
      </span>
    </div>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-text-secondary font-body">{label}</span>
      <span className="text-sm font-mono text-text-primary font-semibold">{value}</span>
    </div>
  )
}

export function RestaurantSummary() {
  const navigate = useNavigate()
  const usuario = useAuthStore((s) => s.usuario)

  const { data: mesas } = useQuery({
    queryKey: ['mesas'],
    queryFn: getMesas,
    ...queryDefaults('mesas'),
  })

  const { data: ordenes } = useQuery({
    queryKey: ['ordenes'],
    queryFn: () => getOrdenes(),
    ...queryDefaults('ordenes'),
  })

  const { data: cajaActiva } = useQuery({
    queryKey: ['caja-activa'],
    queryFn: getCajaActiva,
    ...queryDefaults('caja-activa'),
  })

  const { data: resumen } = useQuery({
    queryKey: ['caja-resumen-diario'],
    queryFn: () => getResumenDiario() as unknown as ResumenDiario,
    ...queryDefaults('caja-resumen'),
  })

  const { libres, ocupadas, pendientes } = useMemo(() => {
    const total = (ordenes ?? []).filter(
      (o) => o.estado !== 'pagada' && o.estado !== 'cancelada'
    ).length
    const pends = (ordenes ?? []).filter(
      (o) =>
        o.estado !== 'pagada' &&
        o.estado !== 'cancelada' &&
        o.items.length > 0 &&
        o.items.every((i) => i.estado === 'listo')
    ).length
    return {
      libres: (mesas ?? []).filter((m) => m.activo).length - total,
      ocupadas: total - pends,
      pendientes: pends,
    }
  }, [mesas, ordenes])

  return (
    <div className="h-full flex flex-col bg-bg-surface rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border shrink-0">
        <h2 className="font-display text-xs uppercase tracking-widest text-text-secondary">
          Resumen
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status grid */}
        <div className="grid grid-cols-2 gap-2">
          <StatusBox
            label="Libres"
            count={libres}
            color="border-status-libre/30 bg-status-libre/[0.06] text-status-libre"
          />
          <StatusBox
            label="Ocupadas"
            count={ocupadas}
            color="border-status-ocupada/30 bg-status-ocupada/[0.06] text-status-ocupada"
          />
          <StatusBox
            label="P/Pago"
            count={pendientes}
            color="border-status-pendiente/30 bg-status-pendiente/[0.06] text-status-pendiente"
            pulse={pendientes > 0}
          />
          <StatusBox
            label="Reservadas"
            count={0}
            color="border-status-reservada/30 bg-status-reservada/[0.06] text-status-reservada"
          />
        </div>

        {/* Caja status */}
        <div className="rounded-xl border border-border p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-body text-text-secondary uppercase tracking-wider">
              Caja
            </span>
            <span
              className={`text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full ${
                cajaActiva?.estado === 'abierta'
                  ? 'bg-status-libre/10 text-status-libre border border-status-libre/30'
                  : 'bg-status-pendiente/10 text-status-pendiente border border-status-pendiente/30'
              }`}
            >
              {cajaActiva?.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
            </span>
          </div>
          {cajaActiva?.estado === 'abierta' && (
            <div className="font-mono text-lg font-bold text-accent text-center">
              Caja abierta
            </div>
          )}
        </div>

        {/* Sales metrics */}
        <div className="rounded-xl border border-border p-3 space-y-0.5">
          <span className="text-[11px] font-body text-text-secondary uppercase tracking-wider block mb-2">
            Ventas del día
          </span>
          <MetricRow
            label="Total"
            value={resumen?.total_ventas != null ? `$${resumen.total_ventas.toFixed(2)}` : '...'}
          />
          <MetricRow
            label="Ticket promedio"
            value={resumen?.ticket_promedio != null ? `$${resumen.ticket_promedio.toFixed(2)}` : '-'}
          />
          <MetricRow
            label="Clientes"
            value={resumen?.clientes_atendidos != null ? String(resumen.clientes_atendidos) : '-'}
          />
          <MetricRow
            label="Órdenes"
            value={resumen?.cantidad_ordenes != null ? String(resumen.cantidad_ordenes) : '-'}
          />
        </div>

        {/* User info */}
        {usuario && (
          <div className="flex items-center gap-3 px-1 py-2">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-display text-sm font-bold shrink-0">
              {usuario.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-body text-text-primary truncate">{usuario.nombre}</p>
              <p className="text-[10px] font-mono text-text-secondary capitalize">{usuario.rol}</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="shrink-0 border-t border-border p-3 space-y-2">
        {cajaActiva?.estado === 'abierta' ? (
          <button
            onClick={() => navigate('/admin/caja')}
            className="w-full text-xs py-2.5 rounded-xl bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 transition-all duration-200 font-semibold cursor-pointer"
          >
            Ir a Caja
          </button>
        ) : (
          <button
            onClick={() => navigate('/admin/caja')}
            className="w-full text-xs py-2.5 rounded-xl bg-bg-primary text-text-secondary border border-border hover:text-text-primary hover:border-accent/50 transition-all duration-200 font-semibold cursor-pointer"
          >
            Abrir Caja
          </button>
        )}
      </div>
    </div>
  )
}
