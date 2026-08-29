import { apiClient } from './client'

export type InstallmentPlanType = 'MSI' | 'MCI'
export type InstallmentPlanStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
export type InstallmentStatus = 'PENDING' | 'PAID'

export interface Installment {
  id: string
  number: number
  dueDate: string
  amount: number
  status: InstallmentStatus
  paidAt: string | null
}

export interface InstallmentPlan {
  id: string
  creditCardId: string
  transactionId: string
  planType: InstallmentPlanType
  originalAmount: number
  installmentCount: number
  interestRate: number
  interestAmount: number
  totalAmount: number
  installmentAmount: number
  startDate: string
  endDate: string
  status: InstallmentPlanStatus
  installmentsPaid: number
  installmentsPending: number
  financedBalance: number
  nextInstallment: Installment | null
  installments: Installment[]
}

export interface CreateInstallmentPlanRequest {
  amount: number
  date: string
  merchant: string
  installmentCount: number
  /** Tasa de interés simple mensual en porcentaje (ej. 2.5 = 2.5%/mes). 0 = MSI, >0 = MCI (lo decide el backend). */
  interestRate: number
  categoryId?: string
  description?: string
  reference?: string
}

export async function listInstallmentPlansForCard(cardId: string): Promise<InstallmentPlan[]> {
  const { data } = await apiClient.get<InstallmentPlan[]>(`/credit-cards/${cardId}/installment-plans`)
  return data
}

export async function createInstallmentPlan(cardId: string, request: CreateInstallmentPlanRequest): Promise<InstallmentPlan> {
  const { data } = await apiClient.post<InstallmentPlan>(`/credit-cards/${cardId}/installment-plans`, request)
  return data
}

export async function payInstallment(planId: string, installmentId: string): Promise<InstallmentPlan> {
  const { data } = await apiClient.post<InstallmentPlan>(`/installment-plans/${planId}/installments/${installmentId}/pay`)
  return data
}
