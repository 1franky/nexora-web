import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Link from '@mui/material/Link'
import MenuItem from '@mui/material/MenuItem'
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
import AddIcon from '@mui/icons-material/Add'
import { listAccounts } from '../api/accountsApi'
import { listCategories } from '../api/categoriesApi'
import { listTransactions, type Transaction } from '../api/transactionsApi'
import { formatCurrencyIn, formatDateShort } from '../components/dataviz/format'
import EmptyChartState from '../components/dataviz/EmptyChartState'
import TransactionFormDialog from '../components/transactions/TransactionFormDialog'

export default function TransactionsPage() {
  const { t } = useTranslation('transactions')
  const [searchParams, setSearchParams] = useSearchParams()
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: accounts, isLoading: accountsLoading, isError: accountsError } = useQuery({
    queryKey: ['accounts'],
    queryFn: listAccounts,
  })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: listCategories })

  const accountIdFromUrl = searchParams.get('accountId')
  const accountId = accountIdFromUrl && accounts?.some((a) => a.id === accountIdFromUrl) ? accountIdFromUrl : accounts?.[0]?.id

  // Si la URL no trae una cuenta válida, fija la primera en cuanto carguen las cuentas.
  useEffect(() => {
    if (accounts && accounts.length > 0 && accountId && accountIdFromUrl !== accountId) {
      setSearchParams({ accountId }, { replace: true })
    }
  }, [accounts, accountId, accountIdFromUrl, setSearchParams])

  const selectedAccount = accounts?.find((a) => a.id === accountId)

  const { data: transactions, isLoading: transactionsLoading, isError: transactionsError } = useQuery({
    queryKey: ['transactions', accountId],
    queryFn: () => listTransactions(accountId!),
    enabled: Boolean(accountId),
  })

  const categoryNameById = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c.name])), [categories])
  const accountNameById = useMemo(() => new Map((accounts ?? []).map((a) => [a.id, a.name])), [accounts])
  const otherActiveAccounts = useMemo(
    () => (accounts ?? []).filter((a) => a.id !== accountId && a.status === 'ACTIVE'),
    [accounts, accountId],
  )

  if (accountsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (accountsError) {
    return <Alert severity="error">{t('common:errors.generic')}</Alert>
  }

  if (!accounts || accounts.length === 0) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('heading')}
        </Typography>
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('needsAccount')}{' '}
            <Link component={RouterLink} to="/accounts">
              {t('createAccountLink')}
            </Link>
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box>
      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" component="h1">
          {t('heading')}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)} disabled={!accountId}>
          {t('newTransaction')}
        </Button>
      </Stack>

      <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          select
          size="small"
          label={t('accountSelectorLabel')}
          value={accountId ?? ''}
          onChange={(event) => setSearchParams({ accountId: event.target.value })}
          sx={{ minWidth: 260 }}
        >
          {accounts.map((account) => (
            <MenuItem key={account.id} value={account.id}>
              {account.name} ({account.currency})
            </MenuItem>
          ))}
        </TextField>
        {selectedAccount && (
          <Typography variant="h6" sx={{ fontVariantNumeric: 'proportional-nums' }}>
            {formatCurrencyIn(selectedAccount.balance, selectedAccount.currency)}
          </Typography>
        )}
      </Stack>

      {transactionsLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {transactionsError && <Alert severity="error">{t('loadError')}</Alert>}

      {transactions && transactions.length === 0 && <EmptyChartState message={t('empty')} />}

      {transactions && transactions.length > 0 && (
        <Paper variant="outlined">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('columns.date')}</TableCell>
                  <TableCell>{t('columns.type')}</TableCell>
                  <TableCell>{t('columns.category')}</TableCell>
                  <TableCell>{t('columns.description')}</TableCell>
                  <TableCell align="right">{t('columns.amount')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction: Transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDateShort(transaction.date)}</TableCell>
                    <TableCell>
                      <Chip size="small" variant="outlined" label={t(`types.${transaction.type}`)} />
                    </TableCell>
                    <TableCell>
                      {transaction.categoryId
                        ? categoryNameById.get(transaction.categoryId) ?? t('noCategory')
                        : transaction.counterAccountId
                          ? accountNameById.get(transaction.counterAccountId) ?? '—'
                          : transaction.merchant ?? t('noCategory')}
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
                      {formatCurrencyIn(transaction.balanceEffect, selectedAccount?.currency ?? 'MXN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {accountId && (
        <TransactionFormDialog
          open={dialogOpen}
          accountId={accountId}
          otherActiveAccounts={otherActiveAccounts}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </Box>
  )
}
