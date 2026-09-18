import api from '../../../api/client'
import type { Promocion } from '../../../types'

interface PromocionRaw {
  id: string
  nombre: string
  tipo: string
  descuento_porcentaje: string | number | null
  volumen_minimo: number | null
  hora_inicio: string | null
  hora_fin: string | null
  dias: number[] | null
  vigente_desde: string | null
  vigente_hasta: string | null
  activo: boolean
  productos: string[] | null
}

function parsePromocion(raw: PromocionRaw): Promocion {
  return {
    id: raw.id,
    nombre: raw.nombre,
    tipo: (raw.tipo as Promocion['tipo']) || 'porcentaje',
    descuento_porcentaje: raw.descuento_porcentaje != null ? Number(raw.descuento_porcentaje) : null,
    volumen_minimo: raw.volumen_minimo ?? null,
    hora_inicio: raw.hora_inicio ?? null,
    hora_fin: raw.hora_fin ?? null,
    dias: raw.dias ?? null,
    vigente_desde: raw.vigente_desde ?? null,
    vigente_hasta: raw.vigente_hasta ?? null,
    activo: raw.activo,
    productos: raw.productos ?? [],
  }
}

export const listarPromociones = () =>
  api.get<{ ok: boolean; data: { promociones: PromocionRaw[] } }>('/promociones')
    .then(r => r.data.data.promociones.map(parsePromocion))

export const obtenerPromocion = (id: string) =>
  api.get<{ ok: boolean; data: { promocion: PromocionRaw } }>(`/promociones/${id}`)
    .then(r => parsePromocion(r.data.data.promocion))

export interface PromocionPayload {
  nombre: string
  tipo: Promocion['tipo']
  descuento_porcentaje?: number | null
  volumen_minimo?: number | null
  hora_inicio?: string | null
  hora_fin?: string | null
  dias?: number[] | null
  vigente_desde?: string | null
  vigente_hasta?: string | null
  activo?: boolean
  productos: string[]
}

export const crearPromocion = (data: PromocionPayload) =>
  api.post<{ ok: boolean; data: { promocion: PromocionRaw } }>('/promociones', data)
    .then(r => parsePromocion(r.data.data.promocion))

export const actualizarPromocion = (id: string, data: Partial<PromocionPayload>) =>
  api.put<{ ok: boolean; data: { promocion: PromocionRaw } }>(`/promociones/${id}`, data)
    .then(r => parsePromocion(r.data.data.promocion))

export const desactivarPromocion = (id: string) =>
  api.delete<{ ok: boolean; data: { promocion: PromocionRaw } }>(`/promociones/${id}`)
    .then(r => parsePromocion(r.data.data.promocion))

export interface PromocionReporteRow {
  id: string
  nombre: string
  tipo: string
  ventas: number
  lineas: number
  total_descontado: number
}

export const reportePromociones = (params?: { desde?: string; hasta?: string }) =>
  api.get<{ ok: boolean; data: { reporte: PromocionReporteRow[] } }>('/promociones/reporte', { params })
    .then(r => (r.data.data.reporte || []).map(row => ({ ...row, total_descontado: Number(row.total_descontado) })))
