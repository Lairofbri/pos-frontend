import api from '../../../api/client'
import type { Combo, ComboProducto, ComboAdvertencia, ComboFaltante } from '../../../types'

interface ComboProductoRaw {
  producto_id: string
  cantidad: number
  nombre: string
  precio: string
  tiene_stock: boolean
  tiene_receta: boolean
  stock_actual: number
  se_vende: boolean
  producto_activo: boolean
  imagen_url: string | null
  costo_promedio: string
  costo_unitario: number
  costo_estimado: number
  disponible: boolean
  unidad_medida_id: string | null
  unidad_nombre: string | null
  unidad_abreviatura: string | null
  faltantes: ComboFaltante[]
}

interface ComboRaw {
  id: string
  nombre: string
  precio: string
  productos: ComboProductoRaw[]
  activo: boolean
  costo_estimado?: number
  disponible?: boolean
  advertencias?: ComboAdvertencia[]
}

function parseComboProducto(raw: ComboProductoRaw): ComboProducto {
  return {
    producto_id: raw.producto_id,
    cantidad: raw.cantidad,
    nombre: raw.nombre,
    precio: parseFloat(raw.precio),
    tiene_stock: raw.tiene_stock,
    tiene_receta: raw.tiene_receta,
    stock_actual: raw.stock_actual,
    se_vende: raw.se_vende,
    producto_activo: raw.producto_activo,
    imagen_url: raw.imagen_url ?? undefined,
    costo_promedio: parseFloat(raw.costo_promedio ?? '0'),
    costo_unitario: raw.costo_unitario,
    costo_estimado: raw.costo_estimado,
    disponible: raw.disponible,
    unidad_medida_id: raw.unidad_medida_id ?? undefined,
    unidad_nombre: raw.unidad_nombre ?? undefined,
    unidad_abreviatura: raw.unidad_abreviatura ?? undefined,
    faltantes: raw.faltantes ?? [],
  }
}

function parseCombo(raw: ComboRaw): Combo {
  return {
    id: raw.id,
    nombre: raw.nombre,
    precio: parseFloat(raw.precio),
    productos: raw.productos.map(parseComboProducto),
    activo: raw.activo,
    costo_estimado: raw.costo_estimado,
    disponible: raw.disponible,
    advertencias: raw.advertencias ?? [],
  }
}

export const listarCombos = (todas?: boolean) =>
  api.get<{ ok: boolean; data: { combos: ComboRaw[] } }>('/combos', { params: todas ? { todas: true } : {} })
    .then(r => r.data.data.combos.map(parseCombo))

export const obtenerCombo = (id: string) =>
  api.get<{ ok: boolean; data: { combo: ComboRaw } }>(`/combos/${id}`)
    .then(r => parseCombo(r.data.data.combo))

export const crearCombo = (data: { nombre: string; precio: number; productos: { producto_id: string; cantidad: number }[] }) =>
  api.post<{ ok: boolean; data: { combo: ComboRaw } }>('/combos', data)
    .then(r => parseCombo(r.data.data.combo))

export const actualizarCombo = (id: string, data: { nombre?: string; precio?: number; activo?: boolean; productos?: { producto_id: string; cantidad?: number }[] }) =>
  api.patch<{ ok: boolean; data: { combo: ComboRaw } }>(`/combos/${id}`, data)
    .then(r => parseCombo(r.data.data.combo))

export const eliminarCombo = (id: string) =>
  api.delete(`/combos/${id}`).then(r => r.data)
