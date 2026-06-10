import api from '../../../api/client'
import type { CajaTurno, MovimientoCaja } from '../../../types'

interface CajaTurnoRaw {
  id: string
  abierta: boolean
  monto_inicial: string
  monto_actual: string
  monto_final: string | null
  abierta_por: string
  cerrada_por: string | null
  notas_cierre: string | null
  sucursal_id: string | null
  created_at: string
  closed_at: string | null
}

interface MovimientoRaw {
  id: string
  caja_id: string
  tipo: string
  monto: string
  motivo: string
  created_at: string
  usuario: string
}

function parseCaja(raw: CajaTurnoRaw): CajaTurno {
  return {
    id: raw.id,
    abierta: raw.abierta,
    monto_inicial: parseFloat(raw.monto_inicial),
    monto_actual: parseFloat(raw.monto_actual),
    monto_final: raw.monto_final ? parseFloat(raw.monto_final) : undefined,
    abierta_por: raw.abierta_por,
    cerrada_por: raw.cerrada_por ?? undefined,
    notas_cierre: raw.notas_cierre ?? undefined,
    sucursal_id: raw.sucursal_id ?? undefined,
    created_at: raw.created_at,
    closed_at: raw.closed_at ?? undefined,
  }
}

function parseMovimiento(raw: MovimientoRaw): MovimientoCaja {
  return {
    id: raw.id,
    caja_id: raw.caja_id,
    tipo: raw.tipo as MovimientoCaja['tipo'],
    monto: parseFloat(raw.monto),
    motivo: raw.motivo,
    created_at: raw.created_at,
    usuario: raw.usuario,
  }
}

export const getCajaActiva = () =>
  api.get<{ ok: boolean; data: { caja: CajaTurnoRaw } }>('/caja/activa')
    .then(r => parseCaja(r.data.data.caja))
    .catch(() => null)

export const abrirCaja = (data: { monto_inicial: number; sucursal_id?: string; notas?: string }) =>
  api.post<{ ok: boolean; data: { caja: CajaTurnoRaw } }>('/caja/abrir', data)
    .then(r => parseCaja(r.data.data.caja))

export const cerrarCaja = (data: { monto_final: number; notas_cierre?: string; sucursal_id?: string }) =>
  api.post<{ ok: boolean; data: { caja: CajaTurnoRaw } }>('/caja/cerrar', data)
    .then(r => parseCaja(r.data.data.caja))

export const registrarMovimiento = (data: { tipo: 'retiro' | 'deposito'; monto: number; motivo: string; sucursal_id?: string }) =>
  api.post('/caja/movimiento', data).then(r => r.data)

export const getHistorialCajas = () =>
  api.get<{ ok: boolean; data: { cajas: CajaTurnoRaw[] } }>('/caja/historial')
    .then(r => r.data.data.cajas.map(parseCaja))

export const getMovimientosCaja = (cajaId: string) =>
  api.get<{ ok: boolean; data: { movimientos: MovimientoRaw[] } }>(`/caja/${cajaId}/movimientos`)
    .then(r => r.data.data.movimientos.map(parseMovimiento))
