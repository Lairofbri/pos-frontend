import api from '../../api/client'
import type { Producto, Orden, OrdenItem, Categoria, Mesa, Pago } from '../../types'

interface ProductoRaw {
  id: string; nombre: string; descripcion: string | null
  precio: string; imagen_url: string | null; codigo: string | null
  activo: boolean; orden: number; categoria_id: string | null
  categoria_nombre: string | null; categoria_color: string | null
  tiene_stock: boolean; stock_actual: number; stock_minimo: number
}

interface OrdenRaw {
  id: string; tipo: string; estado: string; numero_orden: number
  origen: string; mesa_id: string | null; mesa_numero: string | null
  zona: string | null; cliente_id: string | null; cliente_nombre: string | null
  usuario_id: string; usuario_nombre: string | null
  subtotal: string; porcentaje_descuento: string; descuento: string
  total: string; gravado: string; iva: string
  propina_porcentaje: string; propina_monto: string
  notas: string | null
  creado_en: string; actualizado_en: string | null; cerrado_en: string | null
  items?: OrdenItem[] | null; pagos?: PagoRaw[] | null
}

interface PagoRaw {
  id: string; metodo: string
  monto_efectivo: string; monto_tarjeta: string
  total_pagado: string; vuelto: string
  referencia_tarjeta: string | null; creado_en: string
}

function parseProducto(r: ProductoRaw): Producto {
  return {
    id: r.id, nombre: r.nombre, descripcion: r.descripcion ?? undefined,
    precio: parseFloat(r.precio), imagen_url: r.imagen_url ?? undefined,
    codigo: r.codigo ?? undefined, activo: r.activo, orden: r.orden,
    categoria_id: r.categoria_id ?? undefined,
    categoria_nombre: r.categoria_nombre ?? undefined,
    categoria_color: r.categoria_color ?? undefined,
    tiene_stock: r.tiene_stock, stock_actual: r.stock_actual, stock_minimo: r.stock_minimo,
  }
}

function parsePago(r: PagoRaw): Pago {
  return {
    id: r.id, metodo: r.metodo as Pago['metodo'],
    monto_efectivo: parseFloat(r.monto_efectivo),
    monto_tarjeta: parseFloat(r.monto_tarjeta),
    total_pagado: parseFloat(r.total_pagado),
    vuelto: parseFloat(r.vuelto),
    referencia_tarjeta: r.referencia_tarjeta ?? undefined,
    creado_en: r.creado_en,
  }
}

function parseOrden(r: OrdenRaw): Orden {
  return {
    id: r.id, tipo: r.tipo as Orden['tipo'],
    estado: r.estado as Orden['estado'],
    numero_orden: r.numero_orden, origen: r.origen,
    mesa_id: r.mesa_id ?? undefined,
    mesa_numero: r.mesa_numero ?? undefined,
    zona: r.zona ?? undefined,
    cliente_id: r.cliente_id ?? undefined,
    cliente_nombre: r.cliente_nombre ?? undefined,
    usuario_id: r.usuario_id,
    usuario_nombre: r.usuario_nombre ?? '',
    subtotal: parseFloat(r.subtotal),
    porcentaje_descuento: parseFloat(r.porcentaje_descuento || '0'),
    descuento: parseFloat(r.descuento || '0'),
    total: parseFloat(r.total),
    gravado: parseFloat(r.gravado || '0'),
    iva: parseFloat(r.iva || '0'),
    propina_porcentaje: parseFloat(r.propina_porcentaje || '0'),
    propina_monto: parseFloat(r.propina_monto || '0'),
    notas: r.notas ?? undefined,
    items: r.items ?? [],
    pagos: r.pagos?.map(parsePago) ?? [],
    creado_en: r.creado_en,
    actualizado_en: r.actualizado_en ?? undefined,
    cerrado_en: r.cerrado_en ?? undefined,
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
