import api from '../../../api/client'
import type { Combo } from '../../../types'

interface ComboProductoRaw {
  producto_id: string
  cantidad: number
  nombre: string
  precio: string
}

interface ComboRaw {
  id: string
  nombre: string
  precio: string
  productos: ComboProductoRaw[]
  activo: boolean
}

function parseCombo(raw: ComboRaw): Combo {
  return {
    id: raw.id,
    nombre: raw.nombre,
    precio: parseFloat(raw.precio),
    productos: raw.productos.map((p) => ({
      producto_id: p.producto_id,
      cantidad: p.cantidad,
      nombre: p.nombre,
      precio: parseFloat(p.precio),
    })),
    activo: raw.activo,
  }
}

export const listarCombos = (todas?: boolean) =>
  api.get<{ ok: boolean; data: { combos: ComboRaw[] } }>('/combos', { params: todas ? { todas: true } : {} })
    .then(r => r.data.data.combos.map(parseCombo))

export const obtenerCombo = (id: string) =>
  api.get<{ ok: boolean; data: { combo: ComboRaw } }>(`/combos/${id}`)
    .then(r => parseCombo(r.data.data.combo))

export const crearCombo = (data: { nombre: string; precio: number; productos: { producto_id: string; cantidad?: number }[] }) =>
  api.post<{ ok: boolean; data: { combo: ComboRaw } }>('/combos', data)
    .then(r => parseCombo(r.data.data.combo))

export const actualizarCombo = (id: string, data: { nombre?: string; precio?: number; activo?: boolean; productos?: { producto_id: string; cantidad?: number }[] }) =>
  api.patch<{ ok: boolean; data: { combo: ComboRaw } }>(`/combos/${id}`, data)
    .then(r => parseCombo(r.data.data.combo))

export const eliminarCombo = (id: string) =>
  api.delete(`/combos/${id}`).then(r => r.data)
