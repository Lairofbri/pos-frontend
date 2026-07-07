import api from '../../../api/client'
import type { Categoria } from '../../../types'

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

export const listarCategorias = (arbol?: boolean) =>
  api.get<{ ok: boolean; data: { categorias: CategoriaRaw[] } }>('/categorias', { params: arbol ? { arbol: true } : {} })
    .then(r => r.data.data.categorias.map(parseCategoria))

export const crearCategoria = (data: Partial<Categoria>) =>
  api.post<{ ok: boolean; data: { categoria: CategoriaRaw } }>('/categorias', data)
    .then(r => parseCategoria(r.data.data.categoria))

export const actualizarCategoria = (id: string, data: Partial<Categoria>) =>
  api.patch<{ ok: boolean; data: { categoria: CategoriaRaw } }>(`/categorias/${id}`, data)
    .then(r => parseCategoria(r.data.data.categoria))

export const eliminarCategoria = (id: string) =>
  api.delete(`/categorias/${id}`).then(r => r.data)
