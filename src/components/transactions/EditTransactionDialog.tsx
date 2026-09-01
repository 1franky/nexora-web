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
import { updateTransaction, type Transaction } from '../../api/transactionsApi'
import { getApiErrorMessage } from '../../api/apiError'
import QuickCreateCategoryDialog from './QuickCreateCategoryDialog'

const NEW_CATEGORY_OPTION = '__new__'

interface EditTransactionDialogProps {
  /** Solo INCOME/EXPENSE llegan aquí — TransactionsPage no muestra el ícono de editar para otros tipos. */
  transaction: Transaction | null
  onClose: () => void
}

export default function EditTransactionDialog({ transaction, onClose }: EditTransactionDialogProps) {
  const { t } = useTranslation('transactions')
  const queryClient = useQueryClient()

  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)

  const categoryType = transaction?.type === 'INCOME' ? 'INCOME' : 'EXPENSE'
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: listCategories, enabled: transaction !== null })
  const categoriesForKind = (categories ?? []).filter((category) => category.type === categoryType && category.status === 'ACTIVE')

  useEffect(() => {
    if (transaction) {
      setAmount(String(transaction.amount))
      setDate(transaction.date)
      setCategoryId(transaction.categoryId ?? '')
      setDescription(transaction.description ?? '')
      setReference(transaction.reference ?? '')
      setError(null)
    }
  }, [transaction])

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateTransaction>[1]) => updateTransaction(transaction!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    },
    onError: (err) => setError(getApiErrorMessage(err, t('common:errors.generic'))),
  })

  const parsedAmount = Number(amount)
  const canSubmit = Number.isFinite(parsedAmount) && parsedAmount > 0 && date !== ''

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    setError(null)
    mutation.mutate({
      amount: parsedAmount,
      date,
      categoryId: categoryId || undefined,
      description: description.trim() || undefined,
      reference: reference.trim() || undefined,
    })
  }

  return (
    <>
      <Dialog open={transaction !== null} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>{t('editDialog.title')}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <DialogContent>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <Stack direction="row" spacing={2}>
                <TextField
                  label={t('dialog.amount')}
                  type="number"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                  fullWidth
                  autoFocus
                  slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
                />
                <TextField
                  label={t('dialog.date')}
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Stack>
              <TextField
                select
                label={t('dialog.category')}
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
                <MenuItem value="">{t('dialog.noCategoryOption')}</MenuItem>
                {categoriesForKind.map((category: Category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
                <MenuItem value={NEW_CATEGORY_OPTION}>{t('dialog.newCategoryOption')}</MenuItem>
              </TextField>
              <TextField
                label={t('dialog.description')}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                fullWidth
              />
              <TextField
                label={t('dialog.reference')}
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
        type={categoryType}
        onClose={() => setQuickCreateOpen(false)}
        onCreated={(category) => {
          setCategoryId(category.id)
          setQuickCreateOpen(false)
        }}
      />
    </>
  )
}
