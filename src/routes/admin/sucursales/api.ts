import api from '../../../api/client'

export type FiscalStatus = 'pending_link' | 'pending_mh_data' | 'ready' | 'inactive' | 'blocked'

export interface Sucursal {
  id: string
  tenant_id: string
  nombre: string
  direccion?: string
  telefono?: string
  es_principal: boolean
  activo: boolean
  creado_en: string
  branch_id?: string
  dte_establecimiento_id?: string
  fiscal_status?: FiscalStatus
  sync_error?: string
  last_fiscal_sync_at?: string
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
  branch_id: string | null
  dte_establecimiento_id: string | null
  fiscal_status: FiscalStatus | null
  sync_error: string | null
  last_fiscal_sync_at: string | null
}

function parseSucursal(raw: SucursalRaw): Sucursal {
  return {
    ...raw,
    direccion: raw.direccion ?? undefined,
    telefono: raw.telefono ?? undefined,
    branch_id: raw.branch_id ?? undefined,
    dte_establecimiento_id: raw.dte_establecimiento_id ?? undefined,
    fiscal_status: raw.fiscal_status ?? undefined,
    sync_error: raw.sync_error ?? undefined,
    last_fiscal_sync_at: raw.last_fiscal_sync_at ?? undefined,
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