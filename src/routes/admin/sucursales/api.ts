import api from '../../../api/client'

export type FiscalStatus = 'pending_link' | 'pending_mh_data' | 'ready' | 'inactive' | 'blocked'

// F4 (spec «DTE única fuente de verdad»): el POS solo LEE las sucursales
// (establecimientos) del DTE Service. El alta/edición/activación se administra
// en el DTE; por eso no se exponen helpers de escritura (el backend además
// responde 409 a `POST`/`PATCH /sucursales` desde F2).
export interface Sucursal {
  id: string
  tenant_id: string
  nombre: string
  direccion?: string
  telefono?: string
  email?: string
  es_principal: boolean
  activo: boolean
  creado_en?: string
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
  email: string | null
  es_principal: boolean
  activo: boolean
  creado_en: string | null
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
    email: raw.email ?? undefined,
    creado_en: raw.creado_en ?? undefined,
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
