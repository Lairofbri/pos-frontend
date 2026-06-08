import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'

interface PageHeaderProps {
  title: string
  onNew?: () => void
  newLabel?: string
  backTo?: string
}

export function PageHeader({ title, onNew, newLabel, backTo }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between mb-5 shrink-0">
      <div className="flex items-center gap-3">
        {backTo && (
          <button
            onClick={() => navigate(backTo)}
            className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer text-lg"
          >
            ←
          </button>
        )}
        <h1 className="font-display text-xl text-text-primary tracking-tight">{title}</h1>
      </div>
      {onNew && (
        <Button onClick={onNew} size="sm" icon="+">
          {newLabel || 'Nuevo'}
        </Button>
      )}
    </div>
  )
}
