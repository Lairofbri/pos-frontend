import type { ReactNode } from 'react'

interface DashboardCardProps {
  title?: string
  children: ReactNode
  className?: string
  hover?: boolean
}

export function DashboardCard({ title, children, className = '', hover }: DashboardCardProps) {
  return (
    <div className={`${hover ? 'dashboard-card-hover' : 'dashboard-card'} ${className}`}>
      {title && (
        <h3 className="font-display text-sm font-bold text-text-primary mb-4 tracking-tight">
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}
