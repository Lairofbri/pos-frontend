import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { queryDefaults } from '../config/queries'

export interface CatalogoItem {
  valor: string
  label: string
}

export function useCatalogo(grupo: string) {
  return useQuery({
    queryKey: ['catalogos', grupo],
    queryFn: () =>
      api.get<{ ok: boolean; data: Record<string, CatalogoItem[]> }>('/catalogos')
        .then(r => r.data.data[grupo] ?? []),
    ...queryDefaults('catalogos'),
  })
}
