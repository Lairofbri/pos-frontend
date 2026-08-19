import api from '../../api/client'
import type { Mesa } from '../../types'
import type { ResumenDiario } from '../admin/caja/api'
import type { RentabilidadProducto, EvolucionRow } from '../admin/productos/api'

export { type ResumenDiario }
export type { RentabilidadProducto, EvolucionRow }

export interface DashboardAlerta {
  id: string
  severity: 'critical' | 'warning' | 'info'
  titulo: string
  descripcion: string
  accion?: { label: string; ruta: string }
}

export function getMesas(): Promise<Mesa[]> {
  return api.get<{ ok: boolean; data: { mesas: Mesa[] } }>('/mesas')
    .then(r => r.data.data.mesas)
    .catch(() => [])
}

export function getResumenHoy(): Promise<ResumenDiario> {
  return api.get<{ ok: boolean; data: { resumen: ResumenDiario } }>('/caja/resumen-diario')
    .then(r => r.data.data.resumen)
    .catch(() => ({
      total_ordenes: 0,
      total_ingresos: '0.00',
      cantidad_ordenes: 0,
      ticket_promedio: 0,
      clientes_atendidos: 0,
      total_personas: 0,
      metodos: [],
    }))
}

export function getRentabilidadTop(): Promise<RentabilidadProducto[]> {
  return api.get<{ ok: boolean; data: { productos: RentabilidadProducto[] } }>('/productos/rentabilidad', {
    params: { orden: 'margen_desc' },
  })
    .then(r => r.data.data.productos.slice(0, 8))
    .catch(() => [])
}

export function getEvolucion7d(): Promise<EvolucionRow[]> {
  const hoy = new Date()
  const hace7d = new Date(hoy)
  hace7d.setDate(hace7d.getDate() - 7)
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  return api.get<{ ok: boolean; data: EvolucionRow[] }>('/productos/rentabilidad/evolucion', {
    params: { desde: fmt(hace7d), hasta: fmt(hoy) },
  })
    .then(r => r.data.data)
    .catch(() => [])
}
