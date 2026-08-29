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
import { listCategories, type Category } from '../../api/categoriesApi'
import { createInstallmentPlan } from '../../api/installmentsApi'
import { getApiErrorMessage } from '../../api/apiError'
import QuickCreateCategoryDialog from '../transactions/QuickCreateCategoryDialog'

const NEW_CATEGORY_OPTION = '__new__'

function today(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

interface CreateInstallmentPlanDialogProps {
  open: boolean
  cardId: string
  cardAccountId: string
  onClose: () => void
}

export default function CreateInstallmentPlanDialog({ open, cardId, cardAccountId, onClose }: CreateInstallmentPlanDialogProps) {
  const { t } = useTranslation('creditCards')
  const queryClient = useQueryClient()

  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(today())
  const [merchant, setMerchant] = useState('')
  const [installmentCount, setInstallmentCount] = useState('3')
  const [interestRate, setInterestRate] = useState('0')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: listCategories, enabled: open })
  const expenseCategories = (categories ?? []).filter((category) => category.type === 'EXPENSE')

  const resetForm = () => {
    setAmount('')
    setDate(today())
    setMerchant('')
    setInstallmentCount('3')
    setInterestRate('0')
    setCategoryId('')
    setDescription('')
    setReference('')
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof createInstallmentPlan>[1]) => createInstallmentPlan(cardId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditCards'] })
      queryClient.invalidateQueries({ queryKey: ['creditCard', cardId] })
      queryClient.invalidateQueries({ queryKey: ['installmentPlans', cardId] })
      queryClient.invalidateQueries({ queryKey: ['transactions', cardAccountId] })
      resetForm()
      onClose()
    },
    onError: (err) => setError(getApiErrorMessage(err, t('common:errors.generic'))),
  })

  const parsedAmount = Number(amount)
  const parsedCount = Number(installmentCount)
  const parsedRate = Number(interestRate)
  const canSubmit =
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    date !== '' &&
    merchant.trim() !== '' &&
    Number.isInteger(parsedCount) &&
    parsedCount >= 2 &&
    parsedCount <= 60 &&
    Number.isFinite(parsedRate) &&
    parsedRate >= 0

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    setError(null)
    mutation.mutate({
      amount: parsedAmount,
      date,
      merchant: merchant.trim(),
      installmentCount: parsedCount,
      interestRate: parsedRate,
      categoryId: categoryId || undefined,
      description: description.trim() || undefined,
      reference: reference.trim() || undefined,
    })
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{t('installments.dialog.title')}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <DialogContent>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <Stack direction="row" spacing={2}>
                <TextField
                  label={t('installments.dialog.amount')}
                  type="number"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                  fullWidth
                  autoFocus
                  slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
                />
                <TextField
                  label={t('installments.dialog.date')}
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Stack>
              <TextField
                label={t('installments.dialog.merchant')}
                value={merchant}
                onChange={(event) => setMerchant(event.target.value)}
                required
                fullWidth
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  label={t('installments.dialog.installmentCount')}
                  type="number"
                  value={installmentCount}
                  onChange={(event) => setInstallmentCount(event.target.value)}
                  helperText={t('installments.dialog.installmentCountHint')}
                  required
                  fullWidth
                  slotProps={{ htmlInput: { min: 2, max: 60, step: 1 } }}
                />
                <TextField
                  label={t('installments.dialog.interestRate')}
                  type="number"
                  value={interestRate}
                  onChange={(event) => setInterestRate(event.target.value)}
                  helperText={t('installments.dialog.interestRateHint')}
                  required
                  fullWidth
                  slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
                />
              </Stack>
              <TextField
                select
                label={t('installments.dialog.category')}
                value={categoryId}
                onChange={(event) => {
                  if (event.target.value === NEW_CATEGORY_OPTION) {
                    setQuickCreateOpen(true)
                    return
                  }
                  setCategoryId(event.target.value)
                }}
                fullWidth
              >
                <MenuItem value="">{t('installments.dialog.noCategoryOption')}</MenuItem>
                {expenseCategories.map((category: Category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
                <MenuItem value={NEW_CATEGORY_OPTION}>{t('installments.dialog.newCategoryOption')}</MenuItem>
              </TextField>
              <TextField
                label={t('installments.dialog.description')}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                fullWidth
              />
              <TextField
                label={t('installments.dialog.reference')}
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>{t('common:actions.cancel')}</Button>
            <Button type="submit" variant="contained" loading={mutation.isPending} disabled={!canSubmit}>
              {t('installments.dialog.submit')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <QuickCreateCategoryDialog
        open={quickCreateOpen}
        type="EXPENSE"
        onClose={() => setQuickCreateOpen(false)}
        onCreated={(category) => {
          setCategoryId(category.id)
          setQuickCreateOpen(false)
        }}
      />
    </>
  )
}
