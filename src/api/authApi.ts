import { apiClient } from './client'
import type { Tokens } from '../auth/tokenStore'

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresInSeconds: number
}

export async function login(email: string, password: string): Promise<Tokens> {
  const { data } = await apiClient.post<TokenResponse>('/auth/login', { email, password })
  return { accessToken: data.accessToken, refreshToken: data.refreshToken }
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refreshToken })
}
