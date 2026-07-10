import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'

interface PageHeaderProps {
  title: string
  subtitle?: string
  onNew?: () => void
  newLabel?: string
  backTo?: string
}

export function PageHeader({ title, subtitle, onNew, newLabel, backTo }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between mb-5 shrink-0">
      <div className="flex items-center gap-3">
        {backTo && (
          <button
            onClick={() => navigate(backTo)}
            className="w-8 h-8 rounded-xl border border-border bg-bg-surface flex items-center justify-center text-text-secondary hover:text-pos-accent hover:border-pos-accent transition-all cursor-pointer text-sm"
          >
            ←
          </button>
        )}
        <div>
          <h1 className="font-display text-xl text-text-primary tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-text-secondary font-body mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {onNew && (
        <Button onClick={onNew} size="sm" icon="+">
          {newLabel || 'Nuevo'}
        </Button>
      )}
    </div>
  )
}
