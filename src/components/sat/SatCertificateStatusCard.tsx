import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import SyncIcon from '@mui/icons-material/Sync'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import HistoryIcon from '@mui/icons-material/History'
import {
  dateInputToEndOfDayIso,
  dateInputToStartOfDayIso,
  disconnectSatCertificate,
  syncSat,
  type SatCertificate,
  type SatCertificateStatus,
} from '../../api/satApi'
import { getApiErrorMessage } from '../../api/apiError'
import ConfirmDialog from '../common/ConfirmDialog'

const dateTimeFormatter = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso))
}

const STATUS_COLOR: Record<SatCertificateStatus, 'success' | 'error' | 'default'> = {
  ACTIVO: 'success',
  ERROR_AUTENTICACION: 'error',
  REVOCADO: 'default',
}

export default function SatCertificateStatusCard({ certificate }: { certificate: SatCertificate }) {
  const { t } = useTranslation('sat')
  const queryClient = useQueryClient()

  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [rangeFrom, setRangeFrom] = useState('')
  const [rangeTo, setRangeTo] = useState('')
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false)
  const [disconnectError, setDisconnectError] = useState<string | null>(null)

  const invalidateCertificate = () => queryClient.invalidateQueries({ queryKey: ['sat', 'certificate'] })

  const syncNowMutation = useMutation({
    mutationFn: () => syncSat(),
    onSuccess: () => {
      setSyncError(null)
      setSyncMessage(t('connection.status.syncStarted'))
      invalidateCertificate()
    },
    onError: (err) => {
      setSyncMessage(null)
      setSyncError(getApiErrorMessage(err, t('connection.status.syncError')))
    },
  })

  const syncRangeMutation = useMutation({
    mutationFn: () =>
      syncSat({
        desde: dateInputToStartOfDayIso(rangeFrom),
        hasta: dateInputToEndOfDayIso(rangeTo),
      }),
    onSuccess: () => {
      setSyncError(null)
      setSyncMessage(t('connection.status.syncStarted'))
      setRangeFrom('')
      setRangeTo('')
      invalidateCertificate()
    },
    onError: (err) => {
      setSyncMessage(null)
      setSyncError(getApiErrorMessage(err, t('connection.status.syncError')))
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: disconnectSatCertificate,
    onSuccess: () => {
      setConfirmingDisconnect(false)
      invalidateCertificate()
    },
    onError: (err) => setDisconnectError(getApiErrorMessage(err, t('connection.status.disconnectError'))),
  })

  const rangeValid = rangeFrom !== '' && rangeTo !== '' && rangeFrom <= rangeTo

  return (
    <Stack spacing={2.5}>
      {certificate.status === 'ERROR_AUTENTICACION' && <Alert severity="error">{t('connection.status.authError')}</Alert>}

      <Stack spacing={1.5}>
        <Field label={t('connection.status.rfc')} value={certificate.rfc} />
        <StatusField status={certificate.status} />
        <Field label={t('connection.status.validUntil')} value={formatDateTime(certificate.validUntil)} />
        <Field
          label={t('connection.status.lastSyncAt')}
          value={certificate.lastSyncAt ? formatDateTime(certificate.lastSyncAt) : t('connection.status.neverSynced')}
        />
      </Stack>

      {syncMessage && <Alert severity="info">{syncMessage}</Alert>}
      {syncError && <Alert severity="error">{syncError}</Alert>}

      <Stack sx={{ flexDirection: 'row', flexWrap: 'wrap', gap: 1.5 }}>
        <Button
          variant="contained"
          startIcon={<SyncIcon />}
          loading={syncNowMutation.isPending}
          onClick={() => {
            setSyncMessage(null)
            setSyncError(null)
            syncNowMutation.mutate()
          }}
        >
          {t('connection.status.syncNow')}
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteForeverIcon />}
          onClick={() => {
            setDisconnectError(null)
            setConfirmingDisconnect(true)
          }}
        >
          {t('connection.status.disconnect')}
        </Button>
      </Stack>

      <Divider />

      <Stack spacing={1.5}>
        <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}>
          <HistoryIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          <Typography variant="subtitle2">{t('connection.status.rangeSync.heading')}</Typography>
        </Stack>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('connection.status.rangeSync.subtitle')}
        </Typography>
        <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            type="date"
            size="small"
            label={t('connection.status.rangeSync.from')}
            value={rangeFrom}
            onChange={(event) => setRangeFrom(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            type="date"
            size="small"
            label={t('connection.status.rangeSync.to')}
            value={rangeTo}
            onChange={(event) => setRangeTo(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Button
            variant="outlined"
            loading={syncRangeMutation.isPending}
            disabled={!rangeValid}
            onClick={() => {
              setSyncMessage(null)
              setSyncError(null)
              syncRangeMutation.mutate()
            }}
          >
            {t('connection.status.rangeSync.submit')}
          </Button>
        </Stack>
        {rangeFrom && rangeTo && !rangeValid && (
          <Typography variant="caption" color="error">
            {t('connection.status.rangeSync.rangeInvalid')}
          </Typography>
        )}
      </Stack>

      <ConfirmDialog
        open={confirmingDisconnect}
        title={t('connection.status.disconnectDialog.title')}
        description={t('connection.status.disconnectDialog.description')}
        confirmLabel={t('connection.status.disconnect')}
        error={disconnectError}
        loading={disconnectMutation.isPending}
        onConfirm={() => disconnectMutation.mutate()}
        onCancel={() => setConfirmingDisconnect(false)}
      />
    </Stack>
  )
}

function StatusField({ status }: { status: SatCertificateStatus }) {
  const { t } = useTranslation('sat')
  return (
    <Box>
      <Chip size="small" color={STATUS_COLOR[status]} label={t(`connection.status.states.${status}`)} />
    </Box>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Box>
  )
}
