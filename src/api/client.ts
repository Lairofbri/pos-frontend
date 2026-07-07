import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const MENSAJES_POR_CODIGO: Record<number, string> = {
  400: 'Solicitud inválida. Revisa los datos ingresados.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'El recurso solicitado no fue encontrado.',
  409: 'Ya existe un registro con esos datos.',
  429: 'Demasiadas solicitudes. Intenta más tarde.',
  500: 'Error interno del servidor. Intenta más tarde.',
}

let toastTimer: ReturnType<typeof setTimeout> | null = null

function mostrarToast(error: any) {
  const status = error.response?.status
  const mensajeBackend = error.response?.data?.mensaje
  const titulo = MENSAJES_POR_CODIGO[status] || (mensajeBackend ? 'Error' : 'Error')

  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    useToastStore.getState().show({
      type: 'error',
      message: titulo,
      description: mensajeBackend || undefined,
    })
    toastTimer = null
  }, 0)
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const apiMessage = error.response?.data?.mensaje
    if (apiMessage) error.message = apiMessage

    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        useAuthStore.getState().setToken(data.data.access_token)
        original.headers.Authorization = `Bearer ${data.data.access_token}`
        return api(original)
      } catch {
        useAuthStore.getState().clearAuth()
        mostrarToast({ response: { status: 401, data: { mensaje: 'Sesión expirada. Inicia sesión nuevamente.' } } })
        window.location.href = '/login'
      }
    }

    mostrarToast(error)
    return Promise.reject(error)
  }
)

export default api
