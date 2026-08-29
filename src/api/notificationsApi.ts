import { apiClient } from './client'

export type NotificationType =
  | 'PAYMENT_DUE'
  | 'PAYMENT_DUE_SOON'
  | 'PAYMENT_OVERDUE'
  | 'INSTALLMENT_DUE'
  | 'BUDGET_EXCEEDED'
  | 'UNUSUAL_EXPENSE'

export type NotificationStatus = 'UNREAD' | 'READ'

export interface Notification {
  id: string
  type: NotificationType
  /** Título y mensaje ya vienen redactados en español desde nexora-api (NotificationService); no hay nada que traducir aquí. */
  title: string
  message: string
  relatedEntityId: string | null
  status: NotificationStatus
  createdAt: string
  readAt: string | null
}

/**
 * GET regenera al vuelo lo que falte para el usuario (pagos/cuotas por
 * vencer) antes de devolver la lista — nunca hay que "refrescar" para ver
 * datos al día.
 */
export async function listNotifications(unreadOnly = false): Promise<Notification[]> {
  const { data } = await apiClient.get<Notification[]>('/notifications', { params: { unreadOnly } })
  return data
}

export async function markNotificationAsRead(id: string): Promise<Notification> {
  const { data } = await apiClient.post<Notification>(`/notifications/${id}/read`)
  return data
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiClient.post('/notifications/read-all')
}
