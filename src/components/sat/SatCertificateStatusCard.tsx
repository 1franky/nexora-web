import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import SyncIcon from '@mui/icons-material/Sync'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import HistoryIcon from '@mui/icons-material/History'
import ContactPageIcon from '@mui/icons-material/ContactPage'
import {
  createSatContraparte,
  dateInputToEndOfDayIso,
  dateInputToStartOfDayIso,
  deleteSatContraparte,
  disconnectSatCertificate,
  listSatContrapartes,
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
  const [rfcInput, setRfcInput] = useState('')
  const [aliasInput, setAliasInput] = useState('')
  const [addContraparteError, setAddContraparteError] = useState<string | null>(null)
  const [confirmingDeleteContraparteId, setConfirmingDeleteContraparteId] = useState<string | null>(null)
  const [deleteContraparteError, setDeleteContraparteError] = useState<string | null>(null)

  const invalidateCertificate = () => queryClient.invalidateQueries({ queryKey: ['sat', 'certificate'] })
  const invalidateContrapartes = () => queryClient.invalidateQueries({ queryKey: ['sat', 'contrapartes'] })

  const {
    data: contrapartes,
    isLoading: contrapartesLoading,
    isError: contrapartesError,
  } = useQuery({
    queryKey: ['sat', 'contrapartes'],
    queryFn: listSatContrapartes,
  })

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

  const createContraparteMutation = useMutation({
    mutationFn: () => createSatContraparte({ rfc: rfcInput.trim(), alias: aliasInput.trim() || undefined }),
    onSuccess: () => {
      setAddContraparteError(null)
      setRfcInput('')
      setAliasInput('')
      invalidateContrapartes()
    },
    onError: (err) => setAddContraparteError(getApiErrorMessage(err, t('connection.status.contrapartes.addError'))),
  })

  const deleteContraparteMutation = useMutation({
    mutationFn: (id: string) => deleteSatContraparte(id),
    onSuccess: () => {
      setConfirmingDeleteContraparteId(null)
      invalidateContrapartes()
    },
    onError: (err) => setDeleteContraparteError(getApiErrorMessage(err, t('connection.status.contrapartes.deleteError'))),
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

      <Divider />

      <Stack spacing={1.5}>
        <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}>
          <ContactPageIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          <Typography variant="subtitle2">{t('connection.status.contrapartes.heading')}</Typography>
        </Stack>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('connection.status.contrapartes.subtitle')}
        </Typography>

        {contrapartesError && <Alert severity="error">{t('connection.status.contrapartes.loadError')}</Alert>}

        {contrapartesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : contrapartes && contrapartes.length > 0 ? (
          <Stack spacing={1}>
            {contrapartes.map((contraparte) => (
              <Stack key={contraparte.id} sx={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {contraparte.alias ? `${contraparte.alias} (${contraparte.rfc})` : contraparte.rfc}
                </Typography>
                <IconButton
                  size="small"
                  aria-label={t('connection.status.contrapartes.delete')}
                  onClick={() => {
                    setDeleteContraparteError(null)
                    setConfirmingDeleteContraparteId(contraparte.id)
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        ) : (
          !contrapartesError && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('connection.status.contrapartes.empty')}
            </Typography>
          )
        )}

        {addContraparteError && <Alert severity="error">{addContraparteError}</Alert>}

        <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            label={t('connection.status.contrapartes.rfcLabel')}
            value={rfcInput}
            onChange={(event) => setRfcInput(event.target.value)}
          />
          <TextField
            size="small"
            label={t('connection.status.contrapartes.aliasLabel')}
            value={aliasInput}
            onChange={(event) => setAliasInput(event.target.value)}
          />
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            loading={createContraparteMutation.isPending}
            disabled={rfcInput.trim() === ''}
            onClick={() => {
              setAddContraparteError(null)
              createContraparteMutation.mutate()
            }}
          >
            {t('connection.status.contrapartes.add')}
          </Button>
        </Stack>
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

      <ConfirmDialog
        open={confirmingDeleteContraparteId !== null}
        title={t('connection.status.contrapartes.deleteDialog.title')}
        description={t('connection.status.contrapartes.deleteDialog.description')}
        confirmLabel={t('connection.status.contrapartes.delete')}
        error={deleteContraparteError}
        loading={deleteContraparteMutation.isPending}
        onConfirm={() => confirmingDeleteContraparteId && deleteContraparteMutation.mutate(confirmingDeleteContraparteId)}
        onCancel={() => setConfirmingDeleteContraparteId(null)}
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
