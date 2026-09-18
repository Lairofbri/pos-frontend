import { TriangleAlert, PackageOpen, TrendingDown } from 'lucide-react'
import type { DashboardAlerta } from '../../routes/dashboard/api'

export const ALERTA_ICONOS: Record<DashboardAlerta['severity'], React.ReactNode> = {
  critical: <PackageOpen className="size-4 shrink-0" aria-hidden />,
  warning: <TrendingDown className="size-4 shrink-0" aria-hidden />,
  info: <TriangleAlert className="size-4 shrink-0" aria-hidden />,
}