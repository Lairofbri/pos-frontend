import api from '../../api/client'
import type { Mesa } from '../../types'

export interface DashboardMetrics {
  ventas_hoy: number
  ticket_promedio: number
  ordenes_hoy: number
  clientes_hoy: number
  trend_ventas: number
  trend_ordenes: number
}

export interface DashboardAlerta {
  id: string
  severity: 'critical' | 'warning' | 'info'
  icon: string
  titulo: string
  descripcion: string
  accion?: { label: string; ruta: string }
}

export interface ProductoTop {
  id: string
  nombre: string
  icono: string
  cantidad: number
  total: number
}

export interface VentaHora {
  hora: string
  total: number
}

export function getDashboardMetrics(): Promise<DashboardMetrics> {
  return api.get<{ ok: boolean; data: DashboardMetrics }>('/dashboard/metricas')
    .then(r => r.data.data)
    .catch(() => ({
      ventas_hoy: 1250.75,
      ticket_promedio: 18.50,
      ordenes_hoy: 68,
      clientes_hoy: 142,
      trend_ventas: 12.5,
      trend_ordenes: 8.3,
    }))
}

export function getMesas(): Promise<Mesa[]> {
  return api.get<{ ok: boolean; data: { mesas: Mesa[] } }>('/mesas')
    .then(r => r.data.data.mesas)
    .catch(() => [])
}

export function getTopProductos(): Promise<ProductoTop[]> {
  return api.get<{ ok: boolean; data: { productos: ProductoTop[] } }>('/dashboard/top-productos')
    .then(r => r.data.data.productos)
    .catch(() => [
      { id: '1', nombre: 'Hamburguesa Clásica', icono: '🍔', cantidad: 42, total: 294.00 },
      { id: '2', nombre: 'Pizza Pepperoni', icono: '🍕', cantidad: 28, total: 336.00 },
      { id: '3', nombre: 'Papas Fritas', icono: '🍟', cantidad: 35, total: 105.00 },
      { id: '4', nombre: 'Refresco Cola', icono: '🥤', cantidad: 50, total: 75.00 },
      { id: '5', nombre: 'Ensalada César', icono: '🥗', cantidad: 18, total: 126.00 },
    ])
}

export function getVentasPorHora(): Promise<VentaHora[]> {
  return api.get<{ ok: boolean; data: { horas: VentaHora[] } }>('/dashboard/ventas-por-hora')
    .then(r => r.data.data.horas)
    .catch(() => [
      { hora: '10:00', total: 0 }, { hora: '11:00', total: 85.50 },
      { hora: '12:00', total: 245.00 }, { hora: '13:00', total: 312.00 },
      { hora: '14:00', total: 180.00 }, { hora: '15:00', total: 65.00 },
      { hora: '16:00', total: 42.00 }, { hora: '17:00', total: 98.00 },
      { hora: '18:00', total: 223.50 },
    ])
}

export function getAlertas(): DashboardAlerta[] {
  return [
    {
      id: '1', severity: 'critical', icon: '⚠️',
      titulo: 'Stock bajo de ingredientes',
      descripcion: '3 productos tienen stock por debajo del mínimo. Revisa inventario.',
      accion: { label: 'Ver stock', ruta: '/admin/productos' },
    },
    {
      id: '2', severity: 'warning', icon: '⏱️',
      titulo: 'Órdenes demoradas en cocina',
      descripcion: '2 órdenes llevan más de 30 min en preparación.',
      accion: { label: 'Ver cocina', ruta: '/cocina' },
    },
    {
      id: '3', severity: 'info', icon: '🪙',
      titulo: 'Caja sin cerrar del turno anterior',
      descripcion: 'Se recomienda cerrar la caja para iniciar el nuevo turno.',
      accion: { label: 'Ir a caja', ruta: '/admin/caja' },
    },
  ]
}

export function getCajaActiva() {
  return api.get<{ ok: boolean; data: any }>('/caja/activa')
    .then(r => r.data.data)
}
