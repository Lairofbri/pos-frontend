import api from '../../../api/client'
import type { Categoria } from '../../../types'

interface CategoriaRaw {
  id: string
  nombre: string
  descripcion: string | null
  orden: number | null
  color: string | null
  activo: boolean
}

function parseCategoria(raw: CategoriaRaw): Categoria {
  return {
    id: raw.id,
    nombre: raw.nombre,
    descripcion: raw.descripcion ?? undefined,
    orden: raw.orden ?? undefined,
    color: raw.color ?? undefined,
    activo: raw.activo,
  }
}

export const listarCategorias = (todas?: boolean) =>
  api.get<{ ok: boolean; data: { categorias: CategoriaRaw[] } }>('/categorias', { params: todas ? { todas: true } : {} })
    .then(r => r.data.data.categorias.map(parseCategoria))

export const crearCategoria = (data: Partial<Categoria>) =>
  api.post<{ ok: boolean; data: { categoria: CategoriaRaw } }>('/categorias', data)
    .then(r => parseCategoria(r.data.data.categoria))

export const actualizarCategoria = (id: string, data: Partial<Categoria>) =>
  api.patch<{ ok: boolean; data: { categoria: CategoriaRaw } }>(`/categorias/${id}`, data)
    .then(r => parseCategoria(r.data.data.categoria))

export const eliminarCategoria = (id: string) =>
  api.delete(`/categorias/${id}`).then(r => r.data)
