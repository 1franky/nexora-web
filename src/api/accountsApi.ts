import { apiClient } from './client'

export type AccountType = 'DEBIT' | 'SAVINGS' | 'CREDIT_CARD' | 'AFORE' | 'PPR'
export type AccountStatus = 'ACTIVE' | 'ARCHIVED'

export interface Account {
  id: string
  name: string
  type: AccountType
  currency: string
  balance: number
  includeInAvailableBalance: boolean
  includeInNetWorth: boolean
  status: AccountStatus
  createdAt: string
  updatedAt: string
}

export interface CreateAccountRequest {
  name: string
  type: AccountType
  currency: string
  openingBalance: number
  includeInAvailableBalance: boolean
  includeInNetWorth: boolean
}

export async function listAccounts(): Promise<Account[]> {
  const { data } = await apiClient.get<Account[]>('/accounts')
  return data
}

export async function getAccount(id: string): Promise<Account> {
  const { data } = await apiClient.get<Account>(`/accounts/${id}`)
  return data
}

export async function createAccount(request: CreateAccountRequest): Promise<Account> {
  const { data } = await apiClient.post<Account>('/accounts', request)
  return data
}
