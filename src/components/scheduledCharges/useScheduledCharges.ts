import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import {
  cancelScheduledCharge,
  createScheduledCharge,
  listScheduledCharges,
  pauseScheduledCharge,
  resumeScheduledCharge,
  updateScheduledCharge,
  type ScheduledChargeRequest,
} from '../../api/scheduledChargesApi'

/**
 * Hooks de React Query de cargos programados (W13). La queryKey es
 * ['scheduledCharges', accountId?]: invalidar ['scheduledCharges'] refresca
 * tanto la página general como las secciones de detalle de cuenta/tarjeta.
 */
export function useScheduledCharges(accountId?: string, enabled = true) {
  return useQuery({
    queryKey: ['scheduledCharges', accountId],
    queryFn: () => listScheduledCharges(accountId),
    enabled,
  })
}

/**
 * Alta, edición y reanudar pueden registrar movimientos en la misma request
 * (cargos atrasados / el de hoy): además de la lista, se refresca todo lo
 * que depende de los movimientos — saldos, tarjetas, dashboard, reportes.
 */
function invalidateAfterPosting(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ['scheduledCharges'] })
  void queryClient.invalidateQueries({ queryKey: ['transactions'] })
  void queryClient.invalidateQueries({ queryKey: ['accounts'] })
  void queryClient.invalidateQueries({ queryKey: ['creditCards'] })
  void queryClient.invalidateQueries({ queryKey: ['creditCard'] })
  void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  void queryClient.invalidateQueries({ queryKey: ['reports'] })
  void queryClient.invalidateQueries({ queryKey: ['notifications'] })
}

export function useSaveScheduledCharge(options: { onSuccess?: () => void; onError?: (error: unknown) => void } = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, request }: { id?: string; request: ScheduledChargeRequest }) =>
      id ? updateScheduledCharge(id, request) : createScheduledCharge(request),
    onSuccess: () => {
      invalidateAfterPosting(queryClient)
      options.onSuccess?.()
    },
    onError: options.onError,
  })
}

export function usePauseScheduledCharge(onError?: (error: unknown) => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: pauseScheduledCharge,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['scheduledCharges'] }),
    onError,
  })
}

export function useResumeScheduledCharge(onError?: (error: unknown) => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: resumeScheduledCharge,
    onSuccess: () => invalidateAfterPosting(queryClient),
    onError,
  })
}

export function useCancelScheduledCharge(options: { onSuccess?: () => void; onError?: (error: unknown) => void } = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelScheduledCharge,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['scheduledCharges'] })
      options.onSuccess?.()
    },
    onError: options.onError,
  })
}
