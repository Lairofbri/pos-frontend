import type { ReactNode } from 'react'

interface AlertCardProps {
  severity: 'critical' | 'warning' | 'info'
  icon: ReactNode
  title: string
  description: string
  action?: { label: string; onClick: () => void }
  children?: ReactNode
}

const severityMap = {
  critical: 'dashboard-alert-critical',
  warning: 'dashboard-alert-warning',
  info: 'dashboard-alert-info',
}

export function AlertCard({ severity, icon, title, description, action, children }: AlertCardProps) {
  return (
    <div className={`rounded-xl px-4 py-3 flex items-start gap-3 ${severityMap[severity]}`}>
      <span className="text-lg shrink-0 mt-0.5" aria-hidden>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="text-xs text-text-secondary mt-0.5">{description}</p>
        {children}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="shrink-0 text-xs font-semibold text-pos-accent hover:text-pos-accent-hover cursor-pointer transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
