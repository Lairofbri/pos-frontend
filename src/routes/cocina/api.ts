import api from '../../api/client'

export interface ItemCocina {
  id: string
  producto_id: string | null
  nombre_producto: string
  cantidad: number
  notas?: string
  estado: string
  combo_id: string | null
  combo_nombre: string | null
  enviado_en: string
  enviado_por_nombre: string | null
  creado_en: string
}

export interface CocinaItem {
  orden_id: string
  numero_orden: number
  tipo: string
  origen: string
  orden_estado: string
  mesa_numero: number | null
  mesa_nombre: string | null
  items: ItemCocina[]
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
