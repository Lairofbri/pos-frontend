import api from '../../../api/client'
import type { Producto } from '../../../types'

export interface ProductoFiltros {
  categoria_id?: string
  busqueda?: string
  pagina?: number
  limite?: number
  tiene_stock?: boolean
  se_vende?: boolean
  tiene_receta?: boolean
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
  tiene_stock: boolean
  tiene_receta: boolean
  se_vende: boolean
  stock_actual: number
  stock_minimo: number
  unidad_medida_id: string | null
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
    orden: raw.orden,
    categoria_id: raw.categoria_id ?? undefined,
    categoria_nombre: raw.categoria_nombre ?? undefined,
    categoria_color: raw.categoria_color ?? undefined,
    tiene_stock: raw.tiene_stock,
    tiene_receta: raw.tiene_receta,
    se_vende: raw.se_vende,
    stock_actual: raw.stock_actual,
    stock_minimo: raw.stock_minimo,
    unidad_medida_id: raw.unidad_medida_id ?? undefined,
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

export const subirImagen = (id: string, file: File) => {
  const formData = new FormData()
  formData.append('imagen', file)
  return api
    .post<{ ok: boolean; data: { producto: ProductoRaw } }>(`/productos/${id}/imagen`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => parseProducto(r.data.data.producto))
}

export const eliminarImagenProducto = (id: string) =>
  api
    .delete<{ ok: boolean; data: { producto: ProductoRaw } }>(`/productos/${id}/imagen`)
    .then((r) => parseProducto(r.data.data.producto))
