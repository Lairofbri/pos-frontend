import api from './client'
import type { Categoria } from '../types'

interface CategoriaRaw {
  id: string
  parent_id: string | null
  nombre: string
  descripcion: string | null
  orden: number
  icono: string | null
  color: string | null
  activo: boolean
  hijos?: CategoriaRaw[]
  modulo?: string
}

function parseCategoria(raw: CategoriaRaw): Categoria {
  return {
    id: raw.id,
    parent_id: raw.parent_id,
    nombre: raw.nombre,
    descripcion: raw.descripcion ?? undefined,
    orden: raw.orden,
    icono: raw.icono ?? undefined,
    color: raw.color ?? undefined,
    activo: raw.activo,
    hijos: raw.hijos?.map(parseCategoria),
  }
}

export const listarCategorias = (params?: { arbol?: boolean; modulo?: string }) =>
  api.get<{ ok: boolean; data: { categorias: CategoriaRaw[] } }>('/categorias', { params: { ...params, arbol: params?.arbol ?? false } })
    .then(r => r.data.data.categorias.map(parseCategoria))

export const listarArbolCategorias = (modulo?: string) =>
  api.get<{ ok: boolean; data: { categorias: CategoriaRaw[] } }>('/categorias', { params: { arbol: true, modulo } })
    .then(r => r.data.data.categorias.map(parseCategoria))

export const crearCategoria = (data: { nombre: string; parent_id?: string | null; icono?: string; modulo?: string }) =>
  api.post<{ ok: boolean; data: { categoria: CategoriaRaw } }>('/categorias', data)
    .then(r => parseCategoria(r.data.data.categoria))

export const actualizarCategoria = (id: string, data: Partial<Categoria>) =>
  api.patch<{ ok: boolean; data: { categoria: CategoriaRaw } }>(`/categorias/${id}`, data)
    .then(r => parseCategoria(r.data.data.categoria))

export const eliminarCategoria = (id: string) =>
  api.delete(`/categorias/${id}`).then(r => r.data)
