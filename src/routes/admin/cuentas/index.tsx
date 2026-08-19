import { useState, useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Receipt, Printer, Download, FileSpreadsheet, FileJson,
  Calendar, Search, ChevronLeft, ChevronRight,
  AlertCircle,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { listarCuentas, exportarCuentas, type CuentaItem, type CuentaExportItem } from './api'
import type { CuentasParams } from './api'
import { PageHeader } from '@/components/shared/PageHeader'
import { DashboardCard } from '@/components/shared/DashboardCard'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { useToastStore } from '@/store/toastStore'
import { imprimirTicket } from '@/routes/admin/impresoras/api'

type Periodo = 'hoy' | 'semana' | 'mes' | 'personalizado'

const PERIODOS: { key: Periodo; label: string }[] = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'semana', label: 'Esta semana' },
  { key: 'mes', label: 'Este mes' },
  { key: 'personalizado', label: 'Personalizado' },
]

const DTE_LABELS: Record<string, string> = {
  '01': 'FCF',
  '03': 'CCF',
  '14': 'FSE',
}

const TIPO_LABELS: Record<string, string> = {
  'rapido': 'Rápido',
  'mesa': 'Mesa',
  'delivery': 'Delivery',
}

function getPeriodoFechas(periodo: Periodo): { desde: string; hasta: string } {
  const now = new Date()
  const inicioDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString()
  const finDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).toISOString()

  switch (periodo) {
    case 'hoy':
      return { desde: inicioDia(now), hasta: finDia(now) }
    case 'semana':
      return {
        desde: inicioDia(startOfWeek(now, { weekStartsOn: 1 })),
        hasta: finDia(endOfWeek(now, { weekStartsOn: 1 })),
      }
    case 'mes':
      return {
        desde: inicioDia(startOfMonth(now)),
        hasta: finDia(endOfMonth(now)),
      }
    case 'personalizado':
      return { desde: '', hasta: '' }
  }
}

function fechaLegible(iso: string) {
  return new Date(iso).toLocaleString('es-SV', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function moneda(val: number) {
  return new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(val)
}

export default function CuentasPage() {
  const queryClient = useQueryClient()
  const showToast = useToastStore((s) => s.show)
  const [periodo, setPeriodo] = useState<Periodo>('hoy')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [pagina, setPagina] = useState(1)

  const fechas = useMemo(() => {
    if (periodo !== 'personalizado') return getPeriodoFechas(periodo)
    return {
      desde: fechaDesde ? new Date(fechaDesde + 'T00:00:00').toISOString() : '',
      hasta: fechaHasta ? new Date(fechaHasta + 'T23:59:59').toISOString() : '',
    }
  }, [periodo, fechaDesde, fechaHasta])

  const params: CuentasParams = useMemo(() => ({
    fecha_desde: fechas.desde || undefined,
    fecha_hasta: fechas.hasta || undefined,
    pagina,
    limite: 50,
  }), [fechas, pagina])

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['cuentas', params],
    queryFn: () => listarCuentas(params),
    staleTime: 30_000,
  })

  const kpis = useMemo(() => {
    if (!data?.cuentas) return { total: 0, monto: 0, dteEmitidos: 0, promedio: 0 }
    const cuentas = data.cuentas
    const total = cuentas.length
    const monto = cuentas.reduce((sum, c) => sum + (c.total ?? 0), 0)
    const dteEmitidos = cuentas.filter(c => c.dte_estado === 'emitido').length
    const promedio = total > 0 ? monto / cuentas.filter(c => c.total > 0).length || 0 : 0
    return { total, monto, dteEmitidos, promedio }
  }, [data])

  const handlePeriodoChange = useCallback((p: Periodo) => {
    setPeriodo(p)
    setPagina(1)
    if (p !== 'personalizado') {
      setFechaDesde('')
      setFechaHasta('')
    }
  }, [])

  const handleBuscar = useCallback(() => {
    setPagina(1)
    queryClient.invalidateQueries({ queryKey: ['cuentas'] })
  }, [queryClient])

  const handleReprint = useCallback(async (ordenId: string, numero: number) => {
    try {
      await imprimirTicket(ordenId, 'ticket-consumo')
      showToast({ type: 'success', message: `Comanda #${numero} enviada a impresión` })
    } catch {
      showToast({ type: 'error', message: 'Error al imprimir comanda' })
    }
  }, [showToast])

  const handleExportExcel = useCallback(async () => {
    try {
      const cuentas = await exportarCuentas({
        fecha_desde: fechas.desde || undefined,
        fecha_hasta: fechas.hasta || undefined,
      })
      const rows = cuentas.map((c, i) => ({
        '#': i + 1,
        'Fecha': fechaLegible(c.creado_en),
        'Tipo': TIPO_LABELS[c.tipo] ?? c.tipo,
        'Mesa': c.mesa_numero ?? '—',
        'Cliente': c.cliente_nombre ?? 'Consumidor Final',
        'Origen': c.origen,
        'Estado': c.estado,
        'Subtotal': c.subtotal ?? 0,
        'IVA': c.iva ?? 0,
        'Total': c.total ?? 0,
        'Propina': c.propina_monto ?? 0,
        'Ítems': c.total_items,
        'DTE Tipo': c.dte_tipo ?? '—',
        'DTE Estado': c.dte_estado ?? '—',
      }))
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Cuentas')
      XLSX.writeFile(wb, `cuentas_${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
      showToast({ type: 'success', message: `${rows.length} cuentas exportadas` })
    } catch {
      showToast({ type: 'error', message: 'Error al exportar Excel' })
    }
  }, [fechas, showToast])

  const handleExportJson = useCallback(async () => {
    try {
      const cuentas = await exportarCuentas({
        fecha_desde: fechas.desde || undefined,
        fecha_hasta: fechas.hasta || undefined,
      })
      const exportData = cuentas
        .filter(c => c.dte_json_envio)
        .map((c: CuentaExportItem) => ({
          orden: {
            id: c.id,
            tipo: c.tipo,
            numero_orden: c.numero_orden,
            total: c.total,
            creado_en: c.creado_en,
            cliente: c.cliente_nombre,
            mesa: c.mesa_numero,
          },
          dte: {
            tipo: c.dte_tipo,
            codigo_generacion: c.dte_codigo_generacion,
            numero_control: c.dte_numero_control,
            estado: c.dte_estado,
            emitido_en: c.dte_emitido_en,
            envio: c.dte_json_envio,
            respuesta: c.dte_json_respuesta,
          },
        }))
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cuentas_dte_${format(new Date(), 'yyyy-MM-dd')}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast({ type: 'success', message: `${exportData.length} DTEs exportados` })
    } catch {
      showToast({ type: 'error', message: 'Error al exportar JSON' })
    }
  }, [fechas, showToast])

  const dteBadge = (cuenta: CuentaItem) => {
    if (!cuenta.dte_tipo) {
      return <span className="text-xs text-text-secondary tabular-nums">—</span>
    }
    const label = DTE_LABELS[cuenta.dte_tipo] ?? cuenta.dte_tipo
    const emitido = cuenta.dte_estado === 'emitido'
    return (
      <span
        className={`
          inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium tabular-nums
          ${emitido
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
            : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800'
          }
        `}
      >
        {label} {emitido && '✓'}
      </span>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Cuentas" />

      <div className="px-4 pb-4 flex-1 overflow-y-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {[
            {
              label: 'Cuentas',
              value: kpis.total,
              icon: Receipt,
              color: 'bg-pos-accent/10 text-pos-accent',
            },
            {
              label: 'Total facturado',
              value: kpis.monto,
              icon: Download,
              color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
              isCurrency: true,
            },
            {
              label: 'DTE emitidos',
              value: kpis.dteEmitidos,
              icon: FileJson,
              color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400',
            },
            {
              label: 'Promedio por cuenta',
              value: kpis.promedio,
              icon: Receipt,
              color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
              isCurrency: true,
            },
          ].map((kpi, i) => (
            <div key={i} className="bg-bg-surface border border-border rounded-xl p-4 flex items-center gap-3">
              <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${kpi.color}`}>
                <kpi.icon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-text-secondary truncate">{kpi.label}</p>
                <p className="text-xl font-bold tabular-nums text-text-primary">
                  {kpi.isCurrency ? moneda(kpi.value) : kpi.value.toLocaleString('es-SV')}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters + Export bar */}
        <div className="bg-bg-surface border border-border rounded-xl p-4 mb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Period pills */}
            <div className="flex items-center gap-1 bg-bg-primary rounded-lg p-1">
              {PERIODOS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => handlePeriodoChange(p.key)}
                  className={`
                    px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors duration-200
                    ${periodo === p.key
                      ? 'bg-bg-surface text-pos-accent shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                    }
                  `}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Date inputs */}
            {periodo === 'personalizado' && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-4 text-text-secondary shrink-0" />
                  <DatePicker
                    value={fechaDesde ? new Date(fechaDesde + 'T12:00:00') : undefined}
                    onChange={(d) => setFechaDesde(d ? format(d, 'yyyy-MM-dd') : '')}
                    placeholder="Desde…"
                  />
                </div>
                <span className="text-text-secondary text-sm">—</span>
                <DatePicker
                  value={fechaHasta ? new Date(fechaHasta + 'T12:00:00') : undefined}
                  onChange={(d) => setFechaHasta(d ? format(d, 'yyyy-MM-dd') : '')}
                  placeholder="Hasta…"
                />
                <Button size="sm" variant="primary" icon={<Search className="size-3.5" />} onClick={handleBuscar}>
                  Buscar
                </Button>
              </div>
            )}

            {/* Export buttons */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                icon={<FileSpreadsheet className="size-3.5" />}
                onClick={handleExportExcel}
                disabled={!data?.cuentas?.length}
              >
                Excel
              </Button>
              <Button
                size="sm"
                variant="outline"
                icon={<FileJson className="size-3.5" />}
                onClick={handleExportJson}
                disabled={!data?.cuentas?.some(c => c.dte_tipo)}
              >
                JSON DTE
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <DashboardCard title={data?.paginacion ? `${data.paginacion.total} cuentas encontradas` : 'Cuentas'}>
          {isLoading && (
            <div className="flex justify-center py-20">
              <Spinner size="lg" />
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <AlertCircle className="size-10 text-danger" />
              <p className="text-sm text-text-secondary">{(error as Error)?.message ?? 'Error al cargar cuentas'}</p>
              <Button variant="secondary" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['cuentas'] })}>
                Reintentar
              </Button>
            </div>
          )}

          {!isLoading && !isError && data && (
            <>
              {data.cuentas.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                  <div className="size-16 rounded-full bg-bg-primary flex items-center justify-center">
                    <Receipt className="size-8 text-text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">No hay cuentas para este período</p>
                    <p className="text-xs text-text-secondary mt-1">Probá cambiando las fechas o el filtro de período</p>
                  </div>
                  <Button variant="secondary" size="sm" icon={<Calendar className="size-3.5" />} onClick={() => handlePeriodoChange('personalizado')}>
                    Cambiar fechas
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto overscroll-behavior-contain">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th scope="col" className="pb-2 pr-2 font-medium text-text-secondary">#</th>
                        <th scope="col" className="pb-2 pr-2 font-medium text-text-secondary hidden sm:table-cell">Fecha</th>
                        <th scope="col" className="pb-2 pr-2 font-medium text-text-secondary hidden md:table-cell">Tipo</th>
                        <th scope="col" className="pb-2 pr-2 font-medium text-text-secondary hidden lg:table-cell">Mesa</th>
                        <th scope="col" className="pb-2 pr-2 font-medium text-text-secondary hidden xl:table-cell">Cliente</th>
                        <th scope="col" className="pb-2 pr-2 font-medium text-text-secondary text-right">Total</th>
                        <th scope="col" className="pb-2 pr-2 font-medium text-text-secondary hidden md:table-cell">DTE</th>
                        <th scope="col" className="pb-2 font-medium text-text-secondary text-right w-[40px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.cuentas.map((cuenta, i) => (
                        <tr
                          key={cuenta.id}
                          className={`
                            border-b border-border/30 hover:bg-amber-50/30 dark:hover:bg-amber-950/10 transition-colors duration-200
                            ${i % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-bg-surface/30 dark:bg-bg-surface/5'}
                          `}
                        >
                          <td className="py-2.5 pr-2">
                            <span className="font-mono text-[13px] text-pos-accent font-bold tabular-nums">
                              {cuenta.numero_orden}
                            </span>
                          </td>
                          <td className="py-2.5 pr-2 text-text-secondary hidden sm:table-cell whitespace-nowrap">
                            {fechaLegible(cuenta.creado_en)}
                          </td>
                          <td className="py-2.5 pr-2 hidden md:table-cell">
                            <span className="text-text-primary">{TIPO_LABELS[cuenta.tipo] ?? cuenta.tipo}</span>
                          </td>
                          <td className="py-2.5 pr-2 hidden lg:table-cell text-text-secondary">
                            {cuenta.mesa_numero ?? <span className="text-text-secondary/50">—</span>}
                          </td>
                          <td className="py-2.5 pr-2 max-w-[140px] truncate hidden xl:table-cell text-text-secondary">
                            {cuenta.cliente_nombre ?? <span className="text-text-secondary/50">Consumidor Final</span>}
                          </td>
                          <td className="py-2.5 pr-2 text-right font-mono font-medium tabular-nums text-text-primary">
                            {moneda(cuenta.total ?? 0)}
                          </td>
                          <td className="py-2.5 pr-2 hidden md:table-cell">
                            {dteBadge(cuenta)}
                          </td>
                          <td className="py-2.5 text-right">
                            <div className="flex items-center justify-end gap-0.5">
                              <button
                                onClick={() => handleReprint(cuenta.id, cuenta.numero_orden)}
                                className="p-1.5 rounded-md text-text-secondary hover:text-pos-accent hover:bg-pos-accent/10 transition-colors duration-200"
                                aria-label={`Reimprimir comanda de orden #${cuenta.numero_orden}`}
                              >
                                <Printer className="size-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {data.paginacion.paginas > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-3">
                  <p className="text-xs text-text-secondary">
                    Página {data.paginacion.pagina} de {data.paginacion.paginas}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={pagina <= 1}
                      onClick={() => setPagina(p => Math.max(1, p - 1))}
                      aria-label="Página anterior"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={pagina >= data.paginacion.paginas}
                      onClick={() => setPagina(p => p + 1)}
                      aria-label="Página siguiente"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DashboardCard>
      </div>
    </div>
  )
}
