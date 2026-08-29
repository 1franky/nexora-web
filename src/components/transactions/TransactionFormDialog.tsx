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
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { listCategories, type Category } from '../../api/categoriesApi'
import { createTransaction, createTransfer } from '../../api/transactionsApi'
import { type Account } from '../../api/accountsApi'
import { getApiErrorMessage } from '../../api/apiError'
import QuickCreateCategoryDialog from './QuickCreateCategoryDialog'

type MovementKind = 'INCOME' | 'EXPENSE' | 'TRANSFER'

const NEW_CATEGORY_OPTION = '__new__'

function today(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

interface TransactionFormDialogProps {
  open: boolean
  /** Cuentas activas del usuario, para elegir en cuál registrar el movimiento (y el destino de una transferencia). */
  accounts: Account[]
  /** Precarga la cuenta cuando el filtro de Movimientos ya está en una cuenta específica; vacío ("todas las cuentas") no precarga ninguna. */
  defaultAccountId?: string
  onClose: () => void
}

export default function TransactionFormDialog({ open, accounts, defaultAccountId, onClose }: TransactionFormDialogProps) {
  const { t } = useTranslation('transactions')
  const queryClient = useQueryClient()

  const [kind, setKind] = useState<MovementKind>('EXPENSE')
  const [accountId, setAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(today())
  const [categoryId, setCategoryId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)

  // Cada vez que se abre, precarga la cuenta del filtro actual (o ninguna, si el filtro es "todas las cuentas").
  useEffect(() => {
    if (open) setAccountId(defaultAccountId ?? '')
  }, [open, defaultAccountId])

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: listCategories, enabled: open })
  const categoryType = kind === 'INCOME' ? 'INCOME' : 'EXPENSE'
  // Una categoría archivada sigue existiendo (para lo ya categorizado) pero nexora-api rechaza usarla en un movimiento nuevo.
  const categoriesForKind = (categories ?? []).filter((category) => category.type === categoryType && category.status === 'ACTIVE')
  const otherActiveAccounts = accounts.filter((account) => account.id !== accountId)

  const resetForm = () => {
    setKind('EXPENSE')
    setAccountId(defaultAccountId ?? '')
    setAmount('')
    setDate(today())
    setCategoryId('')
    setToAccountId('')
    setDescription('')
    setReference('')
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  // Con la cuenta ahora elegible dentro del diálogo (en vez de fija por prop), invalidar por prefijo
  // cubre cualquier combinación de filtro ['transactions', accountId | undefined] que la página tenga cacheada.
  const invalidateAfterMutation = () => {
    queryClient.invalidateQueries({ queryKey: ['accounts'] })
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
  }

  const simpleMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      invalidateAfterMutation()
      resetForm()
      onClose()
    },
    onError: (err) => setError(getApiErrorMessage(err, t('common:errors.generic'))),
  })

  const transferMutation = useMutation({
    mutationFn: createTransfer,
    onSuccess: () => {
      invalidateAfterMutation()
      resetForm()
      onClose()
    },
    onError: (err) => setError(getApiErrorMessage(err, t('common:errors.generic'))),
  })

  const isPending = simpleMutation.isPending || transferMutation.isPending
  const parsedAmount = Number(amount)
  const amountValid = Number.isFinite(parsedAmount) && parsedAmount > 0
  const transferValid = kind !== 'TRANSFER' || (toAccountId !== '' && toAccountId !== accountId)
  const canSubmit = accountId !== '' && amountValid && date !== '' && transferValid

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    setError(null)

    if (kind === 'TRANSFER') {
      transferMutation.mutate({
        fromAccountId: accountId,
        toAccountId,
        amount: parsedAmount,
        date,
        description: description.trim() || undefined,
        reference: reference.trim() || undefined,
      })
      return
    }

    simpleMutation.mutate({
      type: kind,
      accountId,
      amount: parsedAmount,
      date,
      categoryId: categoryId || undefined,
      description: description.trim() || undefined,
      reference: reference.trim() || undefined,
    })
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{t('dialog.title')}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <DialogContent>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}

              <TextField
                select
                label={t('dialog.account')}
                value={accountId}
                onChange={(event) => {
                  setAccountId(event.target.value)
                  if (event.target.value === toAccountId) setToAccountId('')
                }}
                required
                fullWidth
              >
                {accounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </MenuItem>
                ))}
              </TextField>

              <ToggleButtonGroup
                value={kind}
                exclusive
                fullWidth
                onChange={(_event, value: MovementKind | null) => {
                  if (value) {
                    setKind(value)
                    setCategoryId('')
                  }
                }}
              >
                <ToggleButton value="EXPENSE">{t('dialog.kindExpense')}</ToggleButton>
                <ToggleButton value="INCOME">{t('dialog.kindIncome')}</ToggleButton>
                <ToggleButton value="TRANSFER" disabled={otherActiveAccounts.length === 0}>
                  {t('dialog.kindTransfer')}
                </ToggleButton>
              </ToggleButtonGroup>
              {kind === 'TRANSFER' && otherActiveAccounts.length === 0 && (
                <Alert severity="info">{t('dialog.noOtherAccounts')}</Alert>
              )}

              <Stack direction="row" spacing={2}>
                <TextField
                  label={t('dialog.amount')}
                  type="number"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                  fullWidth
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

              {kind === 'TRANSFER' ? (
                <TextField
                  select
                  label={t('dialog.toAccount')}
                  value={toAccountId}
                  onChange={(event) => setToAccountId(event.target.value)}
                  required
                  fullWidth
                >
                  {otherActiveAccounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.name} ({account.currency})
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
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
              )}

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
            <Button onClick={handleClose}>{t('common:actions.cancel')}</Button>
            <Button type="submit" variant="contained" loading={isPending} disabled={!canSubmit}>
              {t('dialog.submit')}
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
