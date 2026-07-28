import { useQuery } from '@tanstack/react-query'
import { queryDefaults } from '../../config/queries'
import { getDashboardMetrics, getMesas, getTopProductos, getVentasPorHora, getAlertas } from './api'
import type { DashboardAlerta } from './api'
import { obtenerResumen } from '../admin/inventario/api'
import { useCajaActiva } from '../../hooks/useCajaActiva'
import { MetricsSection } from './components/MetricsSection'
import { OperationalStatus } from './components/OperationalStatus'
import { ProductPerformance } from './components/ProductPerformance'
import { TrendsSection } from './components/TrendsSection'
import { AlertsSection } from './components/AlertsSection'
import { PageHeader } from '../../components/shared/PageHeader'
import { Spinner } from '../../components/ui/Spinner'
import { useAuthStore } from '../../store/authStore'

export default function DashboardPage() {
  const sucursalId = useAuthStore((s) => s.sucursalId)
  const { caja } = useCajaActiva()

  const { data: metrics, isLoading: mLoading } = useQuery({
    queryKey: ['dashboard-metrics', sucursalId],
    queryFn: getDashboardMetrics,
    ...queryDefaults('dashboard-metrics'),
  })

  const { data: mesas } = useQuery({
    queryKey: ['mesas', sucursalId],
    queryFn: getMesas,
    ...queryDefaults('mesas'),
  })

  const { data: productos, isLoading: pLoading } = useQuery({
    queryKey: ['dashboard-top-productos'],
    queryFn: getTopProductos,
    ...queryDefaults('dashboard-top-productos'),
  })

  const { data: ventasPorHora, isLoading: vLoading } = useQuery({
    queryKey: ['dashboard-ventas-hora', sucursalId],
    queryFn: getVentasPorHora,
    ...queryDefaults('dashboard-ventas-hora'),
  })

  const { data: inventario } = useQuery({
    queryKey: ['inventario-resumen'],
    queryFn: obtenerResumen,
    ...queryDefaults('inventario-resumen'),
  })

  const alertas: DashboardAlerta[] = [
    ...(inventario?.alertas_count && inventario.alertas_count > 0
      ? [{
          id: 'stock-bajo',
          severity: 'critical' as const,
          icon: '📦',
          titulo: 'Stock bajo de ingredientes',
          descripcion: `${inventario.alertas_count} productos tienen stock por debajo del mínimo. Revisa inventario.`,
          accion: { label: 'Ver inventario', ruta: '/admin/inventario' },
        }]
      : []),
    ...getAlertas().slice(1),
  ]

  if (mLoading || pLoading || vLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="dashboard-bg-cream min-h-full p-4 sm:p-6">
      <PageHeader
        title="Dashboard"
        subtitle="Resumen operativo del día"
      />

      <div className="flex flex-col gap-4">
        <MetricsSection
          ventas_hoy={metrics?.ventas_hoy ?? 0}
          ticket_promedio={metrics?.ticket_promedio ?? 0}
          ordenes_hoy={metrics?.ordenes_hoy ?? 0}
          clientes_hoy={metrics?.clientes_hoy ?? 0}
          trend_ventas={metrics?.trend_ventas ?? 0}
          trend_ordenes={metrics?.trend_ordenes ?? 0}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <OperationalStatus
            mesas={mesas ?? []}
            cajaEstado={caja?.estado ?? 'cerrada'}
            cajaVentas={caja?.total_ventas ?? 0}
          />
          <ProductPerformance productos={productos ?? []} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TrendsSection ventasPorHora={ventasPorHora ?? []} />
          <AlertsSection alertas={alertas} />
        </div>
      </div>
    </div>
  )
}
