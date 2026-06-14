import { useMemo, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { queryDefaults } from '../config/queries'
import api from '../api/client'
import { PageHeader } from '../components/shared/PageHeader'
import type { MenuItem } from '../types'

function findTitle(tree: MenuItem[], path: string): string | null {
  for (const item of tree) {
    if (item.ruta === path) return item.titulo
    if (item.children?.length) {
      const found = findTitle(item.children, path)
      if (found) return found
    }
  }
  return null
}

function pathToTitle(path: string): string {
  const segment = path.split('/').filter(Boolean).pop() ?? ''
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation()

  const { data } = useQuery<{ ok: boolean; data: { menus: MenuItem[] } }>({
    queryKey: ['menus'],
    queryFn: () => api.get('/menus').then(r => r.data),
    ...queryDefaults('menus'),
  })

  const title = useMemo(() => {
    const tree = data?.data?.menus ?? []
    return findTitle(tree, location.pathname) ?? pathToTitle(location.pathname)
  }, [data, location.pathname])

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={title} />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

interface AdminLayoutProps {
  children?: ReactNode
}
