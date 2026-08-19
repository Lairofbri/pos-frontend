import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { TriangleAlert, PackageOpen, TrendingDown, CircleCheck } from 'lucide-react'
import { DashboardCard } from '../../../components/shared/DashboardCard'
import { AlertCard } from '../../../components/shared/AlertCard'
import type { RentabilidadProducto, EvolucionRow } from '../api'

interface AlertsSectionProps {
  alertasStock: number
  productosPerdida: RentabilidadProducto[]
  cajaAbierta: boolean
  evolucion: EvolucionRow[]
}

export function AlertsSection({ alertasStock, productosPerdida, cajaAbierta, evolucion }: AlertsSectionProps) {
  const navigate = useNavigate()

  const tendencia = useMemo(() => {
    if (evolucion.length < 2) return null
    const ultimos = evolucion.slice(-3)
    const ingresos = ultimos.map(e => e.ingresos)
    const bajando = ingresos[0] > ingresos[1] && ingresos[1] > ingresos[2]
    if (!bajando) return null
    const pct = ingresos[0] > 0 ? ((ingresos[0] - ingresos[2]) / ingresos[0] * 100) : 0
    return pct >= 10 ? pct : null
  }, [evolucion])

  const alertas = useMemo(() => {
    const items: Array<{
      id: string
      severity: 'critical' | 'warning' | 'info'
      icon: React.ReactNode
      titulo: string
      descripcion: string
      accion?: { label: string; ruta: string }
    }> = []

    if (alertasStock > 0) {
      items.push({
        id: 'stock-bajo',
        severity: 'critical',
        icon: <PackageOpen className="size-4 shrink-0" aria-hidden />,
        titulo: 'Stock bajo de ingredientes',
        descripcion: `${alertasStock} producto${alertasStock > 1 ? 's tienen' : ' tiene'} stock por debajo del mínimo.`,
        accion: { label: 'Ver inventario', ruta: '/admin/inventario' },
      })
    }

    if (productosPerdida.length > 0) {
      items.push({
        id: 'rentabilidad-perdida',
        severity: 'warning',
        icon: <TrendingDown className="size-4 shrink-0" aria-hidden />,
        titulo: 'Productos en pérdida',
        descripcion: `${productosPerdida.length} producto${productosPerdida.length > 1 ? 's generan' : ' genera'} margen negativo. Revisa costos.`,
        accion: { label: 'Ver rentabilidad', ruta: '/admin/rentabilidad' },
      })
    }

    if (tendencia != null) {
      items.push({
        id: 'tendencia-bajando',
        severity: 'warning',
        icon: <TrendingDown className="size-4 shrink-0" aria-hidden />,
        titulo: 'Ventas en descenso',
        descripcion: `Los ingresos cayeron un ${tendencia.toFixed(0)}% en los últimos 3 días.`,
        accion: undefined,
      })
    }

    if (!cajaAbierta) {
      items.push({
        id: 'caja-cerrada',
        severity: 'info',
        icon: <TriangleAlert className="size-4 shrink-0" aria-hidden />,
        titulo: 'Caja cerrada',
        descripcion: 'No hay caja abierta. Abre una caja para comenzar a operar.',
        accion: { label: 'Ir a caja', ruta: '/admin/caja' },
      })
    }

    return items
  }, [alertasStock, productosPerdida, cajaAbierta, tendencia])

  return (
    <DashboardCard title="Alertas">
      <div className="flex flex-col gap-2">
        {alertas.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-text-secondary">
            <CircleCheck className="size-8 mb-1 text-green-500" aria-hidden />
            <span className="text-xs">Sin alertas activas</span>
          </div>
        ) : (
          alertas.map(a => (
            <AlertCard
              key={a.id}
              severity={a.severity}
              icon={a.icon}
              title={a.titulo}
              description={a.descripcion}
              action={a.accion ? { label: a.accion.label, onClick: () => navigate(a.accion!.ruta) } : undefined}
            />
          ))
        )}
      </div>
    </DashboardCard>
  )
}
