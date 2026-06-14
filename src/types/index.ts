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
  mesa_numero: string
  zona: string
  cliente_nombre?: string
  usuario_id?: string
  usuario_nombre?: string
  estado: 'abierta' | 'en_proceso' | 'lista' | 'entregada' | 'pagada' | 'cancelada'
  items: OrdenItem[]
  total: number
  notas?: string
  porcentaje_descuento?: number
  created_at: string
}

export interface OrdenItem {
  id: string
  producto_id: string
  nombre: string
  cantidad: number
  precio_unitario: number
  notas?: string
  estado: 'pendiente' | 'en_proceso' | 'listo' | 'cancelado'
  descuento_porcentaje?: number
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

export interface CajaMetodoResumen {
  metodo: string
  cantidad_ordenes: number
  total: number
}

export interface CajaTurno {
  id: string
  estado: 'abierta' | 'cerrada'
  monto_inicial: number
  total_esperado: number
  total_ventas: number
  total_efectivo: number
  total_tarjeta: number
  total_retiros: number
  total_depositos: number
  monto_final?: number
  diferencia?: number
  usuario_apertura: string
  usuario_cierre?: string
  fecha_apertura: string
  fecha_cierre?: string
  sucursal_id?: string
  notas_apertura?: string
  notas_cierre?: string
  metodos?: CajaMetodoResumen[]
}

export interface MovimientoCaja {
  id: string
  tipo: string
  monto: number
  motivo: string
  created_at: string
  usuario: string
}
