import api from '../../../api/client'

export interface CuentaItem {
  id: string
  tipo: string
  estado: string
  numero_orden: number
  origen: string
  total: number
  creado_en: string
  mesa_numero: number | null
  cliente_nombre: string | null
  usuario_nombre: string | null
  total_items: number
  dte_tipo: string | null
  dte_codigo_generacion: string | null
  dte_estado: string | null
}

export interface CuentaExportItem extends CuentaItem {
  subtotal: number
  iva: number
  propina_porcentaje: number | null
  propina_monto: number | null
  actualizado_en: string | null
  dte_numero_control: string | null
  dte_json_envio: Record<string, unknown> | null
  dte_json_respuesta: Record<string, unknown> | null
  dte_emitido_en: string | null
}

export interface CuentasResponse {
  cuentas: CuentaItem[]
  paginacion: {
    total: number
    pagina: number
    limite: number
    paginas: number
  }
}

export interface CuentasParams {
  fecha_desde?: string
  fecha_hasta?: string
  tipo?: string
  pagina?: number
  limite?: number
}

export async function listarCuentas(params: CuentasParams): Promise<CuentasResponse> {
  const { data } = await api.get('/cuentas', { params })
  return data.data
}

export async function exportarCuentas(params: Omit<CuentasParams, 'pagina' | 'limite'>): Promise<CuentaExportItem[]> {
  const { data } = await api.get('/cuentas/exportar', { params })
  return data.data
}
