import api from '../../api/client'
import type { Producto, Orden, OrdenItem, Categoria, Mesa } from '../../types'

interface ProductoRaw {
  id: string; nombre: string; descripcion: string | null
  precio: string; imagen_url: string | null; codigo: string | null
  activo: boolean; categoria_id: string | null
  categoria_nombre: string | null; categoria_color: string | null
}

interface OrdenRaw {
  id: string; mesa_id: string; mesa_numero: string; zona: string
  cliente_nombre: string | null; usuario_id: string; usuario_nombre: string | null
  estado: string; total: string
  notas: string | null; porcentaje_descuento: string | null
  created_at: string; items?: OrdenItem[] | null
}

function parseProducto(r: ProductoRaw): Producto {
  return {
    id: r.id, nombre: r.nombre, descripcion: r.descripcion ?? undefined,
    precio: parseFloat(r.precio), imagen_url: r.imagen_url ?? undefined,
    codigo: r.codigo ?? undefined, activo: r.activo,
    categoria_id: r.categoria_id ?? undefined,
    categoria_nombre: r.categoria_nombre ?? undefined,
  }
}

function parseOrden(r: OrdenRaw): Orden {
  return {
    id: r.id, mesa_id: r.mesa_id, mesa_numero: r.mesa_numero, zona: r.zona,
    cliente_nombre: r.cliente_nombre ?? undefined,
    usuario_id: r.usuario_id,
    usuario_nombre: r.usuario_nombre ?? undefined,
    estado: r.estado as Orden['estado'],
    total: parseFloat(r.total),
    notas: r.notas ?? undefined,
    porcentaje_descuento: r.porcentaje_descuento ? parseFloat(r.porcentaje_descuento) : undefined,
    created_at: r.created_at, items: r.items ?? [],
  }
}

export const getProductos = (categoriaId?: string) =>
  api.get<{ ok: boolean; data: { productos: ProductoRaw[] } }>('/productos', { params: categoriaId ? { categoria_id: categoriaId } : {} })
    .then(r => r.data.data.productos.map(parseProducto))

export const getCategorias = () =>
  api.get<{ ok: boolean; data: { categorias: Categoria[] } }>('/categorias')
    .then(r => r.data.data.categorias)
    .catch(() => [])

export const getMesas = () =>
  api.get<{ ok: boolean; data: { mesas: Mesa[] } }>('/mesas')
    .then(r => r.data.data.mesas)

export const getOrdenes = (params?: { mesa_id?: string }) =>
  api.get<{ ok: boolean; data: { ordenes: OrdenRaw[] } }>('/ordenes', {
    params: { ...params, activas: true },
  }).then(r => r.data.data.ordenes.map(parseOrden))

export const getOrden = (id: string) =>
  api.get<{ ok: boolean; data: { orden: OrdenRaw } }>(`/ordenes/${id}`)
    .then(r => parseOrden(r.data.data.orden))

export const crearOrden = (data: { tipo?: string; mesa_id?: string; origen?: string }) =>
  api.post<{ ok: boolean; data: { orden: OrdenRaw } }>('/ordenes', { tipo: 'mesa', origen: 'pos', ...data })
    .then(r => parseOrden(r.data.data.orden))

export const agregarItem = (ordenId: string, data: { producto_id: string; cantidad: number; notas?: string }) =>
  api.post(`/ordenes/${ordenId}/items`, data).then(r => r.data.data)

export const eliminarItem = (ordenId: string, itemId: string) =>
  api.delete(`/ordenes/${ordenId}/items/${itemId}`).then(r => r.data)

export const actualizarItem = (ordenId: string, itemId: string, data: { cantidad?: number; notas?: string; descuento_porcentaje?: number }) =>
  api.patch(`/ordenes/${ordenId}/items/${itemId}`, data).then(r => r.data.data)

export const pagarOrden = (ordenId: string, pdata: { metodo: string; monto_efectivo?: number; monto_tarjeta?: number; referencia_tarjeta?: string }) =>
  api.post(`/ordenes/${ordenId}/pagar`, pdata).then(r => r.data.data)

export const enviarCocina = (ordenId: string) =>
  api.patch(`/ordenes/${ordenId}/estado`, { estado: 'en_proceso' }).then(r => r.data.data)

export const actualizarOrden = (ordenId: string, data: { notas?: string; porcentaje_descuento?: number }) =>
  api.patch(`/ordenes/${ordenId}`, data).then(r => r.data.data)

export const cancelarOrden = (ordenId: string) =>
  api.patch(`/ordenes/${ordenId}/estado`, { estado: 'cancelada' }).then(r => r.data.data)

export const cancelarItem = (ordenId: string, itemId: string) =>
  api.patch(`/ordenes/${ordenId}/items/${itemId}`, { estado: 'cancelado' }).then(r => r.data.data)
