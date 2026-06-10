export interface Tenant {
  id: string
  nombre: string
  logo_url?: string
}

export interface LoginRequest {
  email: string
  password: string
  tenant_id: string
}

export interface LoginPinRequest {
  usuario_id: string
  pin: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  usuario: Usuario
}

export interface Usuario {
  id: string
  tenant_id: string
  nombre: string
  apellido?: string
  email?: string
  rol: string
  pin?: string
  sucursal_id?: string
  activo?: boolean
}

export interface MenuItem {
  id: string
  titulo: string
  icono: string
  ruta: string | null
  orden: number
  permiso_codigo?: string
  parent_id?: string | null
  activo?: boolean
  children: MenuItem[]
}

export interface MenuItemRaw {
  id: string
  titulo: string
  icono?: string
  ruta?: string | null
  parent_id?: string | null
  orden: number
  permiso_codigo?: string
  activo: boolean
}

export interface Producto {
  id: string
  nombre: string
  descripcion?: string
  precio: number
  categoria_id?: string
  categoria_nombre?: string
  codigo?: string
  imagen_url?: string
  orden?: number
  activo: boolean
}

export interface Categoria {
  id: string
  nombre: string
  descripcion?: string
  orden?: number
  color?: string
  activo: boolean
}

export interface ComboProducto {
  producto_id: string
  cantidad: number
  nombre?: string
  precio?: number
}

export interface Combo {
  id: string
  nombre: string
  precio: number
  productos: ComboProducto[]
  activo: boolean
}

export interface Mesa {
  id: string
  numero: string
  nombre?: string
  capacidad: number
  zona: string
  activo: boolean
  ocupada?: boolean
  sucursal_id?: string
}

export interface Orden {
  id: string
  mesa_id: string
  mesa_numero: number
  zona: string
  cliente_nombre?: string
  estado: 'abierta' | 'en_proceso' | 'lista' | 'entregada' | 'pagada' | 'cancelada'
  items: OrdenItem[]
  total: number
  created_at: string
}

export interface OrdenItem {
  id: string
  producto_id: string
  nombre: string
  cantidad: number
  precio_unitario: number
  modificadores?: string[]
  notas?: string
  estado: 'pendiente' | 'en_proceso' | 'listo' | 'servido'
}

export interface Cliente {
  id: string
  nombre: string
  apellido?: string
  telefono?: string
  email?: string
  tipo_documento?: 'dui' | 'nit' | 'pasaporte' | 'carnet_residente'
  numero_documento?: string
  nit?: string
  nrc?: string
  razon_social?: string
  direccion?: string
  municipio?: string
  departamento?: string
  notas?: string
  activo: boolean
}

export interface CajaTurno {
  id: string
  abierta: boolean
  monto_inicial: number
  monto_actual: number
  monto_final?: number
  abierta_por: string
  cerrada_por?: string
  notas_cierre?: string
  sucursal_id?: string
  created_at: string
  closed_at?: string
}

export interface MovimientoCaja {
  id: string
  caja_id: string
  tipo: string
  monto: number
  motivo: string
  created_at: string
  usuario: string
}
