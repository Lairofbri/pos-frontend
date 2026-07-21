import api from '../../../api/client'

export interface Sucursal {
  id: string
  tenant_id: string
  nombre: string
  direccion?: string
  telefono?: string
  es_principal: boolean
  activo: boolean
  creado_en: string
}

interface SucursalRaw {
  id: string
  tenant_id: string
  nombre: string
  direccion: string | null
  telefono: string | null
  es_principal: boolean
  activo: boolean
  creado_en: string
}

function parseSucursal(raw: SucursalRaw): Sucursal {
  return {
    ...raw,
    direccion: raw.direccion ?? undefined,
    telefono: raw.telefono ?? undefined,
  }
}

export const listarSucursales = () =>
  api.get<{ ok: boolean; data: { sucursales: SucursalRaw[] } }>('/sucursales')
    .then(r => r.data.data.sucursales.map(parseSucursal))

export const obtenerSucursal = (id: string) =>
  api.get<{ ok: boolean; data: { sucursal: SucursalRaw } }>(`/sucursales/${id}`)
    .then(r => parseSucursal(r.data.data.sucursal))

export const crearSucursal = (data: { nombre: string; direccion?: string; telefono?: string; es_principal?: boolean }) =>
  api.post<{ ok: boolean; data: { sucursal: SucursalRaw } }>('/sucursales', data)
    .then(r => parseSucursal(r.data.data.sucursal))

export const actualizarSucursal = (id: string, data: Partial<{ nombre: string; direccion: string; telefono: string; es_principal: boolean; activo: boolean }>) =>
  api.patch<{ ok: boolean; data: { sucursal: SucursalRaw } }>(`/sucursales/${id}`, data)
    .then(r => parseSucursal(r.data.data.sucursal))
