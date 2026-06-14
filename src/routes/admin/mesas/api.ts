import api from '../../../api/client'
import type { Mesa } from '../../../types'

interface MesaRaw {
  id: string
  numero: string
  nombre: string | null
  capacidad: number
  zona: string
  activo: boolean
  ocupada: boolean | null
  sucursal_id: string | null
}

function parseMesa(raw: MesaRaw): Mesa {
  return {
    id: raw.id,
    numero: raw.numero,
    nombre: raw.nombre ?? undefined,
    capacidad: raw.capacidad,
    zona: raw.zona,
    activo: raw.activo,
    ocupada: raw.ocupada ?? undefined,
    sucursal_id: raw.sucursal_id ?? undefined,
  }
}

export const listarMesas = (todas?: boolean) =>
  api.get<{ ok: boolean; data: { mesas: MesaRaw[] } }>('/mesas', { params: todas ? { todas: true } : {} })
    .then(r => r.data.data.mesas.map(parseMesa))

export const crearMesa = (data: { numero: string; nombre?: string; capacidad: number; zona: string; sucursal_id?: string }) =>
  api.post<{ ok: boolean; data: { mesa: MesaRaw } }>('/mesas', data)
    .then(r => parseMesa(r.data.data.mesa))

export const actualizarMesa = (id: string, data: Partial<{ numero: string; nombre: string; capacidad: number; zona: string; activo: boolean }>) =>
  api.patch<{ ok: boolean; data: { mesa: MesaRaw } }>(`/mesas/${id}`, data)
    .then(r => parseMesa(r.data.data.mesa))
