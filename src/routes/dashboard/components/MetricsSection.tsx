import { CountUp } from './CountUp'
import { DashboardCard } from '../../../components/shared/DashboardCard'

export interface MetricasReales {
  ventas_hoy: number
  promedio_persona: number
  ordenes_hoy: number
  personas_hoy: number
  food_cost_pct: number
  margen_bruto: number
  trend_ventas: number | null
  trend_ordenes: number | null
  trend_personas: number | null
}

interface MetricsSectionProps {
  metrics: MetricasReales
}

function MetricCard({ value, label, prefix, trend }: {
  value: number
  label: string
  prefix?: string
  trend?: { pct: number; up: boolean } | null
}) {
  return (
    <DashboardCard>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-baseline gap-1">
          {prefix && <span className="text-sm font-semibold text-text-secondary">{prefix}</span>}
          <span className="dashboard-metric-value">
            <CountUp end={value} prefix={prefix ? '' : '$'} decimals={2} />
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary font-body">{label}</span>
          {trend && (
            <span className={`text-xs font-semibold font-mono ${trend.up ? 'dashboard-trend-up' : 'dashboard-trend-down'}`}>
              {trend.up ? '\u2191' : '\u2193'} {trend.pct.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </DashboardCard>
  )
}

export function MetricsSection({ metrics }: MetricsSectionProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <MetricCard
        value={metrics.ventas_hoy}
        label="Ventas hoy"
        trend={metrics.trend_ventas != null ? { pct: Math.abs(metrics.trend_ventas), up: metrics.trend_ventas >= 0 } : null}
      />
      <MetricCard
        value={metrics.promedio_persona}
        label="Promedio / persona"
      />
      <MetricCard
        value={metrics.ordenes_hoy}
        label="Órdenes hoy"
        trend={metrics.trend_ordenes != null ? { pct: Math.abs(metrics.trend_ordenes), up: metrics.trend_ordenes >= 0 } : null}
      />
      <MetricCard
        value={metrics.personas_hoy}
        label="Personas"
        trend={metrics.trend_personas != null ? { pct: Math.abs(metrics.trend_personas), up: metrics.trend_personas >= 0 } : null}
      />
      <MetricCard
        value={metrics.food_cost_pct}
        label="Food cost %"
        prefix=""
      />
      <MetricCard
        value={metrics.margen_bruto}
        label="Margen bruto"
      />
    </div>
  )
}
