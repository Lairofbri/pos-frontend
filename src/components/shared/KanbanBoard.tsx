import { useState, type ReactNode } from 'react'

interface KanbanColumn {
  id: string
  title: string
  items: { id: string; content: ReactNode }[]
}

interface KanbanBoardProps {
  columns: KanbanColumn[]
  renderItem: (item: { id: string; content: ReactNode }) => ReactNode
}

const COLORS: Record<string, { dotClass: string; bgClass: string; borderClass: string }> = {
  pendientes: { dotClass: 'bg-pos-reservada-border', bgClass: 'bg-pos-reservada-bg', borderClass: 'border-pos-reservada-border' },
  preparacion: { dotClass: 'bg-pos-accent-light', bgClass: 'bg-dashboard-warning-bg', borderClass: 'border-pos-accent-light' },
  listos: { dotClass: 'bg-pos-libre-border', bgClass: 'bg-pos-libre-bg', borderClass: 'border-pos-libre-border' },
}

export function KanbanBoard({ columns, renderItem }: KanbanBoardProps) {
  const [mobileTab, setMobileTab] = useState(columns[0]?.id ?? '')
  const activeCol = columns.find(c => c.id === mobileTab) ?? columns[0]

  return (
    <>
      {/* Mobile tabs */}
      <div className="flex gap-1 mb-3 sm:hidden">
        {columns.map(col => {
          const color = COLORS[col.id]
          return (
            <button
              key={col.id}
              onClick={() => setMobileTab(col.id)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                mobileTab === col.id
                  ? `text-white shadow-sm ${color?.dotClass}`
                  : 'text-text-secondary bg-bg-surface border border-border'
              }`}
            >
              {col.title}
              <span className="ml-1 opacity-80">{col.items.length}</span>
            </button>
          )
        })}
      </div>

      {/* Mobile single column */}
      <div className="sm:hidden h-full">
        <div className="flex items-center gap-2 mb-3">
          {activeCol && (
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${COLORS[activeCol.id]?.dotClass}`} />
              <span className="cocina-column-header">{activeCol.title}</span>
              <span className="cocina-count-badge">{activeCol.items.length}</span>
            </div>
          )}
        </div>
        <div className="space-y-2 overflow-y-auto h-[calc(100%-2.5rem)]">
          {activeCol && (activeCol.items.length === 0 ? (
            <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-border text-text-secondary text-xs font-body">Sin elementos</div>
          ) : (
            activeCol.items.map((item) => <div key={item.id}>{renderItem(item)}</div>)
          ))}
        </div>
      </div>

      {/* Desktop 3 columns */}
      <div className="hidden sm:flex gap-4 h-full overflow-x-auto pb-2">
        {columns.map((col) => {
          const color = COLORS[col.id]
          return (
            <div key={col.id} className="flex-1 min-w-[280px] flex flex-col">
              <div className="flex items-center gap-2 mb-3 shrink-0">
                {color && <span className={`w-2.5 h-2.5 rounded-full ${color.dotClass}`} />}
                <span className="cocina-column-header">{col.title}</span>
                <span className="cocina-count-badge">{col.items.length}</span>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto min-h-[200px]">
                {col.items.length === 0 ? (
                  <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-border text-text-secondary text-xs font-body">
                    Sin elementos
                  </div>
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
    </>
  )
}

