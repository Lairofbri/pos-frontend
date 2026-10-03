import api from '../../../api/client'

export interface EstadoFirma {
  tenant_id: string | null
  nit: string | null
  estado: 'listo' | 'firmador_offline' | 'sin_credencial' | string
  firmador_disponible: boolean
  credencial_firma_disponible: boolean
}

export interface EstablecimientoFiscal {
  establecimiento_id: string
  branch_id: string | null
  fiscal_status: string
  activo: boolean
}

export interface EstadoFiscal {
  tenant_id: string
  provisioning_status: string
  credenciales_hacienda: boolean
  token_vigente: boolean
  firma: EstadoFirma
  establecimientos: EstablecimientoFiscal[]
}

export interface CrearEmpresaData {
  tenant_id: string
  operation_id: string
  nombre: string
  nit: string
  nrc?: string | null
  email?: string | null
}

export interface CrearEmpresaResultado {
  tenant_id: string
  fiscal_sync_status: string
  api_key_entregada: boolean
}

export const getEstadoFiscal = () =>
  api.get<{ ok: boolean; data: EstadoFiscal }>('/provisioning/estado-fiscal')
    .then(r => r.data.data)

export const crearEmpresa = (data: CrearEmpresaData) =>
  api.post<{ ok: boolean; data: CrearEmpresaResultado }>('/provisioning/tenants', data)
    .then(r => r.data.data)