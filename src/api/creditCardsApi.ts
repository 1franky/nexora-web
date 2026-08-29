import { apiClient } from './client'
import type { Transaction, TransferResult } from './transactionsApi'

export type CreditCardStatus = 'ACTIVE' | 'ARCHIVED'

export interface CreditCard {
  id: string
  accountId: string
  name: string
  bank: string
  last4: string
  currency: string
  creditLimit: number
  currentDebt: number
  availableCredit: number
  closingDay: number
  paymentDueDay: number
  nextClosingDate: string
  nextPaymentDueDate: string
  status: CreditCardStatus
}

export interface CreateCreditCardRequest {
  name: string
  bank: string
  last4: string
  creditLimit: number
  closingDay: number
  paymentDueDay: number
  currency: string
}

export interface CreditCardPurchaseRequest {
  amount: number
  date: string
  merchant: string
  categoryId?: string
  description?: string
  reference?: string
}

export interface CreditCardPaymentRequest {
  fromAccountId: string
  amount: number
  date: string
  description?: string
  reference?: string
}

export async function listCreditCards(): Promise<CreditCard[]> {
  const { data } = await apiClient.get<CreditCard[]>('/credit-cards')
  return data
}

export async function getCreditCard(id: string): Promise<CreditCard> {
  const { data } = await apiClient.get<CreditCard>(`/credit-cards/${id}`)
  return data
}

export async function createCreditCard(request: CreateCreditCardRequest): Promise<CreditCard> {
  const { data } = await apiClient.post<CreditCard>('/credit-cards', request)
  return data
}

export async function purchaseWithCreditCard(id: string, request: CreditCardPurchaseRequest): Promise<Transaction> {
  const { data } = await apiClient.post<Transaction>(`/credit-cards/${id}/purchases`, request)
  return data
}

export async function payCreditCard(id: string, request: CreditCardPaymentRequest): Promise<TransferResult> {
  const { data } = await apiClient.post<TransferResult>(`/credit-cards/${id}/payments`, request)
  return data
}
