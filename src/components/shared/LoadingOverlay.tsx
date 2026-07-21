import { Spinner } from '../ui/Spinner'

export function LoadingOverlay({ message = 'Guardando...' }: { message?: string }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 rounded-xl bg-bg-surface/70 backdrop-blur-sm">
      <Spinner size="lg" />
      <p className="text-sm text-text-secondary font-body animate-pulse">{message}</p>
    </div>
  )
}
