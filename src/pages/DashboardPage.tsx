import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useAuth } from '../auth/AuthContext'
import { getDashboardSummary } from '../api/dashboardApi'
import StatTile from '../components/dataviz/StatTile'
import ChartCard from '../components/dataviz/ChartCard'
import RankedBarChart from '../components/dataviz/RankedBarChart'
import MonthlyBarChart from '../components/dataviz/MonthlyBarChart'
import TrendLineChart from '../components/dataviz/TrendLineChart'
import EmptyChartState from '../components/dataviz/EmptyChartState'
import { formatCurrency, formatCurrencyCompact, formatDateShort, formatMonthLong } from '../components/dataviz/format'

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export default function DashboardPage() {
  const { t } = useTranslation('dashboard')
  const { user } = useAuth()
  const [month, setMonth] = useState(currentMonth())

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['dashboard', month],
    queryFn: () => getDashboardSummary(month),
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

  return (
    <Box sx={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity 0.15s ease' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('title')}
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
        {t('greeting', { name: user?.displayName })}
      </Typography>

      {/* Estado actual: no depende del mes seleccionado. */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile label={t('netWorth')} value={formatCurrency(data.netWorth)} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile label={t('availableBalance')} value={formatCurrency(data.availableBalance)} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile label={t('creditCardDebt')} value={formatCurrency(data.creditCardDebt)} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile label={t('availableCredit')} value={formatCurrency(data.availableCredit)} />
        </Grid>
      </Grid>

      {/* Resumen del mes: el selector solo re-consulta estas métricas y las dos gráficas de categoría. */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Typography variant="h6" component="h2">
            {t('monthSummary.heading')}
          </Typography>
          <TextField
            type="month"
            size="small"
            label={t('monthSummary.monthLabel')}
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <StatTile label={t('monthSummary.incomeThisMonth')} value={formatCurrency(data.incomeThisMonth)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <StatTile label={t('monthSummary.expenseThisMonth')} value={formatCurrency(data.expenseThisMonth)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <StatTile
              label={t('monthSummary.monthlyBalance')}
              value={formatCurrency(data.monthlyBalance)}
              tone={data.monthlyBalance >= 0 ? 'positive' : 'negative'}
            />
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <ChartCard
              title={t('monthSummary.expensesByCategory')}
              renderChart={() => (
                <RankedBarChart
                  data={data.expensesByCategory.map((c) => ({ id: c.categoryId, label: c.categoryName, value: c.amount }))}
                  formatValue={formatCurrencyCompact}
                  emptyMessage={t('monthSummary.noExpenses')}
                />
              )}
              renderTable={() => (
                <CategoryTable rows={data.expensesByCategory} categoryLabel={t('table.category')} amountLabel={t('table.amount')} />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <ChartCard
              title={t('monthSummary.incomeByCategory')}
              renderChart={() => (
                <RankedBarChart
                  data={data.incomeByCategory.map((c) => ({ id: c.categoryId, label: c.categoryName, value: c.amount }))}
                  formatValue={formatCurrencyCompact}
                  emptyMessage={t('monthSummary.noIncome')}
                />
              )}
              renderTable={() => (
                <CategoryTable rows={data.incomeByCategory} categoryLabel={t('table.category')} amountLabel={t('table.amount')} />
              )}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Evolución histórica: siempre los últimos 6 meses a hoy, no depende del selector. */}
      <Grid container spacing={2} sx={{ mt: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard
            title={t('trends.netWorthEvolution')}
            subtitle={t('trends.netWorthEvolutionSubtitle')}
            renderChart={() => (
              <TrendLineChart data={data.netWorthEvolution} formatValue={formatCurrencyCompact} ariaLabel={t('trends.netWorthEvolution')} />
            )}
            renderTable={() => <MonthlyTable rows={data.netWorthEvolution} monthLabel={t('table.month')} amountLabel={t('table.amount')} />}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard
            title={t('trends.expenseEvolution')}
            subtitle={t('trends.expenseEvolutionSubtitle')}
            renderChart={() => <MonthlyBarChart data={data.expenseEvolution} formatValue={formatCurrencyCompact} />}
            renderTable={() => <MonthlyTable rows={data.expenseEvolution} monthLabel={t('table.month')} amountLabel={t('table.amount')} />}
          />
        </Grid>
      </Grid>

      {/* Tarjetas y movimientos: tampoco dependen del selector de mes. */}
      <Grid container spacing={2} sx={{ mt: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
              {t('creditCards.upcomingPayments')}
            </Typography>
            {data.upcomingPayments.length === 0 ? (
              <EmptyChartState message={t('creditCards.noUpcomingPayments')} />
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {data.upcomingPayments.map((payment) => (
                  <Box key={payment.creditCardId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                <StatTile label={t('creditCards.activeMsiPlans')} value={String(data.activeMsiPlansCount)} />
              </Grid>
              <Grid size={6}>
                <StatTile
                  label={t('creditCards.monthlyInstallmentCommitment')}
                  value={formatCurrency(data.monthlyInstallmentCommitment)}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
              {t('recentTransactions.heading')}
            </Typography>
            {data.recentTransactions.length === 0 ? (
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
                    {data.recentTransactions.map((transaction) => (
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
        </Grid>
      </Grid>
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
