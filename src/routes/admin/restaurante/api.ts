import api from '../../../api/client'

export interface Restaurante {
  id: string
  nombre: string
  nit: string | null
  nrc: string | null
  direccion: string | null
  telefono: string | null
  email: string | null
  logo_url: string | null
  plan: string
  pos_default_mode: 'mesas' | 'rapido'
}

export interface ActualizarRestauranteData {
  nombre?: string
  nit?: string
  nrc?: string
  direccion?: string
  telefono?: string
  email?: string
  logo_url?: string
  pos_default_mode?: 'mesas' | 'rapido'
}

interface RestauranteRaw {
  id: string
  nombre: string
  nit: string | null
  nrc: string | null
  direccion: string | null
  telefono: string | null
  email: string | null
  logo_url: string | null
  plan: string
  pos_default_mode: string
}

function parseRestaurante(raw: RestauranteRaw): Restaurante {
  return {
    ...raw,
    pos_default_mode: raw.pos_default_mode === 'rapido' ? 'rapido' : 'mesas',
  }
}

export const obtenerRestaurante = () =>
  api.get<{ ok: boolean; data: { restaurante: RestauranteRaw } }>('/restaurante')
    .then(r => parseRestaurante(r.data.data.restaurante))

export const actualizarRestaurante = (data: ActualizarRestauranteData) =>
  api.put<{ ok: boolean; data: { restaurante: RestauranteRaw } }>('/restaurante', data)
    .then(r => parseRestaurante(r.data.data.restaurante))

// ─────────────────────────────────────────────
// Estado fiscal (Fase 4) — consulta de LECTURA del DTE Service.
// Nunca expone secretos Hacienda (spec §3.3).
// ─────────────────────────────────────────────

export interface EstadoFiscoEstablecimiento {
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
  firma: {
    estado: string
    firmador_disponible: boolean
    credencial_firma_disponible: boolean
  } | null
  establecimientos: EstadoFiscoEstablecimiento[]
}

export const getEstadoFiscal = () =>
  api.get<{ ok: boolean; data: EstadoFiscal }>('/provisioning/estado-fiscal')
    .then(r => r.data.data)
