import { useState, type ReactNode } from 'react'

interface KanbanColumn {
  id: string
  title: string
  icon?: string
  items: { id: string; content: ReactNode }[]
}

interface KanbanBoardProps {
  columns: KanbanColumn[]
  renderItem: (item: { id: string; content: ReactNode }) => ReactNode
}

const COLORS: Record<string, { dot: string; header: string; badge: string; border: string; bg: string }> = {
  pendientes: {
    dot: 'bg-blue-500',
    header: 'border-blue-500/30',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/20',
    bg: 'bg-blue-500/[0.02]',
  },
  preparacion: {
    dot: 'bg-orange-500',
    header: 'border-orange-500/30',
    badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/20',
    bg: 'bg-orange-500/[0.02]',
  },
  listos: {
    dot: 'bg-green-500',
    header: 'border-green-500/30',
    badge: 'bg-green-500/10 text-green-600 dark:text-green-400',
    border: 'border-green-500/20',
    bg: 'bg-green-500/[0.02]',
  },
}

export function KanbanBoard({ columns, renderItem }: KanbanBoardProps) {
  const [mobileTab, setMobileTab] = useState(columns[0]?.id ?? '')
  const activeCol = columns.find(c => c.id === mobileTab) ?? columns[0]
  const activeColor = activeCol ? COLORS[activeCol.id] : null

  return (
    <div className="h-full flex flex-col">
      {/* Mobile tabs */}
      <div className="flex gap-1.5 mb-3 sm:hidden shrink-0">
        {columns.map(col => {
          const color = COLORS[col.id]
          const isActive = mobileTab === col.id
          return (
            <button
              key={col.id}
              onClick={() => setMobileTab(col.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? `text-white shadow-sm ${color?.dot}`
                  : 'text-text-secondary bg-bg-surface border border-border hover:border-accent/30'
              }`}
            >
              {col.icon && <span className="text-sm">{col.icon}</span>}
              <span>{col.title}</span>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'bg-bg-primary text-text-secondary'
              }`}>
                {col.items.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Mobile single column */}
      <div className="sm:hidden flex-1 overflow-hidden">
        {activeCol && (
          <div className="h-full flex flex-col">
            <div className={`flex items-center gap-2 mb-3 shrink-0 pb-2 border-b-2 ${activeColor?.header || 'border-border'}`}>
              {activeCol.icon && <span className="text-base">{activeCol.icon}</span>}
              <span className="font-display text-sm font-bold text-text-primary">{activeCol.title}</span>
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${activeColor?.badge || 'bg-bg-primary text-text-secondary'}`}>
                {activeCol.items.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pb-4">
              {activeCol.items.length === 0 ? (
                <EmptyState />
              ) : (
                activeCol.items.map((item) => <div key={item.id}>{renderItem(item)}</div>)
              )}
            </div>
          </div>
        )}
      </div>

      {/* Desktop columns */}
      <div className="hidden sm:flex gap-4 flex-1 overflow-hidden">
        {columns.map((col) => {
          const color = COLORS[col.id]
          return (
            <div
              key={col.id}
              className={`flex-1 min-w-0 flex flex-col rounded-2xl border ${color?.border || 'border-border'} ${color?.bg || ''}`}
            >
              <div className={`flex items-center gap-2 px-4 py-3 shrink-0 border-b ${color?.header || 'border-border'}`}>
                {col.icon && <span className="text-base">{col.icon}</span>}
                <span className="font-display text-sm font-bold text-text-primary">{col.title}</span>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ml-auto ${color?.badge || 'bg-bg-primary text-text-secondary'}`}>
                  {col.items.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {col.items.length === 0 ? (
                  <EmptyState />
                ) : (
                  col.items.map((item) => (
                    <div key={item.id}>{renderItem(item)}</div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-border text-text-secondary text-xs font-body">
      Sin elementos
    </div>
  )
}
