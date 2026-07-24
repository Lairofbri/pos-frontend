import { useState, useCallback, useMemo } from 'react'
import { Eye, FileText } from 'lucide-react'
import reportesApi from '../../../api/reportesClient'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DatePicker } from '@/components/ui/DatePicker'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { PageHeader } from '../../../components/shared/PageHeader'
import { DashboardCard } from '../../../components/shared/DashboardCard'
import type { AxiosError } from 'axios'

interface Parametro {
  nombre: string
  label: string
  tipo: 'date' | 'select' | 'number'
  opciones?: { value: string; label: string }[]
  defecto?: string
}

interface Columna {
  header: string
  key: string
  formato?: 'moneda' | 'numero' | 'fecha'
}

export interface ReporteConfig {
  id: string
  nombre: string
  descripcion: string
  endpoint: string
  parametros: Parametro[]
  columnas: Columna[]
  pdfFilename: string
  nota?: string
}

interface Props {
  titulo: string
  categoria: string
  reportes: ReporteConfig[]
}

type Fila = Record<string, string | number>

export function ReporteGenerico({ titulo, categoria, reportes }: Props) {
  const [reporte, setReporte] = useState(reportes[0])
  const [filtros, setFiltros] = useState<Record<string, string>>({})
  const [datos, setDatos] = useState<Fila[] | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const actualizarFiltro = useCallback((nombre: string, valor: string) => {
    setFiltros(prev => ({ ...prev, [nombre]: valor }))
  }, [])

  const columnasTabla = useMemo(() => reporte.columnas.map(col => ({
    key: col.key as keyof Fila,
    header: col.header,
    render: (item: Fila) => {
      const val = item[col.key]
      if (col.formato === 'moneda') {
        const n = Number(val)
        return isNaN(n) ? val : `$${n.toLocaleString('es-SV', { minimumFractionDigits: 2 })}`
      }
      if (col.formato === 'numero') {
        const n = Number(val)
        return isNaN(n) ? val : n.toLocaleString('es-SV')
      }
      if (col.formato === 'fecha') {
        if (typeof val === 'string' && val.includes('T')) {
          return new Date(val).toLocaleDateString('es-SV')
        }
      }
      return val
    }
  })), [reporte])

  const generarPDF = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('formato', 'pdf')
      for (const p of reporte.parametros) {
        const val = filtros[p.nombre]
        if (val) params.set(p.nombre, val)
      }
      const url = `${reporte.endpoint}?${params.toString()}`
      const res = await reportesApi.get(url, { responseType: 'blob' })

      const blob = new Blob([res.data], { type: 'application/pdf' })
      const blobUrl = URL.createObjectURL(blob)
      window.open(blobUrl, '_blank')
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000)
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: string }>
      setError(axiosErr?.response?.data?.error || axiosErr?.message || 'Error al generar PDF')
    } finally {
      setCargando(false)
    }
  }, [reporte, filtros])

  const previsualizar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      for (const p of reporte.parametros) {
        const val = filtros[p.nombre]
        if (val) params.set(p.nombre, val)
      }
      const res = await reportesApi.get(reporte.endpoint, { params })
      setDatos(res.data.datos || res.data)
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: string }>
      setError(axiosErr?.response?.data?.error || axiosErr?.message || 'Error al obtener datos')
    } finally {
      setCargando(false)
    }
  }, [reporte, filtros])

  return (
    <div>
      <PageHeader
        title={titulo}
        subtitle={categoria}
        backTo="/admin/reportes"
      />

      <div className="flex flex-col gap-4">
        {/* Selector de reporte */}
        <DashboardCard title="Reporte">
          <Select
            label="Reporte"
            value={reporte.id}
            onValueChange={(v) => {
              const r = reportes.find(r => r.id === v) || reportes[0]
              setReporte(r)
              setDatos(null)
              setError(null)
              setFiltros({})
            }}
            options={reportes.map(r => ({ value: r.id, label: r.nombre }))}
          />
          {reporte.nota && (
            <p className="text-xs text-text-secondary mt-1">{reporte.nota}</p>
          )}
        </DashboardCard>

        {/* Parámetros */}
        {reporte.parametros.length > 0 && (
          <DashboardCard title="Parámetros">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reporte.parametros.map(p => {
                const val = filtros[p.nombre] ?? p.defecto ?? ''
                if (p.tipo === 'select' && p.opciones) {
                  return (
                    <Select
                      key={p.nombre}
                      label={p.label}
                      value={val}
                      onValueChange={(v) => actualizarFiltro(p.nombre, v)}
                      options={p.opciones}
                    />
                  )
                }
                if (p.tipo === 'date') {
                  return (
                    <DatePicker
                      key={p.nombre}
                      label={p.label}
                      value={val ? new Date(val) : undefined}
                      onChange={(d) => actualizarFiltro(p.nombre, d ? d.toISOString().slice(0, 10) : '')}
                    />
                  )
                }
                return (
                  <Input
                    key={p.nombre}
                    label={p.label}
                    type={p.tipo}
                    value={val}
                    onChange={e => actualizarFiltro(p.nombre, e.target.value)}
                  />
                )
              })}
            </div>
          </DashboardCard>
        )}

        {/* Acciones */}
        <div className="flex gap-3 flex-wrap">
          <Button onClick={previsualizar} loading={cargando} icon={<Eye className="size-4" />}>
            Vista Previa
          </Button>
          <Button onClick={generarPDF} loading={cargando} variant="secondary" icon={<FileText className="size-4" />}>
            Generar PDF
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm" role="alert">
            {error}
          </div>
        )}

        {/* Vista previa */}
        {datos && (
          <DashboardCard title="Vista Previa">
            {datos.length === 0 ? (
              <p className="text-text-secondary text-sm">Sin datos para los filtros seleccionados.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {reporte.columnas.map(col => (
                      <TableHead key={col.key} className="text-xs font-semibold uppercase tracking-wider">
                        {col.header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datos.map((fila, i) => (
                    <TableRow key={i}>
                      {reporte.columnas.map(col => {
                        const colDef = columnasTabla.find(c => c.key === col.key)
                        return (
                          <TableCell key={col.key}>
                            {colDef?.render ? colDef.render(fila) : String(fila[col.key] ?? '')}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DashboardCard>
        )}
      </div>
    </div>
  )
}
