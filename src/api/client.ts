import axios, { type AxiosError } from 'axios'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const { token, sucursalId } = useAuthStore.getState()
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (sucursalId) config.headers['X-Sucursal-Id'] = sucursalId
  return config
})

let toastTimer: ReturnType<typeof setTimeout> | null = null

function mostrarToast(error: AxiosError<{ mensaje?: string }>) {
  const mensajeBackend = error.response?.data?.mensaje
  const message = mensajeBackend || 'Error inesperado'

  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    useToastStore.getState().show({
      type: 'error',
      message,
    })
    toastTimer = null
  }, 0)
}

function parseItem(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (Array.isArray(value)) return value.map(parseItem)
  if (typeof value === 'object' && !(value instanceof Date)) {
    const result: Record<string, unknown> = {}
    for (const key in value) result[key] = parseItem((value as Record<string, unknown>)[key])
    return result
  }
  if (typeof value === 'string' && /^-?\d+\.?\d*$/.test(value.trim()) && value.trim() !== '') {
    return Number(value)
  }
  return value
}

api.interceptors.response.use(
  (res) => {
    if (res.data && typeof res.data === 'object') {
      res.data = parseItem(res.data)
    }
    return res
  },
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
        mostrarToast({ response: { status: 401, data: { mensaje: 'Sesión expirada. Inicia sesión nuevamente.' } } } as unknown as AxiosError<{ mensaje?: string }>)
        window.location.href = '/login'
      }
    }

    mostrarToast(error as unknown as AxiosError<{ mensaje?: string }>)
    return Promise.reject(error)
  }
)

export default api
