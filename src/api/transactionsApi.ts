import { apiClient } from './client'

export type TransactionType =
  | 'INCOME'
  | 'EXPENSE'
  | 'TRANSFER'
  | 'CREDIT_CARD_PURCHASE'
  | 'CREDIT_CARD_PAYMENT'
  | 'REFUND'
  | 'ADJUSTMENT'

export type TransactionStatus = 'POSTED' | 'VOIDED'

export interface Transaction {
  id: string
  accountId: string
  type: TransactionType
  amount: number
  /**
   * Igual a `amount` pero con signo (positivo si aumenta el saldo de
   * `accountId`, negativo si lo disminuye). Es lo único que distingue la
   * pierna de salida de la de entrada en una transferencia o un pago de
   * tarjeta: ambas comparten el mismo `type` (ver TransactionService en
   * nexora-api) — sin este campo no se podría saber si pintar el monto en
   * rojo o en verde.
   */
  balanceEffect: number
  date: string
  description: string | null
  reference: string | null
  categoryId: string | null
  transferGroupId: string | null
  counterAccountId: string | null
  merchant: string | null
  status: TransactionStatus
  createdAt: string
}

export interface CreateTransactionRequest {
  type: 'INCOME' | 'EXPENSE'
  accountId: string
  amount: number
  date: string
  categoryId?: string
  description?: string
  reference?: string
}

export interface CreateTransferRequest {
  fromAccountId: string
  toAccountId: string
  amount: number
  date: string
  description?: string
  reference?: string
}

export interface TransferResult {
  outgoing: Transaction
  incoming: Transaction
}

/** Sin accountId, trae los movimientos de todas las cuentas del usuario juntos. */
export async function listTransactions(accountId?: string): Promise<Transaction[]> {
  const { data } = await apiClient.get<Transaction[]>('/transactions', { params: accountId ? { accountId } : undefined })
  return data
}

export async function createTransaction(request: CreateTransactionRequest): Promise<Transaction> {
  const { data } = await apiClient.post<Transaction>('/transactions', request)
  return data
}

export async function createTransfer(request: CreateTransferRequest): Promise<TransferResult> {
  const { data } = await apiClient.post<TransferResult>('/transfers', request)
  return data
}
