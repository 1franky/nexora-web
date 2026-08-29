import { apiClient } from './client'
import type { Transaction, TransactionType } from './transactionsApi'

export interface CategoryAmount {
  categoryId: string
  categoryName: string
  amount: number
}

export interface MonthlyPoint {
  /** "yyyy-MM" */
  month: string
  amount: number
}

export interface ReportFilters {
  /** "yyyy-MM-dd" */
  from: string
  /** "yyyy-MM-dd" */
  to: string
  accountId?: string
  type?: TransactionType
}

/** Espejo de com.nexora.api.report.web.ReportResponse (nexora-api). */
export interface Report {
  from: string
  to: string
  totalIncome: number
  totalExpense: number
  balance: number
  expensesByCategory: CategoryAmount[]
  incomeByCategory: CategoryAmount[]
  monthlyIncome: MonthlyPoint[]
  monthlyExpense: MonthlyPoint[]
  transactions: Transaction[]
}

export async function getReport(filters: ReportFilters): Promise<Report> {
  const { data } = await apiClient.get<Report>('/reports', {
    params: {
      from: filters.from,
      to: filters.to,
      accountId: filters.accountId || undefined,
      type: filters.type || undefined,
    },
  })
  return data
}
