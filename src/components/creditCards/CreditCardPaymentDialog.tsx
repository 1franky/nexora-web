import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { listAccounts } from '../../api/accountsApi'
import { payCreditCard } from '../../api/creditCardsApi'
import { getApiErrorMessage } from '../../api/apiError'

function today(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

interface CreditCardPaymentDialogProps {
  open: boolean
  cardId: string
  cardAccountId: string
  onClose: () => void
}

export default function CreditCardPaymentDialog({ open, cardId, cardAccountId, onClose }: CreditCardPaymentDialogProps) {
  const { t } = useTranslation('creditCards')
  const queryClient = useQueryClient()

  const [fromAccountId, setFromAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(today())
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: accounts } = useQuery({ queryKey: ['accounts'], queryFn: listAccounts, enabled: open })
  // No se puede pagar una tarjeta con otra tarjeta, ni con una cuenta de retiro
  // (AFORE/PPR) — regla de negocio en nexora-api (TransactionService.recordCreditCardPayment).
  const eligibleAccounts = (accounts ?? []).filter(
    (account) => account.status === 'ACTIVE' && account.type !== 'CREDIT_CARD' && account.type !== 'AFORE' && account.type !== 'PPR'
  )

  const resetForm = () => {
    setFromAccountId('')
    setAmount('')
    setDate(today())
    setDescription('')
    setReference('')
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof payCreditCard>[1]) => payCreditCard(cardId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditCards'] })
      queryClient.invalidateQueries({ queryKey: ['creditCard', cardId] })
      queryClient.invalidateQueries({ queryKey: ['transactions', cardAccountId] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      // Un pago puede marcar cuotas MSI/MCI del mes corriente como pagadas (nexora-api).
      queryClient.invalidateQueries({ queryKey: ['installmentPlans', cardId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      if (fromAccountId) queryClient.invalidateQueries({ queryKey: ['transactions', fromAccountId] })
      resetForm()
      onClose()
    },
    onError: (err) => setError(getApiErrorMessage(err, t('common:errors.generic'))),
  })

  const parsedAmount = Number(amount)
  const canSubmit = fromAccountId !== '' && Number.isFinite(parsedAmount) && parsedAmount > 0 && date !== ''

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    setError(null)
    mutation.mutate({
      fromAccountId,
      amount: parsedAmount,
      date,
      description: description.trim() || undefined,
      reference: reference.trim() || undefined,
    })
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('paymentDialog.title')}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            {eligibleAccounts.length === 0 ? (
              <Alert severity="info">{t('paymentDialog.noAccountsAvailable')}</Alert>
            ) : (
              <TextField
                select
                label={t('paymentDialog.fromAccount')}
                value={fromAccountId}
                onChange={(event) => setFromAccountId(event.target.value)}
                required
                fullWidth
                autoFocus
              >
                {eligibleAccounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </MenuItem>
                ))}
              </TextField>
            )}
            <Stack direction="row" spacing={2}>
              <TextField
                label={t('paymentDialog.amount')}
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
                fullWidth
                slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
              />
              <TextField
                label={t('paymentDialog.date')}
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
            <TextField
              label={t('paymentDialog.description')}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              fullWidth
            />
            <TextField
              label={t('paymentDialog.reference')}
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t('common:actions.cancel')}</Button>
          <Button type="submit" variant="contained" loading={mutation.isPending} disabled={!canSubmit}>
            {t('paymentDialog.submit')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
