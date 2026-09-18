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
