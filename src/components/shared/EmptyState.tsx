interface EmptyStateProps {
  message?: string
  icon?: string
}

export function EmptyState({ message = 'No hay registros', icon = '📭' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <span className="text-4xl">{icon}</span>
      <p className="text-text-secondary font-body text-sm">{message}</p>
    </div>
  )
}
