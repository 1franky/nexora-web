import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import TuneIcon from '@mui/icons-material/Tune'
import { useAuth } from '../auth/AuthContext'
import { getDashboardSummary } from '../api/dashboardApi'
import StatTile from '../components/dataviz/StatTile'
import ChartCard from '../components/dataviz/ChartCard'
import RankedBarChart from '../components/dataviz/RankedBarChart'
import MonthlyBarChart from '../components/dataviz/MonthlyBarChart'
import TrendLineChart from '../components/dataviz/TrendLineChart'
import EmptyChartState from '../components/dataviz/EmptyChartState'
import { formatCurrency, formatCurrencyCompact, formatDateShort, formatMonthLong } from '../components/dataviz/format'
import { WIDGET_BY_ID, type WidgetId } from '../components/dashboard/widgetDefinitions'
import { useDashboardLayout } from '../components/dashboard/useDashboardLayout'
import CustomizeDashboardDialog from '../components/dashboard/CustomizeDashboardDialog'

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/**
 * "yyyy-MM" completo y con mes 01-12. El input nativo `type="month"` no
 * garantiza esto en cada onChange: mientras se edita (p. ej. al borrar el
 * mes para escribir uno nuevo) puede reportar "" o un valor intermedio —
 * varía por navegador. Sin este filtro, ese valor a medio escribir se
 * manda tal cual a la API (`?month=...`), que responde 400 ante cualquier
 * mes fuera de 01-12 o mal formado, y la página lo muestra como un error
 * genérico en vez de simplemente esperar a que termines de escribir.
 */
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

function isCompleteMonth(value: string): boolean {
  return MONTH_PATTERN.test(value)
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const GRID_SIZE = {
  quarter: { xs: 6, sm: 4, md: 3 },
  half: { xs: 12, md: 6 },
} as const

export default function DashboardPage() {
  const { t } = useTranslation('dashboard')
  const { user } = useAuth()
  const navigate = useNavigate()
  // `monthInput` es lo que el campo muestra, siempre (para no pelear con la
  // edición nativa); `committedMonth` es lo que de verdad dispara la
  // consulta, y solo avanza cuando monthInput es un mes completo y válido.
  const [monthInput, setMonthInput] = useState(currentMonth())
  const [committedMonth, setCommittedMonth] = useState(currentMonth())
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const { layout, visibleWidgetIds, toggleVisible, move, resetToDefault } = useDashboardLayout()

  const handleMonthChange = (value: string) => {
    setMonthInput(value)
    if (isCompleteMonth(value)) {
      setCommittedMonth(value)
    }
  }

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['dashboard', committedMonth],
    queryFn: () => getDashboardSummary(committedMonth),
    placeholderData: keepPreviousData,
  })

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (isError || !data) {
    return <Alert severity="error">{t('common:errors.generic')}</Alert>
  }

  // Alias con tipo propio (no unión con undefined): la nota de TS sobre
  // `data` en el closure de renderWidget no sobrevive al chequeo de arriba.
  const dashboard = data

  function renderWidget(id: WidgetId) {
    switch (id) {
      case 'netWorth':
        return <StatTile label={t('netWorth')} value={formatCurrency(dashboard.netWorth)} />
      case 'availableBalance':
        return (
          <StatTile
            label={t('availableBalance')}
            value={formatCurrency(dashboard.availableBalance)}
            onClick={() => navigate('/accounts')}
          />
        )
      case 'creditCardDebt':
        return (
          <StatTile
            label={t('creditCardDebt')}
            value={formatCurrency(dashboard.creditCardDebt)}
            onClick={() => navigate('/credit-cards')}
          />
        )
      case 'availableCredit':
        return <StatTile label={t('availableCredit')} value={formatCurrency(dashboard.availableCredit)} />
      case 'incomeThisMonth':
        return <StatTile label={t('monthSummary.incomeThisMonth')} value={formatCurrency(dashboard.incomeThisMonth)} />
      case 'expenseThisMonth':
        return (
          <StatTile
            label={t('monthSummary.expenseThisMonth')}
            value={formatCurrency(dashboard.expenseThisMonth)}
            onClick={() => navigate('/transactions')}
          />
        )
      case 'monthlyBalance':
        return (
          <StatTile
            label={t('monthSummary.monthlyBalance')}
            value={formatCurrency(dashboard.monthlyBalance)}
            tone={dashboard.monthlyBalance >= 0 ? 'positive' : 'negative'}
          />
        )
      case 'expensesByCategory':
        return (
          <ChartCard
            title={t('monthSummary.expensesByCategory')}
            renderChart={() => (
              <RankedBarChart
                data={dashboard.expensesByCategory.map((c) => ({ id: c.categoryId, label: c.categoryName, value: c.amount }))}
                formatValue={formatCurrencyCompact}
                emptyMessage={t('monthSummary.noExpenses')}
              />
            )}
            renderTable={() => (
              <CategoryTable rows={dashboard.expensesByCategory} categoryLabel={t('table.category')} amountLabel={t('table.amount')} />
            )}
          />
        )
      case 'incomeByCategory':
        return (
          <ChartCard
            title={t('monthSummary.incomeByCategory')}
            renderChart={() => (
              <RankedBarChart
                data={dashboard.incomeByCategory.map((c) => ({ id: c.categoryId, label: c.categoryName, value: c.amount }))}
                formatValue={formatCurrencyCompact}
                emptyMessage={t('monthSummary.noIncome')}
              />
            )}
            renderTable={() => (
              <CategoryTable rows={dashboard.incomeByCategory} categoryLabel={t('table.category')} amountLabel={t('table.amount')} />
            )}
          />
        )
      case 'netWorthEvolution':
        return (
          <ChartCard
            title={t('trends.netWorthEvolution')}
            subtitle={t('trends.netWorthEvolutionSubtitle')}
            renderChart={() => (
              <TrendLineChart data={dashboard.netWorthEvolution} formatValue={formatCurrencyCompact} ariaLabel={t('trends.netWorthEvolution')} />
            )}
            renderTable={() => <MonthlyTable rows={dashboard.netWorthEvolution} monthLabel={t('table.month')} amountLabel={t('table.amount')} />}
          />
        )
      case 'expenseEvolution':
        return (
          <ChartCard
            title={t('trends.expenseEvolution')}
            subtitle={t('trends.expenseEvolutionSubtitle')}
            renderChart={() => <MonthlyBarChart data={dashboard.expenseEvolution} formatValue={formatCurrencyCompact} />}
            renderTable={() => <MonthlyTable rows={dashboard.expenseEvolution} monthLabel={t('table.month')} amountLabel={t('table.amount')} />}
          />
        )
      case 'upcomingPayments':
        return (
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
              {t('creditCards.upcomingPayments')}
            </Typography>
            {dashboard.upcomingPayments.length === 0 ? (
              <EmptyChartState message={t('creditCards.noUpcomingPayments')} />
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {dashboard.upcomingPayments.map((payment) => (
                  <Box
                    key={payment.creditCardId}
                    onClick={() => navigate(`/credit-cards/${payment.creditCardId}`)}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      borderRadius: 1,
                      mx: -1,
                      px: 1,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Box>
                      <Typography variant="body2">{payment.creditCardName}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {t('table.dueDate')}: {formatDateShort(payment.dueDate)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                      {formatCurrency(payment.expectedPayment)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid size={6}>
                <StatTile label={t('creditCards.activeMsiPlans')} value={String(dashboard.activeMsiPlansCount)} />
              </Grid>
              <Grid size={6}>
                <StatTile
                  label={t('creditCards.monthlyInstallmentCommitment')}
                  value={formatCurrency(dashboard.monthlyInstallmentCommitment)}
                />
              </Grid>
            </Grid>
          </Paper>
        )
      case 'recentTransactions':
        return (
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
              {t('recentTransactions.heading')}
            </Typography>
            {dashboard.recentTransactions.length === 0 ? (
              <EmptyChartState message={t('recentTransactions.empty')} />
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('recentTransactions.columns.date')}</TableCell>
                      <TableCell>{t('recentTransactions.columns.type')}</TableCell>
                      <TableCell align="right">{t('recentTransactions.columns.amount')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboard.recentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{formatDateShort(transaction.date)}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            variant="outlined"
                            label={t(`transactionTypes.${transaction.type}`, { defaultValue: transaction.type })}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        )
      default:
        return null
    }
  }

  return (
    <Box sx={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity 0.15s ease' }}>
      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <div>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('title')}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
            {t('greeting', { name: user?.displayName })}
          </Typography>
        </div>
        <Button variant="outlined" startIcon={<TuneIcon />} onClick={() => setCustomizeOpen(true)}>
          {t('customize.button')}
        </Button>
      </Stack>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          type="month"
          size="small"
          label={t('monthSummary.monthLabel')}
          value={monthInput}
          onChange={(event) => handleMonthChange(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Box>

      {visibleWidgetIds.length === 0 ? (
        <EmptyChartState message={t('customize.empty')} />
      ) : (
        <Grid container spacing={2}>
          {visibleWidgetIds.map((id) => (
            <Grid key={id} size={GRID_SIZE[WIDGET_BY_ID[id].size]}>
              {renderWidget(id)}
            </Grid>
          ))}
        </Grid>
      )}

      <CustomizeDashboardDialog
        open={customizeOpen}
        layout={layout}
        onToggle={toggleVisible}
        onMove={move}
        onReset={resetToDefault}
        onClose={() => setCustomizeOpen(false)}
      />
    </Box>
  )
}

function CategoryTable({
  rows,
  categoryLabel,
  amountLabel,
}: {
  rows: { categoryId: string; categoryName: string; amount: number }[]
  categoryLabel: string
  amountLabel: string
}) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{categoryLabel}</TableCell>
            <TableCell align="right">{amountLabel}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.categoryId}>
              <TableCell>{row.categoryName}</TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(row.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function MonthlyTable({
  rows,
  monthLabel,
  amountLabel,
}: {
  rows: { month: string; amount: number }[]
  monthLabel: string
  amountLabel: string
}) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{monthLabel}</TableCell>
            <TableCell align="right">{amountLabel}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.month}>
              <TableCell>{capitalize(formatMonthLong(row.month))}</TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(row.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
