import { apiClient } from './client'

export interface CategoryAmount {
  categoryId: string
  categoryName: string
  amount: number
}

export interface UpcomingCardPayment {
  creditCardId: string
  creditCardName: string
  dueDate: string
  expectedPayment: number
}

export interface MonthlyPoint {
  /** "yyyy-MM" */
  month: string
  amount: number
}

export interface TransactionSummary {
  id: string
  accountId: string
  type: string
  amount: number
  date: string
  description: string | null
  merchant: string | null
}

/** Espejo de com.nexora.api.dashboard.web.DashboardResponse (nexora-api). */
export interface DashboardSummary {
  month: string
  availableBalance: number
  netWorth: number
  incomeThisMonth: number
  expenseThisMonth: number
  monthlyBalance: number
  expensesByCategory: CategoryAmount[]
  incomeByCategory: CategoryAmount[]
  creditCardDebt: number
  availableCredit: number
  upcomingPayments: UpcomingCardPayment[]
  activeMsiPlansCount: number
  monthlyInstallmentCommitment: number
  netWorthEvolution: MonthlyPoint[]
  expenseEvolution: MonthlyPoint[]
  recentTransactions: TransactionSummary[]
}

export async function getDashboardSummary(month?: string): Promise<DashboardSummary> {
  const { data } = await apiClient.get<DashboardSummary>('/dashboard', { params: month ? { month } : undefined })
  return data
}
