export interface QueryDefaults {
  staleTime?: number
  retry?: number | boolean
  refetchInterval?: number | false
}

export const QUERY_CONFIG: Record<string, QueryDefaults> = {
  catalogos: { staleTime: 300_000, retry: 1 },
  menus: { staleTime: 300_000, retry: 1 },
  'caja-activa': { staleTime: 30_000, refetchInterval: 30_000 },
  cocina: { refetchInterval: 15_000 },
  ordenes: { staleTime: 30_000 },
  usuarios: { staleTime: 60_000 },
  productos: { staleTime: 60_000 },
  categorias: { staleTime: 60_000 },
  combos: { staleTime: 60_000 },
  mesas: { staleTime: 60_000 },
  clientes: { staleTime: 60_000 },
  'permisos-catalogo': { staleTime: 300_000 },
  'permisos-rol': { staleTime: 60_000 },
  roles: { staleTime: 300_000 },
  'pin-users': { staleTime: 60_000 },
  empresas: { staleTime: 300_000, retry: 2 },
  'mesas-admin': { staleTime: 60_000 },
  'resumen-diario': { staleTime: 30_000 },
  'caja-historial': { staleTime: 60_000 },
  'caja-movimientos': {},
  'configuraciones-menus': { staleTime: 30_000 },
  sucursales: { staleTime: 60_000 },
}

export function queryDefaults(key: string): QueryDefaults {
  return QUERY_CONFIG[key] ?? {}
}
