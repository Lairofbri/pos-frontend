import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'

export function useCocinaSocket(tenantId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!tenantId) return
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] })
    socket.emit('join:tenant', tenantId)

    socket.on('cocina:nuevo-item', () => {
      queryClient.invalidateQueries({ queryKey: ['cocina'] })
    })
    socket.on('cocina:item-listo', () => {
      queryClient.invalidateQueries({ queryKey: ['cocina'] })
    })
    socket.on('cocina:orden-completada', () => {
      queryClient.invalidateQueries({ queryKey: ['cocina'] })
    })

    return () => { socket.disconnect() }
  }, [tenantId, queryClient])
}
