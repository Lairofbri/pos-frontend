import api from '../../../api/client'
import type { Producto } from '../../../types'

export interface ProductoFiltros {
  categoria_id?: string
  busqueda?: string
  pagina?: number
  limite?: number
}

export const listarProductos = (filtros?: ProductoFiltros) =>
  api.get<{ data: Producto[] }>('/productos', { params: filtros }).then(r => r.data.data)

export const crearProducto = (data: Partial<Producto>) =>
  api.post<{ data: Producto }>('/productos', data).then(r => r.data.data)

export const actualizarProducto = (id: string, data: Partial<Producto>) =>
  api.patch<{ data: Producto }>(`/productos/${id}`, data).then(r => r.data.data)

export const desactivarProducto = (id: string) =>
  api.delete(`/productos/${id}`).then(r => r.data)
