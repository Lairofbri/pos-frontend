import { useEffect } from 'react'
import { useToastStore } from '../../store/toastStore'

export function Toast() {
  const toast = useToastStore((s) => s.toast)
  const hide = useToastStore((s) => s.hide)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(hide, 4000)
    return () => clearTimeout(timer)
  }, [toast, hide])

  if (!toast) return null

  const isError = toast.type === 'error'

  return (
    <div className="fixed top-4 right-4 z-[100] animate-fadeIn max-w-sm">
      <div
        className={`rounded-xl border-2 px-5 py-4 shadow-2xl ${
          isError
            ? 'bg-bg-surface border-danger/40'
            : 'bg-bg-surface border-success/40'
        }`}
      >
        <div className="flex items-start gap-3">
          <span className="text-lg mt-0.5">
            {isError ? '❌' : '✅'}
          </span>
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-semibold font-body ${
                isError ? 'text-danger' : 'text-success'
              }`}
            >
              {toast.message}
            </p>
            {toast.description && (
              <p className="text-xs text-text-secondary mt-1 font-body">
                {toast.description}
              </p>
            )}
          </div>
          <button
            onClick={hide}
            className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
