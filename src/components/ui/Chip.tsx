import type { ReactNode } from 'react'

interface ChipProps {
  active?: boolean
  onClick?: () => void
  children: ReactNode
}

export function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-body border-2 transition-all duration-200 cursor-pointer whitespace-nowrap ${
        active
          ? 'bg-accent text-bg-primary border-accent font-semibold'
          : 'bg-transparent text-text-secondary border-border hover:text-text-primary hover:border-accent'
      }`}
    >
      {children}
    </button>
  )
}
