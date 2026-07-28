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
}) {
  return api.post<{ ok: boolean; data: { movimiento: MovimientoInventario } }>('/inventario/movimientos', data)
    .then(r => r.data.data.movimiento)
}

export function listarUnidades() {
  return api.get<{ ok: boolean; data: { unidades_medida: UnidadMedida[] } }>('/catalogos')
    .then(r => r.data.data.unidades_medida)
}
