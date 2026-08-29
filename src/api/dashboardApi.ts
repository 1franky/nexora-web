import { apiClient } from './client'

/**
 * Solo los campos que usa la página de bienvenida de W1. El dashboard
 * completo (gráficas, categorías, próximos pagos, widgets) es W2 — ahí se
 * ampliará este tipo con el resto de la respuesta de GET /api/v1/dashboard.
 */
export interface DashboardSummary {
  availableBalance: number
  netWorth: number
  creditCardDebt: number
  availableCredit: number
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await apiClient.get<DashboardSummary>('/dashboard')
  return data
}
