import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const reportesApi = axios.create({
  baseURL: import.meta.env.VITE_REPORTES_API_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
})

reportesApi.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default reportesApi
