import { useEffect, useState, type FormEvent } from 'react'
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
import { updateCreditCardPurchase } from '../../api/creditCardsApi'
import { getApiErrorMessage } from '../../api/apiError'
import type { Transaction } from '../../api/transactionsApi'
import QuickCreateCategoryDialog from '../transactions/QuickCreateCategoryDialog'

const NEW_CATEGORY_OPTION = '__new__'

interface EditCreditCardPurchaseDialogProps {
  purchase: Transaction | null
  cardId: string
  cardAccountId: string
  onClose: () => void
}

/** Solo para compras normales (sin plan MSI/MCI) — esas se editan desde EditInstallmentPlanDialog. */
export default function EditCreditCardPurchaseDialog({ purchase, cardId, cardAccountId, onClose }: EditCreditCardPurchaseDialogProps) {
  const { t } = useTranslation('creditCards')
  const queryClient = useQueryClient()

  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [merchant, setMerchant] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: listCategories, enabled: purchase !== null })
  const expenseCategories = (categories ?? []).filter((category) => category.type === 'EXPENSE' && category.status === 'ACTIVE')

  useEffect(() => {
    if (purchase) {
      setAmount(String(purchase.amount))
      setDate(purchase.date)
      setMerchant(purchase.merchant ?? '')
      setCategoryId(purchase.categoryId ?? '')
      setDescription(purchase.description ?? '')
      setReference(purchase.reference ?? '')
      setError(null)
    }
  }, [purchase])

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateCreditCardPurchase>[2]) =>
      updateCreditCardPurchase(cardId, purchase!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditCards'] })
      queryClient.invalidateQueries({ queryKey: ['creditCard', cardId] })
      queryClient.invalidateQueries({ queryKey: ['transactions', cardAccountId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
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
      <Dialog open={purchase !== null} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>{t('purchaseDialog.editTitle')}</DialogTitle>
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
            <Button onClick={onClose}>{t('common:actions.cancel')}</Button>
            <Button type="submit" variant="contained" loading={mutation.isPending} disabled={!canSubmit}>
              {t('common:actions.save')}
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
