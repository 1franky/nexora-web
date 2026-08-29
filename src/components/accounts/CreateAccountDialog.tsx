import { useState, type FormEvent } from 'react'
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
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import { createAccount, type AccountType } from '../../api/accountsApi'
import { getApiErrorMessage } from '../../api/apiError'

const ACCOUNT_TYPES: AccountType[] = ['DEBIT', 'SAVINGS', 'CREDIT_CARD', 'AFORE', 'PPR']
const CURRENCY_PATTERN = /^[A-Z]{3}$/

interface CreateAccountDialogProps {
  open: boolean
  onClose: () => void
}

export default function CreateAccountDialog({ open, onClose }: CreateAccountDialogProps) {
  const { t } = useTranslation('accounts')
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('DEBIT')
  const [currency, setCurrency] = useState('MXN')
  const [openingBalance, setOpeningBalance] = useState('0')
  const [includeInAvailableBalance, setIncludeInAvailableBalance] = useState(true)
  const [includeInNetWorth, setIncludeInNetWorth] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setName('')
    setType('DEBIT')
    setCurrency('MXN')
    setOpeningBalance('0')
    setIncludeInAvailableBalance(true)
    setIncludeInNetWorth(true)
    setError(null)
  }

  const mutation = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      resetForm()
      onClose()
    },
    onError: (err) => setError(getApiErrorMessage(err, t('common:errors.generic'))),
  })

  const currencyValid = CURRENCY_PATTERN.test(currency)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!currencyValid) return
    setError(null)
    mutation.mutate({
      name,
      type,
      currency,
      openingBalance: Number(openingBalance) || 0,
      includeInAvailableBalance,
      includeInNetWorth,
    })
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('dialog.title')}</DialogTitle>
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
            <TextField
              select
              label={t('dialog.type')}
              value={type}
              onChange={(event) => setType(event.target.value as AccountType)}
              required
              fullWidth
            >
              {ACCOUNT_TYPES.map((accountType) => (
                <MenuItem key={accountType} value={accountType}>
                  {t(`types.${accountType}`)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t('dialog.currency')}
              value={currency}
              onChange={(event) => setCurrency(event.target.value.toUpperCase())}
              helperText={currency && !currencyValid ? t('dialog.currencyInvalid') : t('dialog.currencyHint')}
              error={currency.length > 0 && !currencyValid}
              required
              fullWidth
              slotProps={{ htmlInput: { maxLength: 3 } }}
            />
            <TextField
              label={t('dialog.openingBalance')}
              type="number"
              value={openingBalance}
              onChange={(event) => setOpeningBalance(event.target.value)}
              fullWidth
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
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
          <Button onClick={handleClose}>{t('common:actions.cancel')}</Button>
          <Button type="submit" variant="contained" loading={mutation.isPending} disabled={!name || !currencyValid}>
            {t('dialog.create')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
