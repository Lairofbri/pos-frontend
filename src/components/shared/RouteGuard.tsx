import { useMemo, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import { Spinner } from '../ui/Spinner'
import type { MenuItem } from '../../types'

interface RouteGuardProps {
  children: ReactNode
}

function flattenMenus(items: MenuItem[]): string[] {
  if (!Array.isArray(items)) return []
  const paths: string[] = []
  for (const item of items) {
    if (item.ruta) paths.push(item.ruta)
    if (item.children?.length > 0) paths.push(...flattenMenus(item.children))
  }
  return paths
}

export function RouteGuard({ children }: RouteGuardProps) {
  const location = useLocation()

  const { data, isLoading } = useQuery({
    queryKey: ['menus-routes'],
    queryFn: () =>
      api.get<{ ok: boolean; data: { menus: MenuItem[] } }>('/menus')
        .then(r => r.data.data.menus),
    staleTime: 300_000,
    retry: 1,
  })

  const rutasPermitidas = useMemo(() => flattenMenus(data ?? []), [data])

  const rutaActual = location.pathname

  const siempreAccesibles = ['/pos', '/cocina', '/login']

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-svh bg-bg-primary">
        <Spinner size="lg" />
      </div>
    )
  }

  if (
    !siempreAccesibles.includes(rutaActual) &&
    rutaActual !== '/' &&
    !rutasPermitidas.includes(rutaActual)
  ) {
    return <Navigate to="/pos" replace />
  }

  return <>{children}</>
}
