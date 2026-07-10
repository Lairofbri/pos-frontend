import type { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  children: ReactNode
}

const variants = {
  default: 'bg-bg-surface text-text-secondary border-border',
  success: 'bg-success/10 text-success border-success/30',
  warning: 'bg-pos-accent/10 text-pos-accent border-pos-accent/30',
  danger: 'bg-danger/10 text-danger border-danger/30',
  info: 'bg-info/10 text-info border-info/30',
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold font-body border ${variants[variant]}`}>
      {children}
    </span>
  )
}
