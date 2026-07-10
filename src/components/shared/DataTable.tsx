import { useState, useMemo, type ReactNode } from 'react'

function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  return (
    <div
      className={`${sizes[size]} border-2 border-wood-mid border-t-pos-accent rounded-full animate-spin`}
      role="status"
      aria-label="Cargando"
    />
  )
}

function EmptyState({ message = 'No hay registros', icon = '📭' }: { message?: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3" role="status">
      <span className="text-4xl" aria-hidden>{icon}</span>
      <p className="text-text-secondary font-body text-sm">{message}</p>
    </div>
  )
}

function ErrorState({ message = 'Ocurrió un error', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3" role="alert">
      <span className="text-4xl" aria-hidden>⚠️</span>
      <p className="text-danger text-sm font-body text-center">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2 rounded-lg border-2 border-pos-accent text-pos-accent text-sm font-semibold bg-transparent hover:bg-pos-accent hover:text-white transition-colors cursor-pointer"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}

export interface Column<T> {
  key: keyof T
  header: string
  render?: (item: T) => ReactNode
  sortable?: boolean
  width?: string
  sortFunction?: (a: T, b: T) => number
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string
  onRowClick?: (item: T) => void
  isLoading?: boolean
  error?: Error | null
  emptyMessage?: string
  onRetry?: () => void
}

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0
  if (a == null) return -1
  if (b == null) return 1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b)
  return String(a).localeCompare(String(b))
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  isLoading,
  error,
  emptyMessage,
  onRetry,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const sorted = useMemo(() => {
    if (!sortKey) return data
    const col = columns.find((c) => c.key === sortKey)
    const customSort = col?.sortFunction
    return [...data].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (customSort) return customSort(a, b) * dir
      return compareValues(a[sortKey], b[sortKey]) * dir
    })
  }, [data, sortKey, sortDir, columns])

  const toggleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={onRetry} />
  }

  if (!data.length) {
    return <EmptyState message={emptyMessage} />
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-bg-surface" role="region" aria-label="Tabla de datos">
      <table className="w-full text-sm" role="table">
        <thead>
          <tr className="admin-table-header" role="row">
            {columns.map((col) => {
              const isActive = sortKey === col.key
              return (
                <th
                  key={String(col.key)}
                  scope="col"
                  role="columnheader"
                  aria-sort={col.sortable ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  tabIndex={col.sortable ? 0 : undefined}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    col.sortable
                      ? 'cursor-pointer hover:opacity-80 select-none focus-visible:outline-2 focus-visible:outline-pos-accent'
                      : ''
                  }`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && toggleSort(col.key)}
                  onKeyDown={(e) => {
                    if (col.sortable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      toggleSort(col.key)
                    }
                  }}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && isActive && (
                      <span className="text-pos-accent text-[10px]" aria-hidden>
                        {sortDir === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((item, idx) => (
            <tr
              key={keyExtractor(item)}
              onClick={() => onRowClick?.(item)}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={(e) => {
                if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  onRowClick(item)
                }
              }}
              className={`border-b border-border/50 transition-colors duration-150 admin-row-hover ${
                idx % 2 === 1 ? 'bg-admin-row-alt' : 'bg-bg-surface'
              } ${onRowClick ? 'cursor-pointer' : ''}`}
              role={onRowClick ? 'button' : undefined}
            >
              {columns.map((col) => (
                <td key={String(col.key)} className="px-4 py-3 text-text-primary" role="cell">
                  {col.render ? col.render(item) : String(item[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
