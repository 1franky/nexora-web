import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import CircularProgress from '@mui/material/CircularProgress'
import { listAccounts } from '../api/accountsApi'
import { listCategories } from '../api/categoriesApi'
import { getReport } from '../api/reportsApi'
import type { TransactionType } from '../api/transactionsApi'
import StatTile from '../components/dataviz/StatTile'
import ChartCard from '../components/dataviz/ChartCard'
import RankedBarChart from '../components/dataviz/RankedBarChart'
import MonthlyBarChart from '../components/dataviz/MonthlyBarChart'
import EmptyChartState from '../components/dataviz/EmptyChartState'
import { formatCurrency, formatCurrencyCompact, formatCurrencyIn, formatDateShort, formatMonthLong } from '../components/dataviz/format'

const TRANSACTION_TYPES: TransactionType[] = [
  'INCOME',
  'EXPENSE',
  'TRANSFER',
  'CREDIT_CARD_PURCHASE',
  'CREDIT_CARD_PAYMENT',
  'REFUND',
  'ADJUSTMENT',
]

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function todayIso(): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function firstDayOfMonthIso(): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export default function ReportsPage() {
  const { t } = useTranslation('reports')
  const [from, setFrom] = useState(firstDayOfMonthIso())
  const [to, setTo] = useState(todayIso())
  const [accountId, setAccountId] = useState('')
  const [type, setType] = useState<TransactionType | ''>('')

  const { data: accounts } = useQuery({ queryKey: ['accounts'], queryFn: listAccounts })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: listCategories })

  const rangeIsValid = from !== '' && to !== '' && from <= to

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['reports', from, to, accountId, type],
    queryFn: () => getReport({ from, to, accountId: accountId || undefined, type: type || undefined }),
    enabled: rangeIsValid,
    placeholderData: keepPreviousData,
  })

  const categoryNameById = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c.name])), [categories])
  const accountNameById = useMemo(() => new Map((accounts ?? []).map((a) => [a.id, a.name])), [accounts])
  const accountCurrencyById = useMemo(() => new Map((accounts ?? []).map((a) => [a.id, a.currency])), [accounts])

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('title')}
      </Typography>

      <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          type="date"
          size="small"
          label={t('filters.from')}
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          type="date"
          size="small"
          label={t('filters.to')}
          value={to}
          onChange={(event) => setTo(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          select
          size="small"
          label={t('filters.account')}
          value={accountId}
          onChange={(event) => setAccountId(event.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">{t('filters.allAccounts')}</MenuItem>
          {(accounts ?? []).map((account) => (
            <MenuItem key={account.id} value={account.id}>
              {account.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label={t('filters.type')}
          value={type}
          onChange={(event) => setType(event.target.value as TransactionType | '')}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">{t('filters.allTypes')}</MenuItem>
          {TRANSACTION_TYPES.map((value) => (
            <MenuItem key={value} value={value}>
              {t(`types.${value}`)}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {!rangeIsValid && <Alert severity="warning" sx={{ mb: 3 }}>{t('invalidRange')}</Alert>}

      {rangeIsValid && isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {rangeIsValid && isError && <Alert severity="error">{t('common:errors.generic')}</Alert>}

      {rangeIsValid && data && (
        <Box sx={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity 0.15s ease' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatTile label={t('summary.totalIncome')} value={formatCurrency(data.totalIncome)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatTile label={t('summary.totalExpense')} value={formatCurrency(data.totalExpense)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatTile
                label={t('summary.balance')}
                value={formatCurrency(data.balance)}
                tone={data.balance >= 0 ? 'positive' : 'negative'}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <ChartCard
                title={t('categories.expensesByCategory')}
                renderChart={() => (
                  <RankedBarChart
                    data={data.expensesByCategory.map((c) => ({ id: c.categoryId, label: c.categoryName, value: c.amount }))}
                    formatValue={formatCurrencyCompact}
                    emptyMessage={t('categories.noExpenses')}
                  />
                )}
                renderTable={() => (
                  <CategoryTable rows={data.expensesByCategory} categoryLabel={t('table.category')} amountLabel={t('table.amount')} />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ChartCard
                title={t('categories.incomeByCategory')}
                renderChart={() => (
                  <RankedBarChart
                    data={data.incomeByCategory.map((c) => ({ id: c.categoryId, label: c.categoryName, value: c.amount }))}
                    formatValue={formatCurrencyCompact}
                    emptyMessage={t('categories.noIncome')}
                  />
                )}
                renderTable={() => (
                  <CategoryTable rows={data.incomeByCategory} categoryLabel={t('table.category')} amountLabel={t('table.amount')} />
                )}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mt: 3 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <ChartCard
                title={t('trends.monthlyIncome')}
                renderChart={() => <MonthlyBarChart data={data.monthlyIncome} formatValue={formatCurrencyCompact} />}
                renderTable={() => <MonthlyTable rows={data.monthlyIncome} monthLabel={t('table.month')} amountLabel={t('table.amount')} />}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ChartCard
                title={t('trends.monthlyExpense')}
                renderChart={() => <MonthlyBarChart data={data.monthlyExpense} formatValue={formatCurrencyCompact} />}
                renderTable={() => <MonthlyTable rows={data.monthlyExpense} monthLabel={t('table.month')} amountLabel={t('table.amount')} />}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
              {t('transactions.heading')}
            </Typography>
            {data.transactions.length === 0 ? (
              <EmptyChartState message={t('transactions.empty')} />
            ) : (
              <Paper variant="outlined">
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('transactions.columns.date')}</TableCell>
                        <TableCell>{t('transactions.columns.account')}</TableCell>
                        <TableCell>{t('transactions.columns.type')}</TableCell>
                        <TableCell>{t('transactions.columns.category')}</TableCell>
                        <TableCell>{t('transactions.columns.description')}</TableCell>
                        <TableCell align="right">{t('transactions.columns.amount')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{formatDateShort(transaction.date)}</TableCell>
                          <TableCell>{accountNameById.get(transaction.accountId) ?? '—'}</TableCell>
                          <TableCell>
                            <Chip size="small" variant="outlined" label={t(`types.${transaction.type}`)} />
                          </TableCell>
                          <TableCell>
                            {transaction.categoryId
                              ? categoryNameById.get(transaction.categoryId) ?? t('transactions.noCategory')
                              : transaction.counterAccountId
                                ? accountNameById.get(transaction.counterAccountId) ?? '—'
                                : transaction.merchant ?? t('transactions.noCategory')}
                          </TableCell>
                          <TableCell>{transaction.description ?? '—'}</TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontVariantNumeric: 'tabular-nums',
                              fontWeight: 600,
                              color: transaction.balanceEffect >= 0 ? 'success.main' : 'error.main',
                            }}
                          >
                            {transaction.balanceEffect >= 0 ? '+' : ''}
                            {formatCurrencyIn(transaction.balanceEffect, accountCurrencyById.get(transaction.accountId) ?? 'MXN')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </Box>
        </Box>
      )}
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
