import { useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
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
import { listAccounts } from '../../api/accountsApi'
import { listCategories, type Category } from '../../api/categoriesApi'
import type { ScheduledCharge, ScheduledChargeFrequency } from '../../api/scheduledChargesApi'
import { getApiErrorMessage } from '../../api/apiError'
import { formatDateWithYear } from '../dataviz/format'
import QuickCreateCategoryDialog from '../transactions/QuickCreateCategoryDialog'
import {
  countBackdatedOccurrences,
  firstOnOrAfter,
  hasNoOccurrenceInRange,
  isEligibleAccount,
  monthNameEs,
  todayIso,
  type ScheduleRule,
} from './schedule'
import { useSaveScheduledCharge } from './useScheduledCharges'

const NEW_CATEGORY_OPTION = '__new__'
const DAYS = Array.from({ length: 31 }, (_, index) => index + 1)
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1)

interface ScheduledChargeFormDialogProps {
  open: boolean
  /** null = alta; con valor = edición de ese cargo. */
  charge: ScheduledCharge | null
  /** Cuenta preseleccionada en el alta (desde el detalle de una cuenta/tarjeta). */
  defaultAccountId?: string
  onClose: () => void
}

/**
 * Alta/edición de un cargo programado (W13). La fecha de inicio arranca en la
 * próxima ocurrencia desde hoy y la sigue mientras el usuario no la toque; si
 * la pone en el pasado, avisa cuántos cargos atrasados registrará nexora-api
 * al guardar (misma regla que ScheduleCalculator.kt, ver schedule.ts).
 */
export default function ScheduledChargeFormDialog({ open, charge, defaultAccountId, onClose }: ScheduledChargeFormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      {/* El formulario se monta al abrir y se desmonta al cerrar: cada apertura arranca con el estado inicial correcto. */}
      {open && <ScheduledChargeForm charge={charge} defaultAccountId={defaultAccountId} onClose={onClose} />}
    </Dialog>
  )
}

function ScheduledChargeForm({ charge: chargeProp, defaultAccountId, onClose }: Omit<ScheduledChargeFormDialogProps, 'open'>) {
  const { t } = useTranslation('scheduledCharges')
  // Fijo durante la vida del formulario: al cerrar, el padre pone charge = null mientras corre la animación de salida.
  const [charge] = useState(chargeProp)
  const isEdit = charge !== null

  const [accountId, setAccountId] = useState(charge?.accountId ?? defaultAccountId ?? '')
  const [name, setName] = useState(charge?.name ?? '')
  const [amount, setAmount] = useState(charge ? String(charge.amount) : '')
  const [categoryId, setCategoryId] = useState(charge?.categoryId ?? '')
  const [description, setDescription] = useState(charge?.description ?? '')
  const [frequency, setFrequency] = useState<ScheduledChargeFrequency>(charge?.frequency ?? 'MONTHLY')
  const [dayOfMonth, setDayOfMonth] = useState(charge ? String(charge.dayOfMonth) : '')
  const [monthOfYear, setMonthOfYear] = useState(charge?.monthOfYear ? String(charge.monthOfYear) : '')
  const [startDate, setStartDate] = useState(charge?.startDate ?? '')
  /** Mientras sea false (solo en alta), la fecha de inicio se deriva de la regla: la próxima ocurrencia desde hoy. */
  const [startDateTouched, setStartDateTouched] = useState(isEdit)
  const [endDate, setEndDate] = useState(charge?.endDate ?? '')
  const [error, setError] = useState<string | null>(null)
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)

  const { data: accounts } = useQuery({ queryKey: ['accounts'], queryFn: listAccounts, })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: listCategories, })
  const eligibleAccounts = useMemo(() => (accounts ?? []).filter(isEligibleAccount), [accounts])
  const expenseCategories = useMemo(
    () => (categories ?? []).filter((category) => category.type === 'EXPENSE' && category.status === 'ACTIVE'),
    [categories],
  )

  const mutation = useSaveScheduledCharge({
    onSuccess: onClose,
    onError: (err) => setError(getApiErrorMessage(err, t('common:errors.generic'))),
  })

  // Una cuenta/categoría que dejó de ser válida (archivada) no aparece en las opciones: se deja vacía para obligar a elegir otra.
  const selectedAccountId = eligibleAccounts.some((account) => account.id === accountId) ? accountId : ''
  const selectedCategoryId = expenseCategories.some((category) => category.id === categoryId) ? categoryId : ''

  const today = todayIso()
  const parsedAmount = Number(amount)
  const parsedDay = Number(dayOfMonth)
  const parsedMonth = Number(monthOfYear)
  const rule: ScheduleRule | null =
    Number.isInteger(parsedDay) && parsedDay >= 1 && parsedDay <= 31 && (frequency === 'MONTHLY' || (parsedMonth >= 1 && parsedMonth <= 12))
      ? { frequency, dayOfMonth: parsedDay, monthOfYear: frequency === 'YEARLY' ? parsedMonth : null }
      : null

  const effectiveStartDate = startDateTouched ? startDate : rule ? firstOnOrAfter(rule, today) : ''
  const startDateLocked = isEdit && charge.lastRunDate !== null
  const firstOccurrence = rule && effectiveStartDate ? firstOnOrAfter(rule, effectiveStartDate) : null

  const endBeforeStart = endDate !== '' && effectiveStartDate !== '' && endDate < effectiveStartDate
  const noOccurrenceInRange =
    !endBeforeStart && rule !== null && endDate !== '' && effectiveStartDate !== '' && hasNoOccurrenceInRange(rule, effectiveStartDate, endDate)

  const scheduleChanged =
    isEdit &&
    (charge.frequency !== frequency ||
      charge.dayOfMonth !== parsedDay ||
      (charge.monthOfYear ?? null) !== (frequency === 'YEARLY' ? parsedMonth : null) ||
      charge.startDate !== effectiveStartDate)
  // En edición, nexora-api solo registra atrasados si el cargo nunca ha corrido y se le cambió la regla (recalcula desde startDate).
  const mayPostBackdated = !isEdit || (charge.status === 'ACTIVE' && charge.lastRunDate === null && scheduleChanged)
  const backdatedCount =
    mayPostBackdated && rule && effectiveStartDate !== '' && effectiveStartDate < today && !endBeforeStart
      ? countBackdatedOccurrences(rule, effectiveStartDate, today, endDate || null)
      : 0

  const canSubmit =
    selectedAccountId !== '' &&
    name.trim() !== '' &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    rule !== null &&
    effectiveStartDate !== '' &&
    !endBeforeStart &&
    !noOccurrenceInRange

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit || !rule) return
    setError(null)
    mutation.mutate({
      id: charge?.id,
      request: {
        accountId: selectedAccountId,
        name: name.trim(),
        amount: parsedAmount,
        categoryId: selectedCategoryId || undefined,
        description: description.trim() || undefined,
        frequency: rule.frequency,
        dayOfMonth: rule.dayOfMonth,
        monthOfYear: rule.monthOfYear,
        startDate: effectiveStartDate,
        endDate: endDate || undefined,
      },
    })
  }

  return (
    <>
      <DialogTitle>{isEdit ? t('dialog.editTitle') : t('dialog.createTitle')}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            {isEdit && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('dialog.editHint')}
              </Typography>
            )}
            {accounts && eligibleAccounts.length === 0 && <Alert severity="info">{t('dialog.noEligibleAccounts')}</Alert>}
            <TextField
              select
              label={t('dialog.account')}
              value={selectedAccountId}
              onChange={(event) => setAccountId(event.target.value)}
              helperText={t('dialog.accountHint')}
              required
              fullWidth
            >
              {eligibleAccounts.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.name} ({account.currency})
                </MenuItem>
              ))}
            </TextField>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('dialog.name')}
                placeholder={t('dialog.namePlaceholder')}
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                fullWidth
                autoFocus
                slotProps={{ htmlInput: { maxLength: 120 } }}
              />
              <TextField
                label={t('dialog.amount')}
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
                fullWidth
                slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
              />
            </Stack>
            <TextField
              select
              label={t('dialog.category')}
              value={selectedCategoryId}
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
              {expenseCategories.map((category: Category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
              <MenuItem value={NEW_CATEGORY_OPTION}>{t('dialog.newCategoryOption')}</MenuItem>
            </TextField>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label={t('dialog.frequency')}
                value={frequency}
                onChange={(event) => setFrequency(event.target.value as ScheduledChargeFrequency)}
                required
                fullWidth
              >
                <MenuItem value="MONTHLY">{t('frequencies.MONTHLY')}</MenuItem>
                <MenuItem value="YEARLY">{t('frequencies.YEARLY')}</MenuItem>
              </TextField>
              <TextField
                select
                label={t('dialog.dayOfMonth')}
                value={dayOfMonth}
                onChange={(event) => setDayOfMonth(event.target.value)}
                required
                fullWidth
              >
                {DAYS.map((day) => (
                  <MenuItem key={day} value={String(day)}>
                    {day}
                  </MenuItem>
                ))}
              </TextField>
              {frequency === 'YEARLY' && (
                <TextField
                  select
                  label={t('dialog.monthOfYear')}
                  value={monthOfYear}
                  onChange={(event) => setMonthOfYear(event.target.value)}
                  required
                  fullWidth
                >
                  {MONTHS.map((month) => (
                    <MenuItem key={month} value={String(month)}>
                      {monthNameEs(month)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: '4px !important' }}>
              {t('dialog.dayOfMonthHint')}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('dialog.startDate')}
                type="date"
                value={effectiveStartDate}
                onChange={(event) => {
                  setStartDateTouched(true)
                  setStartDate(event.target.value)
                }}
                required
                fullWidth
                disabled={startDateLocked}
                helperText={
                  startDateLocked
                    ? t('dialog.startDateLocked')
                    : firstOccurrence
                      ? t('dialog.startDateHint', { date: formatDateWithYear(firstOccurrence) })
                      : ' '
                }
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label={t('dialog.endDate')}
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                fullWidth
                error={endBeforeStart || noOccurrenceInRange}
                helperText={
                  endBeforeStart
                    ? t('dialog.endBeforeStart')
                    : noOccurrenceInRange
                      ? t('dialog.noOccurrenceInRange')
                      : t('dialog.endDateHint')
                }
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: effectiveStartDate || undefined } }}
              />
            </Stack>
            {backdatedCount > 0 && <Alert severity="warning">{t('dialog.backdatedWarning', { count: backdatedCount })}</Alert>}
            <TextField
              label={t('dialog.description')}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              fullWidth
              slotProps={{ htmlInput: { maxLength: 500 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('common:actions.cancel')}</Button>
          <Button type="submit" variant="contained" loading={mutation.isPending} disabled={!canSubmit}>
            {isEdit ? t('common:actions.save') : t('dialog.create')}
          </Button>
        </DialogActions>
      </Box>

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
