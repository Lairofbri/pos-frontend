import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'

export function useCocinaSocket(tenantId: string) {
  const queryClient = useQueryClient()
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    if (!tenantId) return
    if (!token) return

    // SEGURIDAD: el token se envía en el handshake. El servidor deriva el
    // tenant del JWT — el cliente ya no controla la sala.
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
    })

    socket.on('cocina:nuevo-item', () => {
      queryClient.invalidateQueries({ queryKey: ['cocina'] })
      queryClient.invalidateQueries({ queryKey: ['orden'] })
      queryClient.invalidateQueries({ queryKey: ['ordenes'] })
    })
    socket.on('cocina:item-listo', () => {
      queryClient.invalidateQueries({ queryKey: ['cocina'] })
      queryClient.invalidateQueries({ queryKey: ['orden'] })
      queryClient.invalidateQueries({ queryKey: ['ordenes'] })
    })
    socket.on('cocina:orden-completada', () => {
      queryClient.invalidateQueries({ queryKey: ['cocina'] })
      queryClient.invalidateQueries({ queryKey: ['orden'] })
      queryClient.invalidateQueries({ queryKey: ['ordenes'] })
    })

    return () => { socket.disconnect() }
  }, [tenantId, token, queryClient])
}

export function useAlertasSocket(tenantId: string) {
  const queryClient = useQueryClient()
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    if (!tenantId) return
    if (!token) return
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
    })

    socket.on('alertas:actualizadas', () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] })
    })

    return () => { socket.disconnect() }
  }, [tenantId, token, queryClient])
}
