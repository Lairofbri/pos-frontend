import axios from 'axios'
import { STORAGE_KEYS } from '../config/constants'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const apiMessage = error.response?.data?.mensaje
    if (apiMessage) error.message = apiMessage

    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refresh_token: refreshToken }
        )
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.data.access_token)
        if (data.data.refresh_token) {
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.data.refresh_token)
        }
        original.headers.Authorization = `Bearer ${data.data.access_token}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
