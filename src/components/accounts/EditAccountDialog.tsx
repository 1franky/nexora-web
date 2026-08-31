import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import { updateAccount, type Account } from '../../api/accountsApi'
import { getApiErrorMessage } from '../../api/apiError'

interface EditAccountDialogProps {
  account: Account | null
  onClose: () => void
}

/** Tipo, moneda y saldo no se editan aquí a propósito: cambiarlos rompería el significado de lo ya registrado (ver nexora-api). */
export default function EditAccountDialog({ account, onClose }: EditAccountDialogProps) {
  const { t } = useTranslation('accounts')
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [includeInAvailableBalance, setIncludeInAvailableBalance] = useState(true)
  const [includeInNetWorth, setIncludeInNetWorth] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Reinicia el formulario con los valores de la cuenta cada vez que se abre para una distinta.
  useEffect(() => {
    if (account) {
      setName(account.name)
      setIncludeInAvailableBalance(account.includeInAvailableBalance)
      setIncludeInNetWorth(account.includeInNetWorth)
      setError(null)
    }
  }, [account])

  const mutation = useMutation({
    mutationFn: (vars: { id: string; name: string; includeInAvailableBalance: boolean; includeInNetWorth: boolean }) =>
      updateAccount(vars.id, {
        name: vars.name,
        includeInAvailableBalance: vars.includeInAvailableBalance,
        includeInNetWorth: vars.includeInNetWorth,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    },
    onError: (err) => setError(getApiErrorMessage(err, t('common:errors.generic'))),
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!account) return
    setError(null)
    mutation.mutate({ id: account.id, name, includeInAvailableBalance, includeInNetWorth })
  }

  return (
    <Dialog open={account !== null} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('editDialog.title')}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label={t('dialog.name')}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              fullWidth
              autoFocus
            />
            <FormControlLabel
              control={
                <Switch
                  checked={includeInAvailableBalance}
                  onChange={(event) => setIncludeInAvailableBalance(event.target.checked)}
                />
              }
              label={t('dialog.includeInAvailableBalance')}
            />
            <FormControlLabel
              control={
                <Switch checked={includeInNetWorth} onChange={(event) => setIncludeInNetWorth(event.target.checked)} />
              }
              label={t('dialog.includeInNetWorth')}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('common:actions.cancel')}</Button>
          <Button type="submit" variant="contained" loading={mutation.isPending} disabled={!name}>
            {t('common:actions.save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
