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

const COLORS: Record<string, { dot: string; bg: string; border: string }> = {
  pendientes: { dot: '#4E9AD4', bg: '#E6F2FB', border: '#4E9AD4' },
  preparacion: { dot: '#D97A43', bg: '#FFF1E0', border: '#D97A43' },
  listos: { dot: '#67BA78', bg: '#EAF7EC', border: '#67BA78' },
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
                  ? 'text-white shadow-sm'
                  : 'text-text-secondary bg-bg-surface border border-border'
              }`}
              style={mobileTab === col.id ? { background: color?.dot } : undefined}
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
              <span className="w-2 h-2 rounded-full" style={{ background: COLORS[activeCol.id]?.dot }} />
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
                {color && <span className="w-2.5 h-2.5 rounded-full" style={{ background: color.dot }} />}
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
