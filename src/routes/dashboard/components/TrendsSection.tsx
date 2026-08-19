import { useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { DashboardCard } from '../../../components/shared/DashboardCard'
import type { EvolucionRow } from '../api'

interface TrendsSectionProps {
  evolucion: EvolucionRow[]
}

const COPPER = '#C7662E'
const GREEN = '#3A9150'

export function TrendsSection({ evolucion }: TrendsSectionProps) {
  const data = useMemo(() =>
    evolucion.map(e => ({
      fecha: new Date(e.fecha + 'T12:00:00').toLocaleDateString('es-SV', { weekday: 'short', day: 'numeric' }),
      ingresos: e.ingresos,
      margen: e.margen_bruto,
    })),
  [evolucion])

  const total = evolucion.reduce((s, e) => s + e.ingresos, 0)
  const mejor = useMemo(() => {
    if (evolucion.length === 0) return null
    return [...evolucion].sort((a, b) => b.ingresos - a.ingresos)[0]
  }, [evolucion])

  if (evolucion.length === 0) {
    return (
      <DashboardCard title="Evolución 7 días">
        <div className="flex flex-col items-center py-8 text-text-secondary">
          <span className="text-xs">Sin datos disponibles</span>
        </div>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard title="Evolución 7 días">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-ingresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COPPER} stopOpacity={0.15} />
              <stop offset="100%" stopColor={COPPER} stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="grad-margen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GREEN} stopOpacity={0.15} />
              <stop offset="100%" stopColor={GREEN} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#E8D6C0" strokeDasharray="3 3" strokeOpacity={0.5} />
          <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#8C8177' }} axisLine={{ stroke: '#E8D6C0' }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#8C8177' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} />
          <Tooltip
            contentStyle={{
              background: '#FAF6F1',
              border: '1px solid #E8D6C0',
              borderRadius: 12,
              fontSize: 12,
              boxShadow: '0 4px 12px rgba(70,55,40,0.1)',
            }}
            formatter={(value) => [`$${Number(value).toFixed(2)}`, undefined]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            iconType="circle"
            iconSize={8}
          />
          <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke={COPPER} strokeWidth={2} fill="url(#grad-ingresos)" />
          <Area type="monotone" dataKey="margen" name="Margen" stroke={GREEN} strokeWidth={2} fill="url(#grad-margen)" />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="text-xs text-text-secondary">
          Mejor día:{' '}
          <span className="font-semibold text-text-primary">
            {mejor ? new Date(mejor.fecha + 'T12:00:00').toLocaleDateString('es-SV', { day: 'numeric', month: 'short' }) : '—'}
          </span>
          {mejor && (
            <span className="font-semibold font-mono text-pos-accent ml-1">${mejor.ingresos.toFixed(2)}</span>
          )}
        </div>
        <div className="text-xs text-text-secondary">
          Total 7d: <span className="font-semibold font-mono text-text-primary">${total.toFixed(2)}</span>
        </div>
      </div>
    </DashboardCard>
  )
}
