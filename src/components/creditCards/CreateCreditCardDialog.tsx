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
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { createCreditCard } from '../../api/creditCardsApi'
import { getApiErrorMessage } from '../../api/apiError'

const CURRENCY_PATTERN = /^[A-Z]{3}$/

interface CreateCreditCardDialogProps {
  open: boolean
  onClose: () => void
}

export default function CreateCreditCardDialog({ open, onClose }: CreateCreditCardDialogProps) {
  const { t } = useTranslation('creditCards')
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [bank, setBank] = useState('')
  const [last4, setLast4] = useState('')
  const [creditLimit, setCreditLimit] = useState('')
  const [closingDay, setClosingDay] = useState('1')
  const [paymentDueDay, setPaymentDueDay] = useState('15')
  const [currency, setCurrency] = useState('MXN')
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setName('')
    setBank('')
    setLast4('')
    setCreditLimit('')
    setClosingDay('1')
    setPaymentDueDay('15')
    setCurrency('MXN')
    setError(null)
  }

  const mutation = useMutation({
    mutationFn: createCreditCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditCards'] })
      resetForm()
      onClose()
    },
    onError: (err) => setError(getApiErrorMessage(err, t('common:errors.generic'))),
  })

  const last4Valid = /^[0-9]{4}$/.test(last4)
  const currencyValid = CURRENCY_PATTERN.test(currency)
  const limitValid = Number(creditLimit) > 0
  const canSubmit = name.trim() !== '' && bank.trim() !== '' && last4Valid && currencyValid && limitValid

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    setError(null)
    mutation.mutate({
      name,
      bank,
      last4,
      creditLimit: Number(creditLimit),
      closingDay: Number(closingDay),
      paymentDueDay: Number(paymentDueDay),
      currency,
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
            <TextField label={t('dialog.bank')} value={bank} onChange={(event) => setBank(event.target.value)} required fullWidth />
            <TextField
              label={t('dialog.last4')}
              value={last4}
              onChange={(event) => setLast4(event.target.value.replace(/\D/g, '').slice(0, 4))}
              helperText={last4 && !last4Valid ? undefined : t('dialog.last4Hint')}
              error={last4.length > 0 && !last4Valid}
              required
              fullWidth
              slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 4 } }}
            />
            <TextField
              label={t('dialog.creditLimit')}
              type="number"
              value={creditLimit}
              onChange={(event) => setCreditLimit(event.target.value)}
              required
              fullWidth
              slotProps={{ htmlInput: { min: 0.01, step: '0.01' } }}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label={t('dialog.closingDay')}
                type="number"
                value={closingDay}
                onChange={(event) => setClosingDay(event.target.value)}
                helperText={t('dialog.dayHint')}
                required
                fullWidth
                slotProps={{ htmlInput: { min: 1, max: 28 } }}
              />
              <TextField
                label={t('dialog.paymentDueDay')}
                type="number"
                value={paymentDueDay}
                onChange={(event) => setPaymentDueDay(event.target.value)}
                helperText={t('dialog.dayHint')}
                required
                fullWidth
                slotProps={{ htmlInput: { min: 1, max: 28 } }}
              />
            </Stack>
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
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t('common:actions.cancel')}</Button>
          <Button type="submit" variant="contained" loading={mutation.isPending} disabled={!canSubmit}>
            {t('dialog.create')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
