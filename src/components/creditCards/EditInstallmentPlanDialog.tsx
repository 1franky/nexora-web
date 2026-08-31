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
import Typography from '@mui/material/Typography'
import { listCategories, type Category } from '../../api/categoriesApi'
import { updateInstallmentPlan, type InstallmentPlan } from '../../api/installmentsApi'
import { getApiErrorMessage } from '../../api/apiError'
import QuickCreateCategoryDialog from '../transactions/QuickCreateCategoryDialog'

const NEW_CATEGORY_OPTION = '__new__'

interface EditInstallmentPlanDialogProps {
  plan: InstallmentPlan | null
  cardId: string
  onClose: () => void
}

/**
 * Si el plan ya tiene alguna cuota pagada, nexora-api rechaza cambiar monto,
 * fecha o número de cuotas — esos campos se muestran deshabilitados en vez
 * de dejar que el usuario los edite para toparse con el error al guardar.
 */
export default function EditInstallmentPlanDialog({ plan, cardId, onClose }: EditInstallmentPlanDialogProps) {
  const { t } = useTranslation('creditCards')
  const queryClient = useQueryClient()

  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [merchant, setMerchant] = useState('')
  const [installmentCount, setInstallmentCount] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: listCategories, enabled: plan !== null })
  const expenseCategories = (categories ?? []).filter((category) => category.type === 'EXPENSE' && category.status === 'ACTIVE')

  const structuralLocked = (plan?.installmentsPaid ?? 0) > 0

  useEffect(() => {
    if (plan) {
      setAmount(String(plan.originalAmount))
      setDate(plan.startDate)
      setMerchant(plan.merchant ?? '')
      setInstallmentCount(String(plan.installmentCount))
      setInterestRate(String(plan.interestRate))
      setCategoryId(plan.categoryId ?? '')
      setDescription(plan.description ?? '')
      setReference(plan.reference ?? '')
      setError(null)
    }
  }, [plan])

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateInstallmentPlan>[1]) => updateInstallmentPlan(plan!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditCards'] })
      queryClient.invalidateQueries({ queryKey: ['creditCard', cardId] })
      queryClient.invalidateQueries({ queryKey: ['installmentPlans', cardId] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
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
      <Dialog open={plan !== null} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>{t('installments.editDialog.title')}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <DialogContent>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              {structuralLocked && (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('installments.editDialog.structuralLockedHint')}
                </Typography>
              )}
              <Stack direction="row" spacing={2}>
                <TextField
                  label={t('installments.dialog.amount')}
                  type="number"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                  fullWidth
                  autoFocus
                  disabled={structuralLocked}
                  slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
                />
                <TextField
                  label={t('installments.dialog.date')}
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                  fullWidth
                  disabled={structuralLocked}
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
                  disabled={structuralLocked}
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
                  disabled={structuralLocked}
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
