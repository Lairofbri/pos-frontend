import { useQuery } from '@tanstack/react-query'
import { ExternalLink, Info } from 'lucide-react'
import { queryDefaults } from '../../../config/queries'
import { listarSucursales } from './api'
import type { Sucursal, FiscalStatus } from './api'
import { Badge } from '@/components/ui/Badge'
import { InlineError } from '../../../components/shared/InlineError'
import { Spinner } from '@/components/ui/Spinner'

// F4 (spec «DTE única fuente de verdad de empresa y sucursal»): las sucursales
// (establecimientos) son datos de empresa y viven en el DTE Service. En el POS
// esta pantalla es de SOLO LECTURA: nombre, estado fiscal y `sync_error`; el
// alta/edición/activación se hace en el DTE.
const DTE_FRONTEND_URL = import.meta.env.VITE_DTE_FRONTEND_URL as string | undefined

const FISCAL_STATUS: Record<FiscalStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  pending_link: { label: 'Sin vínculo fiscal', variant: 'info' },
  pending_mh_data: { label: 'Datos MH pendientes', variant: 'warning' },
  ready: { label: 'Lista para emitir', variant: 'success' },
  inactive: { label: 'Fiscal inactivo', variant: 'default' },
  blocked: { label: 'Vínculo bloqueado', variant: 'danger' },
}

function FiscalStatusBadge({ status, syncError }: { status?: FiscalStatus; syncError?: string }) {
  if (!status) return null
  const cfg = FISCAL_STATUS[status]
  return (
    <Badge
      variant={cfg.variant}
      className="cursor-help"
      title={syncError ? `sync_error: ${syncError}` : cfg.label}
    >
      {cfg.label}
      {syncError ? ' ⚠' : ''}
    </Badge>
  )
}

function SucursalCard({ s }: { s: Sucursal }) {
  return (
    <div className="relative p-4 rounded-xl border border-border bg-bg-surface">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0">{s.es_principal ? '⭐' : '🏪'}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">{s.nombre}</p>
            {s.es_principal && <span className="text-[10px] font-semibold uppercase tracking-wider text-accent/70">Principal</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <FiscalStatusBadge status={s.fiscal_status} syncError={s.sync_error} />
          <Badge variant={s.activo ? 'success' : 'danger'}>{s.activo ? 'Activo' : 'Inactivo'}</Badge>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-text-secondary font-body">
        {s.direccion && (
          <span className="truncate max-w-48">{s.direccion}</span>
        )}
        {s.telefono && (
          <>
            {s.direccion && <span className="w-px h-3 bg-border shrink-0" />}
            <span className="shrink-0">{s.telefono}</span>
          </>
        )}
      </div>

      {s.sync_error && (
        <p className="mt-2 text-xs text-danger font-body break-words">
          Error de sincronización: {s.sync_error}
        </p>
      )}

      {s.dte_establecimiento_id && (
        <p className="mt-2 font-mono text-[10px] text-text-muted truncate" title={s.dte_establecimiento_id}>
          establecimiento_id: {s.dte_establecimiento_id}
        </p>
      )}
    </div>
  )
}

export default function SucursalesPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sucursales'],
    queryFn: () => listarSucursales(),
    ...queryDefaults('sucursales'),
  })

  return (
    <div className="px-4 pb-4">
      <div className="flex flex-col gap-2 mb-4 rounded-xl border border-border bg-bg-primary p-3">
        <div className="flex items-start gap-2">
          <Info className="size-4 text-pos-accent shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary font-body">
            Las sucursales (establecimientos) se administran en el
            <span className="font-semibold text-text-primary"> DTE Service</span>. El POS solo las muestra.
          </p>
        </div>
        {DTE_FRONTEND_URL && (
          <a
            href={DTE_FRONTEND_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 w-fit text-xs font-semibold text-pos-accent hover:underline"
          >
            <ExternalLink className="size-3.5" />
            Administrar en el DTE Service
          </a>
        )}
      </div>

      <p className="text-xs text-text-secondary font-body mb-4">
        {data ? `${data.length} sucursal(es)` : ''}
      </p>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {error && !isLoading && (
        <InlineError message={(error as Error).message || 'Error al cargar sucursales'} onRetry={() => refetch()} />
      )}

      {data && data.length === 0 && !isLoading && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <span className="text-4xl">🏪</span>
          <p className="text-sm text-text-secondary font-body">No hay sucursales registradas</p>
          <p className="text-xs text-text-secondary font-body">Crealas en el DTE Service para operar y emitir DTE.</p>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map((s) => (
            <SucursalCard key={s.id} s={s} />
          ))}
        </div>
      )}
    </div>
  )
}
