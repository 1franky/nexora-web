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

export async function listCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>('/categories')
  return data
}

export async function createCategory(request: CreateCategoryRequest): Promise<Category> {
  const { data } = await apiClient.post<Category>('/categories', request)
  return data
}

/** Solo el nombre: el tipo no se puede editar una vez creada la categoría (ver nexora-api). */
export async function renameCategory(id: string, name: string): Promise<Category> {
  const { data } = await apiClient.patch<Category>(`/categories/${id}`, { name })
  return data
}

/** No borra la categoría (sigue existiendo para lo ya categorizado); solo deja de poder usarse en movimientos nuevos. */
export async function archiveCategory(id: string): Promise<Category> {
  const { data } = await apiClient.post<Category>(`/categories/${id}/archive`)
  return data
}

export async function activateCategory(id: string): Promise<Category> {
  const { data } = await apiClient.post<Category>(`/categories/${id}/activate`)
  return data
}
