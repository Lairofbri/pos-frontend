import api from '../../../api/client'
import type { CajaTurno, CajaCuadre, MovimientoCaja } from '../../../types'

interface CajaTurnoRaw {
  id: string
  estado: string
  monto_inicial: string
  usuario_apertura: string
  usuario_cierre: string | null
  fecha_apertura: string
  fecha_cierre: string | null
  notas_apertura: string | null
  notas_cierre: string | null
}

function parseCaja(raw: CajaTurnoRaw): CajaTurno {
  return {
    id: raw.id,
    estado: raw.estado as CajaTurno['estado'],
    monto_inicial: parseFloat(raw.monto_inicial),
    usuario_apertura: raw.usuario_apertura,
    usuario_cierre: raw.usuario_cierre ?? undefined,
    fecha_apertura: raw.fecha_apertura,
    fecha_cierre: raw.fecha_cierre ?? undefined,
    notas_apertura: raw.notas_apertura ?? undefined,
    notas_cierre: raw.notas_cierre ?? undefined,
  }
}

export const getCajaActiva = () =>
  api.get('/caja/activa')
    .then(r => {
      const d = r.data.data
      const raw = d.caja ?? d
      return parseCaja(raw)
    })
    .catch((err) => {
      if (err?.response?.status === 404) return null
      throw err
    })

interface MovimientoRaw {
  id: string
  tipo: string
  monto: string
  motivo: string
  metodo_pago: string | null
  orden_id: string | null
  usuario_nombre: string
  creado_en: string
}

function parseMovimiento(raw: MovimientoRaw): MovimientoCaja {
  return {
    id: raw.id,
    tipo: raw.tipo as MovimientoCaja['tipo'],
    monto: parseFloat(raw.monto),
    motivo: raw.motivo,
    metodo_pago: raw.metodo_pago ?? undefined,
    orden_id: raw.orden_id ?? undefined,
    usuario_nombre: raw.usuario_nombre,
    creado_en: raw.creado_en,
  }
}

export const abrirCaja = (data: { monto_inicial: number; notas?: string }) =>
  api.post<{ ok: boolean; data: { caja: CajaTurnoRaw } }>('/caja/abrir', data)
    .then(r => parseCaja(r.data.data.caja))

export const cerrarCaja = (data: { monto_final: number; notas_cierre?: string }) =>
  api.post<{ ok: boolean; data: { caja: CajaTurnoRaw } }>('/caja/cerrar', data)
    .then(r => parseCaja(r.data.data.caja))

export const registrarMovimiento = (data: { tipo: 'retiro' | 'deposito'; monto: number; motivo: string }) =>
  api.post('/caja/movimiento', data).then(r => r.data)

export const getHistorialCajas = () =>
  api.get('/caja/historial')
    .then(r => r.data.data.cajas.map(parseCaja))

export const getMovimientosCaja = (cajaId: string) =>
  api.get(`/caja/${cajaId}/movimientos`)
    .then(r => (r.data.data.movimientos ?? []).map(parseMovimiento))

export const verificarCuadre = (monto_final: number) =>
  api.post<{ ok: boolean; data: { cuadra: boolean; mensaje: string; diferencia: number; total_esperado: number } }>('/caja/verificar-cuadre', { monto_final })
    .then(r => r.data.data)

export const obtenerCuadre = (id: string) =>
  api.get<{ ok: boolean; data: { cuadre: CajaCuadreRaw } }>(`/caja/cuadre/${id}`)
    .then(r => parseCajaCuadre(r.data.data.cuadre))

export interface ResumenMetodo {
  metodo: string
  cantidad_ordenes: number
  total: string
}

export interface ResumenDiario {
  total_ordenes: number
  total_ingresos: string
  cantidad_ordenes: number
  ticket_promedio: number
  clientes_atendidos: number
  total_personas: number
  metodos: ResumenMetodo[]
}

export const getResumenDiario = (fecha?: string) =>
  api.get('/caja/resumen-diario', { params: fecha ? { fecha } : {} })
    .then(r => r.data.data.resumen as ResumenDiario)

interface CajaCuadreRaw {
  id: string; estado: string
  monto_inicial: string; total_esperado: string
  monto_final: string; diferencia: string
  total_ventas: string; total_efectivo: string
  total_tarjeta: string; total_retiros: string; total_depositos: string
  notas_cierre: string | null
  usuario_apertura: string; usuario_cierre: string | null
  fecha_apertura: string; fecha_cierre: string | null
  metodos: { metodo: string; cantidad_ordenes: number; total: string }[]
  movimientos: MovimientoRaw[]
}

function parseCajaCuadre(raw: CajaCuadreRaw): CajaCuadre {
  return {
    id: raw.id, estado: raw.estado,
    monto_inicial: parseFloat(raw.monto_inicial),
    total_esperado: parseFloat(raw.total_esperado),
    monto_final: parseFloat(raw.monto_final),
    diferencia: parseFloat(raw.diferencia),
    total_ventas: parseFloat(raw.total_ventas),
    total_efectivo: parseFloat(raw.total_efectivo),
    total_tarjeta: parseFloat(raw.total_tarjeta),
    total_retiros: parseFloat(raw.total_retiros),
    total_depositos: parseFloat(raw.total_depositos),
    notas_cierre: raw.notas_cierre ?? undefined,
    usuario_apertura: raw.usuario_apertura,
    usuario_cierre: raw.usuario_cierre ?? undefined,
    fecha_apertura: raw.fecha_apertura,
    fecha_cierre: raw.fecha_cierre ?? undefined,
    metodos: raw.metodos.map(m => ({ ...m, total: parseFloat(m.total) })),
    movimientos: raw.movimientos.map(parseMovimiento),
  }
}
