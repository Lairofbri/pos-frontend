import api from '../../api/client'

export interface CocinaItem {
  orden_id: string
  mesa_numero: number
  items: {
    id: string
    nombre: string
    cantidad: number
    notas?: string
    estado: string
    created_at: string
  }[]
  tiempo_transcurrido: number
}

export const getItemsActivos = () =>
  api.get<{ data: CocinaItem[] }>('/cocina').then(r => r.data.data)

export const getTicket = (ordenId: string) =>
  api.get(`/cocina/orden/${ordenId}/ticket`, { responseType: 'text' }).then(r => r.data)

export const marcarItemListo = (ordenId: string, itemId: string) =>
  api.patch(`/ordenes/${ordenId}/items/${itemId}`, { estado: 'listo' }).then(r => r.data)

export const marcarOrdenCompletada = (ordenId: string) =>
  api.patch(`/ordenes/${ordenId}/estado`, { estado: 'lista' }).then(r => r.data)
