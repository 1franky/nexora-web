import { useMemo, useState } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
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
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { listAccounts } from '../api/accountsApi'
import { listCategories } from '../api/categoriesApi'
import { deleteTransaction, listTransactions, type Transaction } from '../api/transactionsApi'
import { getApiErrorMessage } from '../api/apiError'
import { formatCurrencyIn, formatDateShort } from '../components/dataviz/format'
import EmptyChartState from '../components/dataviz/EmptyChartState'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EditTransactionDialog from '../components/transactions/EditTransactionDialog'
import TransactionFormDialog from '../components/transactions/TransactionFormDialog'

/** Editar solo aplica a lo que este mismo diálogo "Nuevo movimiento" crea; transferencias se editan borrando/recreando. */
const EDITABLE_TYPES = new Set(['INCOME', 'EXPENSE'])
/** Compra/pago de tarjeta se gestionan desde el detalle de la tarjeta, no desde aquí. */
const DELETABLE_TYPES = new Set(['INCOME', 'EXPENSE', 'TRANSFER'])

export default function TransactionsPage() {
  const { t } = useTranslation('transactions')
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setDeletingTransaction(null)
    },
    onError: (err) => setDeleteError(getApiErrorMessage(err, t('common:errors.generic'))),
  })

  const { data: accounts, isLoading: accountsLoading, isError: accountsError } = useQuery({
    queryKey: ['accounts'],
    queryFn: listAccounts,
  })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: listCategories })

  // "" = todas las cuentas (default); si la URL trae un accountId que ya no existe, se ignora.
  const accountIdFromUrl = searchParams.get('accountId')
  const accountId = accountIdFromUrl && accounts?.some((a) => a.id === accountIdFromUrl) ? accountIdFromUrl : ''
  const selectedAccount = accounts?.find((a) => a.id === accountId)

  const { data: transactions, isLoading: transactionsLoading, isError: transactionsError } = useQuery({
    queryKey: ['transactions', accountId || undefined],
    queryFn: () => listTransactions(accountId || undefined),
    enabled: Boolean(accounts),
  })

  const categoryNameById = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c.name])), [categories])
  const accountNameById = useMemo(() => new Map((accounts ?? []).map((a) => [a.id, a.name])), [accounts])
  const accountCurrencyById = useMemo(() => new Map((accounts ?? []).map((a) => [a.id, a.currency])), [accounts])
  const activeAccounts = useMemo(() => (accounts ?? []).filter((a) => a.status === 'ACTIVE'), [accounts])

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
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)} disabled={activeAccounts.length === 0}>
          {t('newTransaction')}
        </Button>
      </Stack>

      <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          select
          size="small"
          label={t('accountSelectorLabel')}
          value={accountId}
          onChange={(event) => setSearchParams(event.target.value ? { accountId: event.target.value } : {})}
          sx={{ minWidth: 260 }}
        >
          <MenuItem value="">{t('allAccounts')}</MenuItem>
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
                  {!accountId && <TableCell>{t('columns.account')}</TableCell>}
                  <TableCell>{t('columns.type')}</TableCell>
                  <TableCell>{t('columns.category')}</TableCell>
                  <TableCell>{t('columns.description')}</TableCell>
                  <TableCell align="right">{t('columns.amount')}</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction: Transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDateShort(transaction.date)}</TableCell>
                    {!accountId && <TableCell>{accountNameById.get(transaction.accountId) ?? '—'}</TableCell>}
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
                      {formatCurrencyIn(transaction.balanceEffect, accountCurrencyById.get(transaction.accountId) ?? 'MXN')}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {EDITABLE_TYPES.has(transaction.type) && (
                        <IconButton size="small" aria-label={t('common:actions.edit')} onClick={() => setEditingTransaction(transaction)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                      {DELETABLE_TYPES.has(transaction.type) && (
                        <IconButton
                          size="small"
                          aria-label={t('common:actions.delete')}
                          onClick={() => {
                            setDeleteError(null)
                            setDeletingTransaction(transaction)
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <TransactionFormDialog
        open={dialogOpen}
        accounts={activeAccounts}
        defaultAccountId={accountId || undefined}
        onClose={() => setDialogOpen(false)}
      />

      <EditTransactionDialog transaction={editingTransaction} onClose={() => setEditingTransaction(null)} />

      <ConfirmDialog
        open={deletingTransaction !== null}
        title={t('deleteDialog.title')}
        description={t('deleteDialog.description', {
          description: deletingTransaction?.description || deletingTransaction?.merchant || t(`types.${deletingTransaction?.type}`),
        })}
        error={deleteError}
        loading={deleteMutation.isPending}
        onCancel={() => setDeletingTransaction(null)}
        onConfirm={() => deletingTransaction && deleteMutation.mutate(deletingTransaction.id)}
      />
    </Box>
  )
}
