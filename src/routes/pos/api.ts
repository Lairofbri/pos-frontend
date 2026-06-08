import api from '../../api/client'
import type { Producto, Orden, Categoria, Mesa } from '../../types'

export const getProductos = (categoriaId?: string) =>
  api.get<{ data: Producto[] }>('/productos', { params: categoriaId ? { categoria_id: categoriaId } : {} })
    .then(r => r.data.data)

export const getCategorias = () =>
  api.get<{ data: Categoria[] }>('/categorias').then(r => r.data.data)

export const getMesas = (zona?: string) =>
  api.get<{ data: Mesa[] }>('/mesas', { params: zona ? { zona } : {} })
    .then(r => r.data.data)

export const getOrdenes = (params?: { mesa_id?: string; zona?: string }) =>
  api.get<{ data: Orden[] }>('/ordenes', { params }).then(r => r.data.data)

export const crearOrden = (data: { mesa_id: string }) =>
  api.post<{ data: Orden }>('/ordenes', data).then(r => r.data.data)

export const agregarItem = (ordenId: string, data: { producto_id: string; cantidad: number; notas?: string }) =>
  api.post(`/ordenes/${ordenId}/items`, data).then(r => r.data.data)

export const eliminarItem = (ordenId: string, itemId: string) =>
  api.delete(`/ordenes/${ordenId}/items/${itemId}`).then(r => r.data)

export const pagarOrden = (ordenId: string, data: { metodo: string; monto_recibido?: number; split?: number }) =>
  api.post(`/ordenes/${ordenId}/pagar`, data).then(r => r.data.data)

export const enviarCocina = (ordenId: string) =>
  api.patch(`/ordenes/${ordenId}/estado`, { estado: 'en_cocina' }).then(r => r.data.data)
