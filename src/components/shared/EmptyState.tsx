import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  message?: string
  icon?: ReactNode
}

export function EmptyState({ message = 'No hay registros', icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      {icon ?? <Inbox className="size-10 text-text-secondary" />}
      <p className="text-text-secondary font-body text-sm">{message}</p>
    </div>
  )
}
