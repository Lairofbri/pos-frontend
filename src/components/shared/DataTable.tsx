import { useState, useMemo, type ReactNode } from 'react'
import { ArrowUp, ArrowDown, Inbox, AlertTriangle } from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'

function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'size-4', md: 'size-6', lg: 'size-8' }
  return (
    <div
      className={`${sizes[size]} border-2 border-wood-mid border-t-pos-accent rounded-full animate-spin`}
      role="status"
      aria-label="Cargando"
    />
  )
}

function EmptyState({ message = 'No hay registros' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3" role="status">
      <Inbox className="size-10 text-text-secondary" aria-hidden />
      <p className="text-text-secondary font-body text-sm">{message}</p>
    </div>
  )
}

function ErrorState({ message = 'Ocurrió un error', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3" role="alert">
      <AlertTriangle className="size-10 text-danger" aria-hidden />
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
    <div className="rounded-xl border border-border bg-bg-surface" role="region" aria-label="Tabla de datos">
      <div className="hidden sm:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="admin-table-header">
              {columns.map((col) => {
                const isActive = sortKey === col.key
                return (
                  <TableHead
                    key={String(col.key)}
                    scope="col"
                    aria-sort={col.sortable ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                    tabIndex={col.sortable ? 0 : undefined}
                    className={`text-xs font-semibold uppercase tracking-wider ${
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
                        sortDir === 'asc'
                          ? <ArrowUp className="size-3 text-pos-accent" aria-hidden />
                          : <ArrowDown className="size-3 text-pos-accent" aria-hidden />
                      )}
                    </span>
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((item, idx) => (
              <TableRow
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onRowClick(item)
                  }
                }}
                className={`admin-row-hover ${
                  idx % 2 === 1 ? 'bg-admin-row-alt' : ''
                } ${onRowClick ? 'cursor-pointer' : ''}`}
                role={onRowClick ? 'button' : undefined}
              >
                {columns.map((col) => (
                  <TableCell key={String(col.key)} className="text-text-primary">
                    {col.render ? col.render(item) : String(item[col.key] ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="sm:hidden divide-y divide-border/50">
        {sorted.map((item) => (
          <div
            key={keyExtractor(item)}
            onClick={() => onRowClick?.(item)}
            className={`p-4 transition-colors duration-150 ${onRowClick ? 'cursor-pointer active:bg-bg-surface-hover' : ''}`}
          >
            {columns.map((col) => (
              <div key={String(col.key)} className="flex items-center justify-between py-1">
                <span className="text-xs font-semibold text-text-secondary uppercase">{col.header}</span>
                <span className="text-sm text-text-primary">
                  {col.render ? col.render(item) : String(item[col.key] ?? '')}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
