import api from '../../../api/client'

export interface Impresora {
  id: string
  tenant_id: string
  nombre: string
  tipo: 'ticket-consumo' | 'cocina' | 'pre-cuenta'
  conexion: string
  ip: string
  puerto: number
  papel_mm: number
  caracteres_x_linea: number
  activo: boolean
  creado_en: string
  actualizado_en: string
}

export const listarImpresoras = () =>
  api.get<{ ok: boolean; data: Impresora[] }>('/impresion')
    .then(r => r.data.data)

export const crearImpresora = (data: Partial<Impresora>) =>
  api.post<{ ok: boolean; data: Impresora }>('/impresion', data)
    .then(r => r.data.data)

export const actualizarImpresora = (id: string, data: Partial<Impresora>) =>
  api.put<{ ok: boolean; data: Impresora }>(`/impresion/${id}`, data)
    .then(r => r.data.data)

export const eliminarImpresora = (id: string) =>
  api.delete(`/impresion/${id}`).then(r => r.data)

export const probarImpresora = (impresoraId: string) =>
  api.post<{ ok: boolean; data: { impreso: boolean; mensaje: string } }>('/impresion/test', { impresora_id: impresoraId })
    .then(r => r.data.data)

export const imprimirTicket = (ordenId: string, tipo: 'pre-cuenta' | 'ticket-consumo' | 'factura', impresoraId?: string) =>
  api.post<{ ok: boolean; data: { impreso: boolean; impresora: string } }>(`/impresion/print/${ordenId}`, { tipo, impresora_id: impresoraId })
    .then(r => r.data.data)
