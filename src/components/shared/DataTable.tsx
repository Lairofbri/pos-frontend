import { useState } from 'react'
import type { ReactNode } from 'react'
import { Spinner } from '../ui/Spinner'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'

export interface Column<T> {
  key: string
  header: string
  render?: (item: T) => ReactNode
  sortable?: boolean
  width?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (item: T) => void
  isLoading?: boolean
  error?: Error | null
  emptyMessage?: string
  onRetry?: () => void
  keyExtractor: (item: T) => string
}

export function DataTable<T>({
  data,
  columns,
  onRowClick,
  isLoading,
  error,
  emptyMessage = 'No hay registros',
  onRetry,
  keyExtractor,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

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

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0
    const aVal = String((a as any)[sortKey] ?? '')
    const bVal = String((b as any)[sortKey] ?? '')
    return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
  })

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-bg-surface">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider ${
                  col.sortable ? 'cursor-pointer hover:text-accent select-none' : ''
                }`}
                style={{ width: col.width }}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortKey === col.key && (
                    <span className="text-accent">{sortDir === 'asc' ? '▲' : '▼'}</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((item) => (
            <tr
              key={keyExtractor(item)}
              onClick={() => onRowClick?.(item)}
              className={`border-b border-border/50 transition-colors duration-150 ${
                onRowClick ? 'cursor-pointer hover:bg-bg-surface-hover' : ''
              }`}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-text-primary">
                  {col.render ? col.render(item) : String((item as any)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
