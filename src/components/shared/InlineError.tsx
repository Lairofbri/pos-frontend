import { Icon } from './Icon'

export function InlineError({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3" role="alert">
      <div className="size-12 rounded-full bg-danger/10 flex items-center justify-center">
        <Icon name="alert" className="size-6 text-danger" />
      </div>
      <p className="text-sm text-danger font-body text-center max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-5 py-2 rounded-lg border-2 border-danger/50 text-danger text-sm font-semibold bg-transparent hover:bg-danger hover:text-white transition-colors cursor-pointer"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}
