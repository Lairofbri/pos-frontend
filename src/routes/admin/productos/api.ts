import api from '../../../api/client'
import type { Producto } from '../../../types'

export interface ProductoFiltros {
  categoria_id?: string
  busqueda?: string
  pagina?: number
  limite?: number
}

interface ProductoRaw {
  id: string
  nombre: string
  descripcion: string | null
  precio: string
  imagen_url: string | null
  codigo: string | null
  activo: boolean
  orden: number
  categoria_id: string | null
  categoria_nombre: string | null
  categoria_color: string | null
}

function parseProducto(raw: ProductoRaw): Producto {
  return {
    id: raw.id,
    nombre: raw.nombre,
    descripcion: raw.descripcion ?? undefined,
    precio: parseFloat(raw.precio),
    imagen_url: raw.imagen_url ?? undefined,
    codigo: raw.codigo ?? undefined,
    activo: raw.activo,
    categoria_id: raw.categoria_id ?? undefined,
    categoria_nombre: raw.categoria_nombre ?? undefined,
  }
}

export const listarProductos = (filtros?: ProductoFiltros) =>
  api
    .get<{ ok: boolean; data: { productos: ProductoRaw[] } }>('/productos', {
      params: filtros,
    })
    .then((r) => r.data.data.productos.map(parseProducto))

export const crearProducto = (data: Partial<Producto>) =>
  api
    .post<{ ok: boolean; data: { producto: ProductoRaw } }>('/productos', data)
    .then((r) => parseProducto(r.data.data.producto))

export const actualizarProducto = (id: string, data: Partial<Producto>) =>
  api
    .patch<{ ok: boolean; data: { producto: ProductoRaw } }>(
      `/productos/${id}`,
      data,
    )
    .then((r) => parseProducto(r.data.data.producto))

export const desactivarProducto = (id: string) =>
  api.delete(`/productos/${id}`).then((r) => r.data)
