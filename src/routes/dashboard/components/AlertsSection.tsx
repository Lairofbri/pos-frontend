import { useNavigate } from 'react-router-dom'
import { CircleCheck } from 'lucide-react'
import { DashboardCard } from '../../../components/shared/DashboardCard'
import { AlertCard } from '../../../components/shared/AlertCard'
import { ALERTA_ICONOS } from '../../../components/shared/alertIconos'
import type { DashboardAlerta } from '../api'

interface AlertsSectionProps {
  alertas: DashboardAlerta[]
}

export function AlertsSection({ alertas }: AlertsSectionProps) {
  const navigate = useNavigate()

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
              icon={ALERTA_ICONOS[a.severity]}
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