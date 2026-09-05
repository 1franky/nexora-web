import axios from 'axios'
import { apiClient } from './client'

export type SatCertificateStatus = 'ACTIVO' | 'ERROR_AUTENTICACION' | 'REVOCADO'

/** Espejo de com.nexora.api.sat.web.SatCertificateResponse (nexora-api). */
export interface SatCertificate {
  rfc: string
  status: SatCertificateStatus
  validUntil: string
  lastSyncAt: string | null
}

export type CfdiInvoiceType = 'EMITIDAS' | 'RECIBIDAS'
export type CfdiEstadoSat = 'VIGENTE' | 'CANCELADO'

/** Espejo de com.nexora.api.sat.web.CfdiInvoiceResponse (nexora-api). */
export interface CfdiInvoice {
  id: string
  uuidFiscal: string
  tipo: CfdiInvoiceType
  rfcEmisor: string
  nombreEmisor: string | null
  rfcReceptor: string
  nombreReceptor: string | null
  fechaEmision: string
  subtotal: number
  iva: number
  total: number
  moneda: string
  formaPago: string | null
  metodoPago: string | null
  usoCfdi: string | null
  estadoSat: CfdiEstadoSat
}

/** Espejo de org.springframework.data.domain.Page<CfdiInvoiceResponse> (solo los campos que usa la UI). */
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface SatInvoiceFilters {
  tipo?: CfdiInvoiceType
  /** date-time ISO */
  desde?: string
  /** date-time ISO */
  hasta?: string
  texto?: string
  page?: number
  size?: number
}

export interface SatSyncRange {
  /** date-time ISO */
  desde?: string
  /** date-time ISO */
  hasta?: string
}

/** Espejo de com.nexora.api.sat.web.SatContraparteResponse (nexora-api). */
export interface SatContraparteResponse {
  id: string
  rfc: string
  alias: string | null
}

/** Espejo de com.nexora.api.sat.web.CreateSatContraparteRequest (nexora-api). */
export interface CreateSatContraparteRequest {
  rfc: string
  alias?: string
}

/**
 * GET .../sat/certificate responde 404 cuando el usuario no tiene ninguna
 * e.firma conectada — se traduce a `null` en vez de propagar el error, para
 * que la UI pueda decidir entre mostrar el formulario de alta o el panel de estado.
 */
export async function getSatCertificate(): Promise<SatCertificate | null> {
  try {
    const { data } = await apiClient.get<SatCertificate>('/sat/certificate')
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
}

export async function connectSatCertificate(params: { cer: File; key: File; password: string }): Promise<SatCertificate> {
  const formData = new FormData()
  formData.append('cer', params.cer)
  formData.append('key', params.key)
  const { data } = await apiClient.post<SatCertificate>('/sat/certificate', formData, {
    params: { password: params.password },
  })
  return data
}

export async function disconnectSatCertificate(): Promise<void> {
  await apiClient.delete('/sat/certificate')
}

/**
 * POST .../sat/sync responde 202: la sincronización corre en background, no
 * hay que esperar a que termine — el usuario se entera por notificaciones.
 * Sin `range` (o con ambos campos vacíos) es una sync incremental desde la
 * última exitosa; con `desde`+`hasta` trae un rango explícito de historial.
 */
export async function syncSat(range?: SatSyncRange): Promise<void> {
  const body = range && (range.desde || range.hasta) ? range : undefined
  await apiClient.post('/sat/sync', body)
}

export async function listSatInvoices(filters: SatInvoiceFilters): Promise<Page<CfdiInvoice>> {
  const { data } = await apiClient.get<Page<CfdiInvoice>>('/sat/invoices', {
    params: {
      tipo: filters.tipo || undefined,
      desde: filters.desde || undefined,
      hasta: filters.hasta || undefined,
      texto: filters.texto || undefined,
      page: filters.page ?? 0,
      size: filters.size ?? 25,
    },
  })
  return data
}

export async function downloadSatInvoiceXml(id: string): Promise<Blob> {
  const { data } = await apiClient.get(`/sat/invoices/${id}/xml`, { responseType: 'blob' })
  return data
}

/**
 * El SAT exige el RFC del emisor específico para descargar RECIBIDAS (no existe
 * "traer todo lo que me facturaron"): estos RFC son los que la sync automática
 * usa para pedir recibidas, uno por uno.
 */
export async function listSatContrapartes(): Promise<SatContraparteResponse[]> {
  const { data } = await apiClient.get<SatContraparteResponse[]>('/sat/contrapartes')
  return data
}

export async function createSatContraparte(request: CreateSatContraparteRequest): Promise<SatContraparteResponse> {
  const { data } = await apiClient.post<SatContraparteResponse>('/sat/contrapartes', request)
  return data
}

export async function deleteSatContraparte(id: string): Promise<void> {
  await apiClient.delete(`/sat/contrapartes/${id}`)
}

/** "2026-08-15" (input type="date") -> "2026-08-15T00:00:00.000Z" en hora local del navegador. */
export function dateInputToStartOfDayIso(dateInput: string): string {
  return new Date(`${dateInput}T00:00:00`).toISOString()
}

/** "2026-08-15" (input type="date") -> fin de ese día en hora local del navegador. */
export function dateInputToEndOfDayIso(dateInput: string): string {
  return new Date(`${dateInput}T23:59:59.999`).toISOString()
}
