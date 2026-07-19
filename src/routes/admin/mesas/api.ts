import api from '../../../api/client'
import type { Mesa, Orden } from '../../../types'

interface MesaRaw {
  id: string
  numero: string
  nombre: string | null
  capacidad: number
  estado: string
  activo: boolean
  orden_activa: Orden | null
}

function parseMesa(raw: MesaRaw): Mesa {
  return {
    id: raw.id,
    numero: raw.numero,
    nombre: raw.nombre ?? undefined,
    capacidad: raw.capacidad,
    estado: raw.estado as Mesa['estado'],
    activo: raw.activo,
    orden_activa: raw.orden_activa,
  }
}

export const listarMesas = (todas?: boolean) =>
  api.get<{ ok: boolean; data: { mesas: MesaRaw[] } }>('/mesas', { params: todas ? { todas: true } : {} })
    .then(r => r.data.data.mesas.map(parseMesa))

export const crearMesa = (data: { numero: string; nombre?: string; capacidad: number }) =>
  api.post<{ ok: boolean; data: { mesa: MesaRaw } }>('/mesas', data)
    .then(r => parseMesa(r.data.data.mesa))

export const actualizarMesa = (id: string, data: Partial<{ numero: string; nombre: string; capacidad: number; activo: boolean }>) =>
  api.patch<{ ok: boolean; data: { mesa: MesaRaw } }>(`/mesas/${id}`, data)
    .then(r => parseMesa(r.data.data.mesa))
