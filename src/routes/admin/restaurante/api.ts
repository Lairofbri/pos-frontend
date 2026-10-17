import api from '../../../api/client'

// F4 (spec «DTE única fuente de verdad»): la identidad y la configuración
// fiscal de la empresa las expone el DTE Service a través del pos-backend.
// Desde el POS son SOLO LECTURA; lo único propio del POS es `pos_default_mode`.
export interface Restaurante {
  id: string
  nombre: string
  nombre_comercial: string | null
  nit: string | null
  nrc: string | null
  direccion: string | null
  telefono: string | null
  email: string | null
  logo_url: string | null
  plan: string | null
  pos_default_mode: 'mesas' | 'rapido'
  // Señales fiscales (sin secretos) que expone el DTE.
  codigo_actividad: string | null
  desc_actividad: string | null
  ambiente: string | null
  tiene_credenciales_hacienda: boolean
  password_firma_configurada: boolean
  provisioning_status: string | null
  activo: boolean | null
}

// F2: el backend rechaza (409) cualquier campo de empresa. Desde F4 el POS solo
// puede guardar la preferencia operativa.
export interface ActualizarRestauranteData {
  pos_default_mode?: 'mesas' | 'rapido'
}

interface RestauranteRaw {
  id: string
  nombre: string | null
  nombre_comercial: string | null
  nit: string | null
  nrc: string | null
  direccion: string | null
  telefono: string | null
  email: string | null
  logo_url: string | null
  plan: string | null
  pos_default_mode: string | null
  codigo_actividad: string | null
  desc_actividad: string | null
  ambiente: string | null
  tiene_credenciales_hacienda: boolean | null
  password_firma_configurada: boolean | null
  provisioning_status: string | null
  activo: boolean | null
}

function parseRestaurante(raw: RestauranteRaw): Restaurante {
  return {
    ...raw,
    nombre: raw.nombre ?? '',
    pos_default_mode: raw.pos_default_mode === 'rapido' ? 'rapido' : 'mesas',
    tiene_credenciales_hacienda: raw.tiene_credenciales_hacienda ?? false,
    password_firma_configurada: raw.password_firma_configurada ?? false,
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
