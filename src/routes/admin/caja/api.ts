import api from '../../../api/client'
import type { CajaTurno } from '../../../types'

interface CajaTurnoRaw {
  id: string
  estado: string
  monto_inicial: string
  total_esperado: string
  total_ventas: string
  total_efectivo: string
  total_tarjeta: string
  total_retiros: string
  total_depositos: string
  monto_final: string | null
  diferencia: string | null
  usuario_apertura: string
  usuario_cierre: string | null
  fecha_apertura: string
  fecha_cierre: string | null
  sucursal_id: string | null
  notas_apertura: string | null
  notas_cierre: string | null
  metodos: { metodo: string; cantidad_ordenes: number; total: string }[] | null
}

function parseCaja(raw: CajaTurnoRaw): CajaTurno {
  return {
    id: raw.id,
    estado: raw.estado as CajaTurno['estado'],
    monto_inicial: parseFloat(raw.monto_inicial),
    total_esperado: parseFloat(raw.total_esperado),
    total_ventas: parseFloat(raw.total_ventas),
    total_efectivo: parseFloat(raw.total_efectivo),
    total_tarjeta: parseFloat(raw.total_tarjeta),
    total_retiros: parseFloat(raw.total_retiros),
    total_depositos: parseFloat(raw.total_depositos),
    monto_final: raw.monto_final ? parseFloat(raw.monto_final) : undefined,
    diferencia: raw.diferencia ? parseFloat(raw.diferencia) : undefined,
    usuario_apertura: raw.usuario_apertura,
    usuario_cierre: raw.usuario_cierre ?? undefined,
    fecha_apertura: raw.fecha_apertura,
    fecha_cierre: raw.fecha_cierre ?? undefined,
    sucursal_id: raw.sucursal_id ?? undefined,
    notas_apertura: raw.notas_apertura ?? undefined,
    notas_cierre: raw.notas_cierre ?? undefined,
    metodos: raw.metodos?.map((m) => ({
      ...m,
      total: parseFloat(m.total),
    })) ?? undefined,
  }
}

export const getCajaActiva = () =>
  api.get('/caja/activa')
    .then(r => {
      const d = r.data.data
      const raw = d.caja ?? d
      return parseCaja(raw)
    })

export const abrirCaja = (data: { monto_inicial: number; sucursal_id?: string; notas?: string }) =>
  api.post<{ ok: boolean; data: { caja: CajaTurnoRaw } }>('/caja/abrir', data)
    .then(r => parseCaja(r.data.data.caja))

export const cerrarCaja = (data: { monto_final: number; notas_cierre?: string; sucursal_id?: string }) =>
  api.post<{ ok: boolean; data: { caja: CajaTurnoRaw } }>('/caja/cerrar', data)
    .then(r => parseCaja(r.data.data.caja))

export const registrarMovimiento = (data: { tipo: 'retiro' | 'deposito'; monto: number; motivo: string; sucursal_id?: string }) =>
  api.post('/caja/movimiento', data).then(r => r.data)

export const getHistorialCajas = () =>
  api.get('/caja/historial')
    .then(r => r.data.data.cajas.map(parseCaja))

export const getMovimientosCaja = (cajaId: string) =>
  api.get(`/caja/${cajaId}/movimientos`)
    .then(r => r.data.data.movimientos ?? [])

export interface ResumenMetodo {
  metodo: string
  cantidad_ordenes: number
  total: string
}

export interface ResumenDiario {
  total_ordenes: number
  total_ingresos: string
  metodos: ResumenMetodo[]
}

export const getResumenDiario = (fecha?: string) =>
  api.get('/caja/resumen-diario', { params: fecha ? { fecha } : {} })
    .then(r => r.data.data.resumen as ResumenDiario)
