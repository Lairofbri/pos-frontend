import { useQuery, type UseQueryOptions, type QueryKey } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { AxiosError } from 'axios'

interface ApiErrorResponse {
  mensaje?: string
}

export function useApiQuery<TData>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>,
) {
  const query = useQuery<TData>({ queryKey, queryFn, ...options })

  const mensajeError = useMemo(() => {
    if (!query.error) return null
    const axiosError = query.error as AxiosError<ApiErrorResponse>
    return axiosError.response?.data?.mensaje ?? query.error.message ?? 'Error inesperado'
  }, [query.error])

  return {
    ...query,
    mensajeError,
  }
}
