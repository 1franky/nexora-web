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
import { purchaseWithCreditCard } from '../../api/creditCardsApi'
import { getApiErrorMessage } from '../../api/apiError'
import QuickCreateCategoryDialog from '../transactions/QuickCreateCategoryDialog'

const NEW_CATEGORY_OPTION = '__new__'

function today(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

interface CreditCardPurchaseDialogProps {
  open: boolean
  cardId: string
  cardAccountId: string
  onClose: () => void
}

export default function CreditCardPurchaseDialog({ open, cardId, cardAccountId, onClose }: CreditCardPurchaseDialogProps) {
  const { t } = useTranslation('creditCards')
  const queryClient = useQueryClient()

  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(today())
  const [merchant, setMerchant] = useState('')
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
    mutationFn: (payload: Parameters<typeof purchaseWithCreditCard>[1]) => purchaseWithCreditCard(cardId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditCards'] })
      queryClient.invalidateQueries({ queryKey: ['creditCard', cardId] })
      queryClient.invalidateQueries({ queryKey: ['transactions', cardAccountId] })
      resetForm()
      onClose()
    },
    onError: (err) => setError(getApiErrorMessage(err, t('common:errors.generic'))),
  })

  const parsedAmount = Number(amount)
  const canSubmit = Number.isFinite(parsedAmount) && parsedAmount > 0 && date !== '' && merchant.trim() !== ''

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    setError(null)
    mutation.mutate({
      amount: parsedAmount,
      date,
      merchant: merchant.trim(),
      categoryId: categoryId || undefined,
      description: description.trim() || undefined,
      reference: reference.trim() || undefined,
    })
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{t('purchaseDialog.title')}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <DialogContent>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <Stack direction="row" spacing={2}>
                <TextField
                  label={t('purchaseDialog.amount')}
                  type="number"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                  fullWidth
                  autoFocus
                  slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
                />
                <TextField
                  label={t('purchaseDialog.date')}
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Stack>
              <TextField
                label={t('purchaseDialog.merchant')}
                value={merchant}
                onChange={(event) => setMerchant(event.target.value)}
                required
                fullWidth
              />
              <TextField
                select
                label={t('purchaseDialog.category')}
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
                <MenuItem value="">{t('purchaseDialog.noCategoryOption')}</MenuItem>
                {expenseCategories.map((category: Category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
                <MenuItem value={NEW_CATEGORY_OPTION}>{t('purchaseDialog.newCategoryOption')}</MenuItem>
              </TextField>
              <TextField
                label={t('purchaseDialog.description')}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                fullWidth
              />
              <TextField
                label={t('purchaseDialog.reference')}
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>{t('common:actions.cancel')}</Button>
            <Button type="submit" variant="contained" loading={mutation.isPending} disabled={!canSubmit}>
              {t('purchaseDialog.submit')}
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
