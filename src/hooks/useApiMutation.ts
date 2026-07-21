import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToastStore } from '../store/toastStore'
import type { AxiosError } from 'axios'

interface UseApiMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>
  queryKey?: string | string[]
  successMessage?: string
  onSuccess?: (data: TData) => void
  onError?: (error: Error) => void
}

export function useApiMutation<TData = unknown, TVariables = void>({
  mutationFn,
  queryKey,
  successMessage,
  onSuccess,
  onError,
}: UseApiMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient()
  const showToast = useToastStore((s) => s.show)

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      if (successMessage) {
        showToast({ type: 'success', message: successMessage })
      }
      if (queryKey) {
        const keys = Array.isArray(queryKey) ? queryKey : [queryKey]
        keys.forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }))
      }
      onSuccess?.(data)
    },
    onError: (err) => {
      const axiosError = err as AxiosError<{ mensaje?: string }>
      const mensaje = axiosError.response?.data?.mensaje
      if (mensaje) {
        showToast({ type: 'error', message: mensaje })
      }
      onError?.(err instanceof Error ? err : new Error(String(err)))
    },
  })
}
