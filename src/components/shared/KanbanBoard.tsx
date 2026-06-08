import type { ReactNode } from 'react'

interface KanbanColumn {
  id: string
  title: string
  items: { id: string; content: ReactNode }[]
}

interface KanbanBoardProps {
  columns: KanbanColumn[]
  renderItem: (item: { id: string; content: ReactNode }) => ReactNode
}

export function KanbanBoard({ columns, renderItem }: KanbanBoardProps) {
  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-2">
      {columns.map((col) => (
        <div key={col.id} className="flex-1 min-w-[260px] flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-display text-sm text-text-primary">{col.title}</span>
            <span className="text-[10px] font-mono text-text-secondary bg-bg-surface px-2 py-0.5 rounded-full">
              {col.items.length}
            </span>
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
      ))}
    </div>
  )
}
