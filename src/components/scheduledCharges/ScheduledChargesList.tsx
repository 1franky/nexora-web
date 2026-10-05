import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import CancelIcon from '@mui/icons-material/Cancel'
import EditIcon from '@mui/icons-material/Edit'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import type { ScheduledCharge, ScheduledChargeStatus } from '../../api/scheduledChargesApi'
import { getApiErrorMessage } from '../../api/apiError'
import { formatCurrencyIn, formatDateWithYear } from '../dataviz/format'
import ConfirmDialog from '../common/ConfirmDialog'
import ScheduledChargeFormDialog from './ScheduledChargeFormDialog'
import { describeFrequency, monthNameEs } from './schedule'
import { useCancelScheduledCharge, usePauseScheduledCharge, useResumeScheduledCharge } from './useScheduledCharges'

const STATUS_COLORS: Record<ScheduledChargeStatus, 'success' | 'warning' | 'default'> = {
  ACTIVE: 'success',
  PAUSED: 'warning',
  FINISHED: 'default',
  CANCELLED: 'default',
}

interface ScheduledChargesListProps {
  charges: ScheduledCharge[]
  /** En el detalle de una cuenta/tarjeta la columna «Cuenta» sobra. */
  showAccount?: boolean
}

/** Tabla de cargos programados con sus acciones (pausar/reanudar/editar/cancelar). La usan la página general y el detalle de cuenta/tarjeta. */
export default function ScheduledChargesList({ charges, showAccount = true }: ScheduledChargesListProps) {
  const { t } = useTranslation('scheduledCharges')
  const [error, setError] = useState<string | null>(null)
  const [editingCharge, setEditingCharge] = useState<ScheduledCharge | null>(null)
  const [cancellingCharge, setCancellingCharge] = useState<ScheduledCharge | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const onActionError = (err: unknown) => setError(getApiErrorMessage(err, t('common:errors.generic')))
  const pauseMutation = usePauseScheduledCharge(onActionError)
  const resumeMutation = useResumeScheduledCharge(onActionError)
  const cancelMutation = useCancelScheduledCharge({
    onSuccess: () => setCancellingCharge(null),
    onError: (err) => setCancelError(getApiErrorMessage(err, t('common:errors.generic'))),
  })

  const frequencyLabel = (charge: ScheduledCharge) =>
    describeFrequency(charge, (key, params) => t(key, params), monthNameEs)

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('columns.name')}</TableCell>
                {showAccount && <TableCell>{t('columns.account')}</TableCell>}
                <TableCell align="right">{t('columns.amount')}</TableCell>
                <TableCell>{t('columns.frequency')}</TableCell>
                <TableCell>{t('columns.nextRun')}</TableCell>
                <TableCell>{t('columns.status')}</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {charges.map((charge) => {
                const isClosed = charge.status === 'FINISHED' || charge.status === 'CANCELLED'
                const busy =
                  (pauseMutation.isPending && pauseMutation.variables === charge.id) ||
                  (resumeMutation.isPending && resumeMutation.variables === charge.id)
                return (
                  <TableRow key={charge.id} sx={{ opacity: isClosed ? 0.6 : 1 }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {charge.name}
                      </Typography>
                      {charge.status === 'PAUSED' && charge.lastError && (
                        <Typography variant="caption" sx={{ color: 'warning.main', display: 'block' }}>
                          {t('pausedReason', { reason: charge.lastError })}
                        </Typography>
                      )}
                      {charge.endDate && !isClosed && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          {t('endsOn', { date: formatDateWithYear(charge.endDate) })}
                        </Typography>
                      )}
                    </TableCell>
                    {showAccount && <TableCell>{charge.accountName}</TableCell>}
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                      {formatCurrencyIn(charge.amount, charge.currency)}
                    </TableCell>
                    <TableCell>{frequencyLabel(charge)}</TableCell>
                    <TableCell>
                      {charge.nextRunDate && charge.status === 'ACTIVE' ? formatDateWithYear(charge.nextRunDate) : t('noNextRun')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        variant={charge.status === 'CANCELLED' ? 'outlined' : 'filled'}
                        color={STATUS_COLORS[charge.status]}
                        label={t(`statuses.${charge.status}`)}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {charge.status === 'ACTIVE' && (
                        <Tooltip title={t('actions.pause')}>
                          <span>
                            <IconButton
                              size="small"
                              aria-label={t('actions.pause')}
                              disabled={busy}
                              onClick={() => {
                                setError(null)
                                pauseMutation.mutate(charge.id)
                              }}
                            >
                              <PauseIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                      {charge.status === 'PAUSED' && (
                        <Tooltip title={t('resumeHint')}>
                          <span>
                            <IconButton
                              size="small"
                              aria-label={t('actions.resume')}
                              disabled={busy}
                              onClick={() => {
                                setError(null)
                                resumeMutation.mutate(charge.id)
                              }}
                            >
                              <PlayArrowIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                      {!isClosed && (
                        <>
                          <Tooltip title={t('actions.edit')}>
                            <IconButton size="small" aria-label={t('actions.edit')} onClick={() => setEditingCharge(charge)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('actions.cancel')}>
                            <IconButton
                              size="small"
                              aria-label={t('actions.cancel')}
                              onClick={() => {
                                setCancelError(null)
                                setCancellingCharge(charge)
                              }}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <ScheduledChargeFormDialog open={editingCharge !== null} charge={editingCharge} onClose={() => setEditingCharge(null)} />

      <ConfirmDialog
        open={cancellingCharge !== null}
        title={t('cancelDialog.title')}
        description={t('cancelDialog.description', { name: cancellingCharge?.name ?? '' })}
        confirmLabel={t('cancelDialog.confirm')}
        error={cancelError}
        loading={cancelMutation.isPending}
        onCancel={() => setCancellingCharge(null)}
        onConfirm={() => cancellingCharge && cancelMutation.mutate(cancellingCharge.id)}
      />
    </Box>
  )
}
