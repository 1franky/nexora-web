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
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { updateCreditCard, type CreditCard } from '../../api/creditCardsApi'
import { getApiErrorMessage } from '../../api/apiError'

interface EditCreditCardDialogProps {
  card: CreditCard | null
  onClose: () => void
}

/** Últimos 4 dígitos y moneda no se editan aquí a propósito (ver nexora-api). */
export default function EditCreditCardDialog({ card, onClose }: EditCreditCardDialogProps) {
  const { t } = useTranslation('creditCards')
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [bank, setBank] = useState('')
  const [creditLimit, setCreditLimit] = useState('')
  const [closingDay, setClosingDay] = useState('1')
  const [paymentDueDay, setPaymentDueDay] = useState('15')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (card) {
      setName(card.name)
      setBank(card.bank)
      setCreditLimit(String(card.creditLimit))
      setClosingDay(String(card.closingDay))
      setPaymentDueDay(String(card.paymentDueDay))
      setError(null)
    }
  }, [card])

  const mutation = useMutation({
    mutationFn: (vars: {
      id: string
      name: string
      bank: string
      creditLimit: number
      closingDay: number
      paymentDueDay: number
    }) =>
      updateCreditCard(vars.id, {
        name: vars.name,
        bank: vars.bank,
        creditLimit: vars.creditLimit,
        closingDay: vars.closingDay,
        paymentDueDay: vars.paymentDueDay,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditCards'] })
      queryClient.invalidateQueries({ queryKey: ['creditCard', card?.id] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    },
    onError: (err) => setError(getApiErrorMessage(err, t('common:errors.generic'))),
  })

  const limitValid = Number(creditLimit) > 0
  const canSubmit = name.trim() !== '' && bank.trim() !== '' && limitValid

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!card || !canSubmit) return
    setError(null)
    mutation.mutate({
      id: card.id,
      name,
      bank,
      creditLimit: Number(creditLimit),
      closingDay: Number(closingDay),
      paymentDueDay: Number(paymentDueDay),
    })
  }

  return (
    <Dialog open={card !== null} onClose={onClose} fullWidth maxWidth="sm">
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
            <TextField label={t('dialog.bank')} value={bank} onChange={(event) => setBank(event.target.value)} required fullWidth />
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
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('common:actions.cancel')}</Button>
          <Button type="submit" variant="contained" loading={mutation.isPending} disabled={!canSubmit}>
            {t('common:actions.save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
