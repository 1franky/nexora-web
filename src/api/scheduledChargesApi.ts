import { apiClient } from './client'
import type { AccountType } from './accountsApi'

export type ScheduledChargeFrequency = 'MONTHLY' | 'YEARLY'
export type ScheduledChargeStatus = 'ACTIVE' | 'PAUSED' | 'FINISHED' | 'CANCELLED'

/** Espejo de ScheduledChargeResponse en nexora-api (B14, plan-cargos-programados.md sección 4). */
export interface ScheduledCharge {
  id: string
  accountId: string
  accountName: string
  accountType: AccountType
  /** La de la cuenta: el cargo no tiene moneda propia. */
  currency: string
  name: string
  amount: number
  categoryId: string | null
  description: string | null
  frequency: ScheduledChargeFrequency
  /** 1-31; si el mes no tiene ese día, el cargo cae en el último día del mes. */
  dayOfMonth: number
  /** 1-12 si es anual; null si es mensual. */
  monthOfYear: number | null
  startDate: string
  /** Inclusive; null = sin fecha de fin. */
  endDate: string | null
  /** null si está FINISHED o CANCELLED. */
  nextRunDate: string | null
  /** Último cargo registrado; si no es null, la fecha de inicio ya no se puede cambiar. */
  lastRunDate: string | null
  status: ScheduledChargeStatus
  /** Por qué se pausó automáticamente (p. ej. categoría archivada). Se limpia al reanudar. */
  lastError: string | null
  createdAt: string
}

/** Alta y edición usan el mismo cuerpo; la edición solo aplica hacia adelante. */
export interface ScheduledChargeRequest {
  accountId: string
  name: string
  amount: number
  categoryId?: string
  description?: string
  frequency: ScheduledChargeFrequency
  dayOfMonth: number
  /** Obligatorio si frequency = YEARLY; null si MONTHLY. */
  monthOfYear: number | null
  startDate: string
  endDate?: string
}

/** Sin accountId trae los de todas las cuentas: activos/pausados primero (por próximo cargo), luego terminados/cancelados. */
export async function listScheduledCharges(accountId?: string): Promise<ScheduledCharge[]> {
  const { data } = await apiClient.get<ScheduledCharge[]>('/scheduled-charges', {
    params: accountId ? { accountId } : undefined,
  })
  return data
}

export async function getScheduledCharge(id: string): Promise<ScheduledCharge> {
  const { data } = await apiClient.get<ScheduledCharge>(`/scheduled-charges/${id}`)
  return data
}

/** Si la fecha de inicio es pasada, nexora-api registra en la misma request los cargos atrasados. */
export async function createScheduledCharge(request: ScheduledChargeRequest): Promise<ScheduledCharge> {
  const { data } = await apiClient.post<ScheduledCharge>('/scheduled-charges', request)
  return data
}

export async function updateScheduledCharge(id: string, request: ScheduledChargeRequest): Promise<ScheduledCharge> {
  const { data } = await apiClient.put<ScheduledCharge>(`/scheduled-charges/${id}`, request)
  return data
}

export async function pauseScheduledCharge(id: string): Promise<ScheduledCharge> {
  const { data } = await apiClient.post<ScheduledCharge>(`/scheduled-charges/${id}/pause`)
  return data
}

/** Sigue desde hoy: lo que habría tocado mientras estuvo pausado no se registra. */
export async function resumeScheduledCharge(id: string): Promise<ScheduledCharge> {
  const { data } = await apiClient.post<ScheduledCharge>(`/scheduled-charges/${id}/resume`)
  return data
}

/** Baja lógica: deja de generar movimientos, pero los ya registrados se conservan. */
export async function cancelScheduledCharge(id: string): Promise<void> {
  await apiClient.delete(`/scheduled-charges/${id}`)
}
