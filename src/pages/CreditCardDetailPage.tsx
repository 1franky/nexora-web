import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'
import EventRepeatIcon from '@mui/icons-material/EventRepeat'
import PaymentsIcon from '@mui/icons-material/Payments'
import { getCreditCard } from '../api/creditCardsApi'
import { listCategories } from '../api/categoriesApi'
import { listTransactions, type Transaction } from '../api/transactionsApi'
import { listAccounts } from '../api/accountsApi'
import { formatCurrencyIn, formatDateShort } from '../components/dataviz/format'
import StatTile from '../components/dataviz/StatTile'
import EmptyChartState from '../components/dataviz/EmptyChartState'
import CreditCardPurchaseDialog from '../components/creditCards/CreditCardPurchaseDialog'
import CreditCardPaymentDialog from '../components/creditCards/CreditCardPaymentDialog'
import CreateInstallmentPlanDialog from '../components/creditCards/CreateInstallmentPlanDialog'
import InstallmentPlansSection from '../components/creditCards/InstallmentPlansSection'

export default function CreditCardDetailPage() {
  const { t } = useTranslation('creditCards')
  const { id } = useParams<{ id: string }>()
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [installmentPlanOpen, setInstallmentPlanOpen] = useState(false)

  const { data: card, isLoading, isError } = useQuery({
    queryKey: ['creditCard', id],
    queryFn: () => getCreditCard(id!),
    enabled: Boolean(id),
  })

  const { data: transactions, isLoading: transactionsLoading, isError: transactionsError } = useQuery({
    queryKey: ['transactions', card?.accountId],
    queryFn: () => listTransactions(card!.accountId),
    enabled: Boolean(card),
  })

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: listCategories, enabled: Boolean(card) })
  const { data: accounts } = useQuery({ queryKey: ['accounts'], queryFn: listAccounts, enabled: Boolean(card) })

  const categoryNameById = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c.name])), [categories])
  const accountNameById = useMemo(() => new Map((accounts ?? []).map((a) => [a.id, a.name])), [accounts])

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (isError || !card) {
    return <Alert severity="error">{t('detail.notFound')}</Alert>
  }

  const usage = card.creditLimit > 0 ? Math.min(100, (card.currentDebt / card.creditLimit) * 100) : 0

  return (
    <Box>
      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1">
            {card.name}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {card.bank} · •••• {card.last4}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<AddShoppingCartIcon />} onClick={() => setPurchaseOpen(true)}>
            {t('detail.recordPurchase')}
          </Button>
          <Button variant="outlined" startIcon={<EventRepeatIcon />} onClick={() => setInstallmentPlanOpen(true)}>
            {t('installments.newPlan')}
          </Button>
          <Button variant="contained" startIcon={<PaymentsIcon />} onClick={() => setPaymentOpen(true)}>
            {t('detail.payCard')}
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ maxWidth: 480, mt: 2, mb: 3 }}>
        <LinearProgress
          variant="determinate"
          value={usage}
          sx={{ height: 8, borderRadius: 4 }}
          color={usage >= 90 ? 'error' : 'primary'}
        />
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile label={t('debt')} value={formatCurrencyIn(card.currentDebt, card.currency)} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile label={t('available')} value={formatCurrencyIn(card.availableCredit, card.currency)} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile label={t('limit')} value={formatCurrencyIn(card.creditLimit, card.currency)} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile label={t('nextPaymentDueDate')} value={formatDateShort(card.nextPaymentDueDate)} />
        </Grid>
      </Grid>

      <Typography variant="h6" component="h2" gutterBottom>
        {t('installments.heading')}
      </Typography>
      <Box sx={{ mb: 4 }}>
        <InstallmentPlansSection cardId={card.id} currency={card.currency} />
      </Box>

      <Typography variant="h6" component="h2" gutterBottom>
        {t('detail.movements')}
      </Typography>

      {transactionsLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {transactionsError && <Alert severity="error">{t('detail.loadError')}</Alert>}

      {transactions && transactions.length === 0 && <EmptyChartState message={t('detail.empty')} />}

      {transactions && transactions.length > 0 && (
        <Paper variant="outlined">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('columns.date')}</TableCell>
                  <TableCell>{t('columns.type')}</TableCell>
                  <TableCell>{t('columns.merchantOrSource')}</TableCell>
                  <TableCell>{t('columns.category')}</TableCell>
                  <TableCell align="right">{t('columns.amount')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction: Transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDateShort(transaction.date)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={t(`types.${transaction.type}`, { defaultValue: transaction.type })}
                      />
                    </TableCell>
                    <TableCell>
                      {transaction.merchant ??
                        (transaction.counterAccountId ? accountNameById.get(transaction.counterAccountId) ?? '—' : '—')}
                    </TableCell>
                    <TableCell>
                      {transaction.categoryId ? categoryNameById.get(transaction.categoryId) ?? t('noCategory') : '—'}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 600,
                        color: transaction.balanceEffect >= 0 ? 'success.main' : 'error.main',
                      }}
                    >
                      {transaction.balanceEffect >= 0 ? '+' : ''}
                      {formatCurrencyIn(transaction.balanceEffect, card.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <CreditCardPurchaseDialog
        open={purchaseOpen}
        cardId={card.id}
        cardAccountId={card.accountId}
        onClose={() => setPurchaseOpen(false)}
      />
      <CreditCardPaymentDialog
        open={paymentOpen}
        cardId={card.id}
        cardAccountId={card.accountId}
        onClose={() => setPaymentOpen(false)}
      />
      <CreateInstallmentPlanDialog
        open={installmentPlanOpen}
        cardId={card.id}
        cardAccountId={card.accountId}
        onClose={() => setInstallmentPlanOpen(false)}
      />
    </Box>
  )
}
