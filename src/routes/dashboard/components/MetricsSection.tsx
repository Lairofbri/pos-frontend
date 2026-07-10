import { DashboardCard } from '../../../components/shared/DashboardCard'
import { MetricValue } from '../../../components/shared/MetricValue'

interface MetricsSectionProps {
  ventas_hoy: number
  ticket_promedio: number
  ordenes_hoy: number
  clientes_hoy: number
  trend_ventas: number
  trend_ordenes: number
}

export function MetricsSection({ ventas_hoy, ticket_promedio, ordenes_hoy, clientes_hoy, trend_ventas, trend_ordenes }: MetricsSectionProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <DashboardCard>
        <MetricValue
          value={`$${ventas_hoy.toFixed(2)}`}
          label="Ventas hoy"
          trend={{ value: `${trend_ventas}%`, up: trend_ventas >= 0 }}
        />
      </DashboardCard>
      <DashboardCard>
        <MetricValue
          value={`$${ticket_promedio.toFixed(2)}`}
          label="Ticket promedio"
          prefix="ø"
        />
      </DashboardCard>
      <DashboardCard>
        <MetricValue
          value={ordenes_hoy.toString()}
          label="Órdenes hoy"
          trend={{ value: `${trend_ordenes}%`, up: trend_ordenes >= 0 }}
        />
      </DashboardCard>
      <DashboardCard>
        <MetricValue
          value={clientes_hoy.toString()}
          label="Clientes atendidos"
        />
      </DashboardCard>
    </div>
  )
}
