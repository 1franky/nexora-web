import { apiClient } from './client'

export type CategoryType = 'INCOME' | 'EXPENSE'
export type CategoryStatus = 'ACTIVE' | 'ARCHIVED'

export interface Category {
  id: string
  name: string
  type: CategoryType
  status: CategoryStatus
  createdAt: string
}

export interface CreateCategoryRequest {
  name: string
  type: CategoryType
}

/**
 * La gestión completa de categorías (editar, archivar) es su propio módulo
 * ("Categorías" en la navegación, todavía "próximamente"). Por ahora solo se
 * necesita leer y crear, para poder categorizar movimientos desde W3.
 */
export async function listCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>('/categories')
  return data
}

export async function createCategory(request: CreateCategoryRequest): Promise<Category> {
  const { data } = await apiClient.post<Category>('/categories', request)
  return data
}
