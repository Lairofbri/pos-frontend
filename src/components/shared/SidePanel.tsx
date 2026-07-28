import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface SidePanelProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}

export function SidePanel({ open, onClose, title, children, className = '' }: SidePanelProps) {
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
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 h-full z-50 bg-bg-surface border-l border-border shadow-elevated transition-transform duration-300 ease-out w-full sm:max-w-md ${className} ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="admin-sidepanel-header h-14 flex items-center justify-between px-5">
          <h2 className="font-display text-lg text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="size-8 rounded-full bg-white/80 border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-pos-accent transition-all cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-3.5rem)] p-5">
          {children}
        </div>
      </div>
    </>
  )
}
