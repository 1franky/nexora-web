import { useTranslation } from 'react-i18next'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  /** Si la mutación falló, se muestra arriba de la descripción en vez de cerrar el diálogo. */
  error?: string | null
  confirmLabel?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Confirmación genérica para acciones destructivas (borrar). Sin estado propio de mutación: el llamador maneja loading/error/onConfirm. */
export default function ConfirmDialog({ open, title, description, error, confirmLabel, loading, onConfirm, onCancel }: ConfirmDialogProps) {
  const { t } = useTranslation('common')
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <DialogContentText>{description}</DialogContentText>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t('actions.cancel')}</Button>
        <Button onClick={onConfirm} color="error" variant="contained" loading={loading}>
          {confirmLabel ?? t('actions.delete')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
