import { useNavigate } from 'react-router-dom'
import { DashboardCard } from '../../../components/shared/DashboardCard'
import { AlertCard } from '../../../components/shared/AlertCard'
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
            <span className="text-2xl mb-1">✅</span>
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
