import api from '../../../api/client'

export interface MovimientoInventario {
  id: string
  producto_id: string
  producto_nombre: string
  tipo_movimiento: 'compra' | 'ajuste' | 'merma' | 'devolucion' | 'consumo'
  cantidad: number
  stock_anterior: number
  stock_posterior: number
  unidad_medida_id: string | null
  unidad_nombre: string | null
  unidad_abrev: string | null
  motivo: string | null
  referencia_tipo: string | null
  creado_por_nombre: string | null
  sucursal_nombre: string | null
  costo_unitario: number | null
  movimiento_revertido_id: string | null
  creado_en: string
}

export interface AlertaStock {
  id: string
  nombre: string
  stock_actual: number
  stock_minimo: number
}

export interface ResumenInventario {
  productos_con_stock: number
  alertas_count: number
  movimientos_hoy: number
  consumido_hoy: number
  ultimos_movimientos: MovimientoInventario[]
  alertas: AlertaStock[]
}

export interface Paginacion {
  total: number
  pagina: number
  limite: number
  paginas: number
}

export interface UnidadMedida {
  id: string
  nombre: string
  abreviatura: string
  categoria: string
  factor: number
}

export function obtenerResumen(): Promise<ResumenInventario> {
  return api.get<{ ok: boolean; data: ResumenInventario }>('/inventario/resumen')
    .then(r => r.data.data)
}

export function listarMovimientos(params?: {
  pagina?: number
  limite?: number
  producto_id?: string
  tipo?: string
  desde?: string
  hasta?: string
}) {
  return api.get<{ ok: boolean; data: { movimientos: MovimientoInventario[]; paginacion: Paginacion } }>(
    '/inventario/movimientos', { params }
  ).then(r => r.data.data)
}

export function crearMovimiento(data: {
  producto_id: string
  tipo: 'compra' | 'ajuste' | 'merma' | 'devolucion'
  cantidad: number
  unidad_medida_id?: string
  motivo?: string
  costo_unitario?: number
}) {
  return api.post<{ ok: boolean; data: { movimiento: MovimientoInventario } }>('/inventario/movimientos', data)
    .then(r => r.data.data.movimiento)
}

export function listarUnidades() {
  return api.get<{ ok: boolean; data: { unidades_medida: UnidadMedida[] } }>('/catalogos')
    .then(r => r.data.data.unidades_medida)
}

export function revertirMovimiento(movimientoId: string) {
  return api.post<{ ok: boolean; data: { mensaje: string; movimiento_original_id: string; movimiento_reversion_id: string } }>(
    `/inventario/movimientos/${movimientoId}/revertir`
  ).then(r => r.data.data)
}

export interface Divergencia {
  id: string
  nombre: string
  stock_actual: number
  stock_minimo: number
  saldo_movimientos: number
  diferencia: number
}

export interface ReconciliacionResult {
  divergencias: Divergencia[]
  total_divergencias: number
  conciliado: boolean
}

export function reconciliarStock() {
  return api.get<{ ok: boolean; data: ReconciliacionResult }>('/inventario/reconciliar')
    .then(r => r.data.data)
}

export interface KardexMovimiento {
  id: string
  fecha: string
  tipo: string
  referencia: string | null
  cantidad: number
  costo_unitario: number | null
  costo_total: number | null
  stock_anterior: number
  stock_posterior: number
  creado_por: string
  revertido: boolean
}

export interface KardexResponse {
  producto: {
    id: string
    nombre: string
    costo_promedio: number
    stock_actual: number
    unidad: string
  }
  movimientos: KardexMovimiento[]
  paginacion: Paginacion
}

export function obtenerKardex(productoId: string, params?: {
  desde?: string
  hasta?: string
  pagina?: number
  limite?: number
}) {
  return api.get<{ ok: boolean; data: KardexResponse }>(
    `/inventario/kardex/${productoId}`, { params }
  ).then(r => r.data.data)
}

// ─── Sesiones de inventario físico ───

export interface SesionItem {
  id: string
  sucursal_id: string | null
  sucursal_nombre: string | null
  estado: 'abierta' | 'cerrada' | 'cancelada'
  notas: string | null
  total_productos_con_stock: number
  productos_contados: number
  creado_por_nombre: string
  creado_en: string
  cerrado_en: string | null
}

export interface ConteoItem {
  producto_id: string
  producto_nombre: string
  stock_sistema: number
  stock_fisico: number
  diferencia: number
  unidad_medida_id: string | null
  unidad_nombre: string | null
  cantidad_input: number | null
  unidad_input_id: string | null
  unidad_input_nombre: string | null
  contado_por_nombre: string | null
  contado_en: string
  hubo_movimientos: boolean
  aplicado: boolean
  ignorado: boolean
}

export interface SesionDetalle {
  id: string
  sucursal_id: string | null
  sucursal_nombre: string | null
  estado: 'abierta' | 'cerrada' | 'cancelada'
  notas: string | null
  stock_snapshot: Record<string, number>
  creado_por_nombre: string
  creado_en: string
  cerrado_por_nombre: string | null
  cerrado_en: string | null
  conteos: ConteoItem[]
  resumen: {
    total_productos: number
    contados: number
    sin_contar: number
    diferencias: number
  } | null
}

export interface CierreResult {
  ajustes_aplicados: number
  ignorados: number
  total_lineas: number
}

export function crearSesion(data: { sucursal_id?: string; notas?: string }) {
  return api.post<{ ok: boolean; data: { sesion: SesionItem & { total_productos: number; stock_snapshot: Record<string, number> } } }>(
    '/inventario/sesiones', data
  ).then(r => r.data.data.sesion)
}

export function listarSesiones(params?: {
  sucursal_id?: string
  estado?: string
  pagina?: number
  limite?: number
}) {
  return api.get<{ ok: boolean; data: { sesiones: SesionItem[]; paginacion: Paginacion } }>(
    '/inventario/sesiones', { params }
  ).then(r => r.data.data)
}

export function obtenerSesion(id: string) {
  return api.get<{ ok: boolean; data: SesionDetalle }>(
    `/inventario/sesiones/${id}`
  ).then(r => r.data.data)
}

export function registrarConteo(sesionId: string, data: {
  producto_id: string
  stock_fisico: number
  unidad_medida_id?: string
}) {
  return api.put(`/inventario/sesiones/${sesionId}/conteos`, data)
}

export function eliminarConteo(sesionId: string, productoId: string) {
  return api.delete(`/inventario/sesiones/${sesionId}/conteos/${productoId}`)
}

export function cerrarSesion(sesionId: string, data: {
  lineas: { producto_id: string; aplicar: boolean }[]
}) {
  return api.post<{ ok: boolean; data: CierreResult }>(
    `/inventario/sesiones/${sesionId}/cerrar`, data
  ).then(r => r.data.data)
}

export function cancelarSesion(sesionId: string) {
  return api.post(`/inventario/sesiones/${sesionId}/cancelar`)
}
