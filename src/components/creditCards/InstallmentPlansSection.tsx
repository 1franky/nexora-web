import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { listInstallmentPlansForCard, payInstallment, type Installment, type InstallmentPlan } from '../../api/installmentsApi'
import { getApiErrorMessage } from '../../api/apiError'
import { formatCurrencyIn, formatDateShort } from '../dataviz/format'
import EmptyChartState from '../dataviz/EmptyChartState'

interface InstallmentPlansSectionProps {
  cardId: string
  currency: string
}

export default function InstallmentPlansSection({ cardId, currency }: InstallmentPlansSectionProps) {
  const { t } = useTranslation('creditCards')
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const { data: plans, isLoading, isError } = useQuery({
    queryKey: ['installmentPlans', cardId],
    queryFn: () => listInstallmentPlansForCard(cardId),
  })

  const payMutation = useMutation({
    mutationFn: ({ planId, installmentId }: { planId: string; installmentId: string }) => payInstallment(planId, installmentId),
    onSuccess: () => {
      setError(null)
      queryClient.invalidateQueries({ queryKey: ['installmentPlans', cardId] })
    },
    onError: (err) => setError(getApiErrorMessage(err, t('common:errors.generic'))),
  })

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  if (isError) {
    return <Alert severity="error">{t('installments.loadError')}</Alert>
  }

  if (!plans || plans.length === 0) {
    return <EmptyChartState message={t('installments.empty')} />
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {plans.map((plan: InstallmentPlan) => (
        <Accordion key={plan.id} variant="outlined" disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', width: '100%', pr: 1 }}>
              <Chip size="small" label={t(`installments.planTypes.${plan.planType}`)} color={plan.planType === 'MCI' ? 'warning' : 'default'} />
              <Typography sx={{ fontWeight: 600 }}>{formatCurrencyIn(plan.totalAmount, currency)}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('installments.paidOf', { paid: plan.installmentsPaid, total: plan.installmentCount })}
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Chip
                size="small"
                variant="outlined"
                label={t(`installments.statuses.${plan.status}`)}
                color={plan.status === 'ACTIVE' ? 'primary' : plan.status === 'COMPLETED' ? 'success' : 'default'}
              />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack sx={{ flexDirection: 'row', gap: 3, flexWrap: 'wrap', mb: 2 }}>
              <SummaryItem label={t('installments.installmentAmount')} value={formatCurrencyIn(plan.installmentAmount, currency)} />
              <SummaryItem label={t('installments.financedBalance')} value={formatCurrencyIn(plan.financedBalance, currency)} />
              <SummaryItem
                label={t('installments.nextInstallment')}
                value={plan.nextInstallment ? formatDateShort(plan.nextInstallment.dueDate) : t('installments.noNextInstallment')}
              />
              <SummaryItem label={t('installments.endDate')} value={formatDateShort(plan.endDate)} />
            </Stack>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('installments.schedule.number')}</TableCell>
                    <TableCell>{t('installments.schedule.dueDate')}</TableCell>
                    <TableCell align="right">{t('installments.schedule.amount')}</TableCell>
                    <TableCell>{t('installments.schedule.status')}</TableCell>
                    <TableCell align="right">{t('installments.schedule.action')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {plan.installments.map((installment: Installment) => (
                    <TableRow key={installment.id}>
                      <TableCell>{installment.number}</TableCell>
                      <TableCell>{formatDateShort(installment.dueDate)}</TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrencyIn(installment.amount, currency)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          variant={installment.status === 'PAID' ? 'filled' : 'outlined'}
                          color={installment.status === 'PAID' ? 'success' : 'default'}
                          label={t(`installments.installmentStatuses.${installment.status}`)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {installment.status === 'PENDING' && (
                          <Tooltip title={t('installments.markAsPaidHint')}>
                            <Button
                              size="small"
                              onClick={() => payMutation.mutate({ planId: plan.id, installmentId: installment.id })}
                              loading={
                                payMutation.isPending &&
                                payMutation.variables?.installmentId === installment.id
                              }
                            >
                              {t('installments.markAsPaid')}
                            </Button>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Box>
  )
}
