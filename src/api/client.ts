import axios, { type AxiosRequestConfig } from 'axios'
import { getTokens, setTokens } from '../auth/tokenStore'

/**
 * `VITE_API_BASE_URL` se resuelve en tiempo de build (es una variable de
 * entorno de Vite, no de runtime como en nexora-api) — ver Dockerfile/compose.yaml.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3005/api/v1'

export const apiClient = axios.create({ baseURL: API_BASE_URL })

apiClient.interceptors.request.use((config) => {
  const tokens = getTokens()
  if (tokens) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`
  }
  return config
})

interface RetriableRequestConfig extends AxiosRequestConfig {
  _retry?: boolean
}

let refreshPromise: Promise<string> | null = null

/** Usa axios "pelón" (no apiClient) para no volver a pasar por estos mismos interceptores. */
async function refreshAccessToken(): Promise<string> {
  const tokens = getTokens()
  if (!tokens) throw new Error('No hay sesión activa.')
  const response = await axios.post<{ accessToken: string; refreshToken: string }>(
    `${API_BASE_URL}/auth/refresh`,
    { refreshToken: tokens.refreshToken },
  )
  setTokens({ accessToken: response.data.accessToken, refreshToken: response.data.refreshToken })
  return response.data.accessToken
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined
    const shouldRetry = error.response?.status === 401 && originalRequest && !originalRequest._retry && getTokens()

    if (!shouldRetry) {
      return Promise.reject(error)
    }

    originalRequest._retry = true
    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })
      const newAccessToken = await refreshPromise
      originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${newAccessToken}` }
      return apiClient(originalRequest)
    } catch {
      setTokens(null)
      return Promise.reject(error)
    }
  },
)
