import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { queryDefaults } from '../config/queries'

export interface CatalogoItem {
  valor: string
  label: string
  depto?: string
}

export function useCatalogo(grupo: string, params?: Record<string, string>) {
  return useQuery({
    queryKey: ['catalogos', grupo, params],
    queryFn: () =>
      api.get<{ ok: boolean; data: Record<string, CatalogoItem[]> }>('/catalogos', { params })
        .then(r => r.data.data[grupo] ?? []),
    ...queryDefaults('catalogos'),
  })
}
