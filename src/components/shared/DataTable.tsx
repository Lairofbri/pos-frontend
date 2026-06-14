import { useState, useMemo, type ReactNode } from 'react'

/* ──────────── Placeholder minimal components ──────────── */

function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  return (
    <div
      className={`${sizes[size]} border-2 border-[#2A2A3A] border-t-[#D4A24C] rounded-full animate-spin`}
      role="status"
      aria-label="Cargando"
    />
  )
}

function EmptyState({
  message = 'No hay registros',
  icon = '📭',
}: {
  message?: string
  icon?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3" role="status">
      <span className="text-4xl" aria-hidden>{icon}</span>
      <p className="text-[#8A857A] font-['Sora',sans-serif] text-sm">{message}</p>
    </div>
  )
}

function ErrorState({
  message = 'Ocurrió un error',
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3" role="alert">
      <span className="text-4xl" aria-hidden>⚠️</span>
      <p className="text-[#E5484D] font-['Sora',sans-serif] text-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2 rounded-lg border-2 border-[#2A2A3A] text-[#F5F0E8] text-sm font-semibold bg-transparent hover:border-[#D4A24C] hover:text-[#D4A24C] transition-colors cursor-pointer"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}

/* ──────────── Column definition ──────────── */

export interface Column<T> {
  key: keyof T
  header: string
  render?: (item: T) => ReactNode
  sortable?: boolean
  width?: string
  sortFunction?: (a: T, b: T) => number
}

/* ──────────── Props ──────────── */

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

/* ──────────── Helpers ──────────── */

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0
  if (a == null) return -1
  if (b == null) return 1

  if (typeof a === 'number' && typeof b === 'number') return a - b
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b)

  return String(a).localeCompare(String(b))
}

/* ──────────── Component ──────────── */

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

  /* ── States ── */

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={onRetry} />
  }

  if (!data.length) {
    return <EmptyState message={emptyMessage} />
  }

  /* ── Render ── */

  return (
    <div className="overflow-x-auto rounded-xl border border-[#2A2A3A]" role="region" aria-label="Tabla de datos">
      <table className="w-full text-sm" role="table">
        <thead>
          <tr className="border-b border-[#2A2A3A] bg-[#16161E]" role="row">
            {columns.map((col) => {
              const isActive = sortKey === col.key
              const ariaSort = isActive
                ? (sortDir === 'asc' ? 'ascending' : 'descending')
                : 'none'

              return (
                <th
                  key={String(col.key)}
                  scope="col"
                  role="columnheader"
                  aria-sort={col.sortable ? ariaSort : undefined}
                  tabIndex={col.sortable ? 0 : undefined}
                  className={`px-4 py-3 text-left text-xs font-semibold text-[#8A857A] uppercase tracking-wider ${
                    col.sortable
                      ? 'cursor-pointer hover:text-[#D4A24C] select-none focus-visible:outline-2 focus-visible:outline-[#D4A24C] focus-visible:outline-offset-[-2px]'
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
                      <span className="text-[#D4A24C]" aria-hidden>
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
          {sorted.map((item) => (
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
              className={`border-b border-[#2A2A3A]/50 transition-colors duration-150 ${
                onRowClick
                  ? 'cursor-pointer hover:bg-[#1E1E2A] focus-visible:bg-[#1E1E2A] focus-visible:outline-2 focus-visible:outline-[#D4A24C] focus-visible:outline-offset-[-2px]'
                  : ''
              }`}
              role={onRowClick ? 'button' : undefined}
            >
              {columns.map((col) => (
                <td key={String(col.key)} className="px-4 py-3 text-[#F5F0E8]" role="cell">
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
