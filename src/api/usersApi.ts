import { apiClient } from './client'

export interface User {
  id: string
  email: string
  displayName: string
  createdAt: string
}

export interface RegisterRequest {
  email: string
  password: string
  displayName: string
}

export async function registerUser(request: RegisterRequest): Promise<User> {
  const { data } = await apiClient.post<User>('/users', request)
  return data
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<User>('/users/me')
  return data
}
