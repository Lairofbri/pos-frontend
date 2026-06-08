import { useEffect, type ReactNode } from 'react'

interface SidePanelProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function SidePanel({ open, onClose, title, children }: SidePanelProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 h-full z-50 bg-bg-surface border-l border-border shadow-2xl transition-transform duration-300 ease-out w-full max-w-md ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-14 flex items-center justify-between px-5 border-b border-border">
          <h2 className="font-display text-lg text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-3.5rem)] p-5">
          {children}
        </div>
      </div>
    </>
  )
}
