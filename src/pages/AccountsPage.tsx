import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import { listAccounts } from '../api/accountsApi'
import { formatCurrencyIn } from '../components/dataviz/format'
import EmptyChartState from '../components/dataviz/EmptyChartState'
import CreateAccountDialog from '../components/accounts/CreateAccountDialog'

export default function AccountsPage() {
  const { t } = useTranslation('accounts')
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { data: accounts, isLoading, isError } = useQuery({ queryKey: ['accounts'], queryFn: listAccounts })

  const filteredAccounts = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return accounts
    return accounts?.filter((account) => account.name.toLowerCase().includes(query))
  }, [accounts, search])

  return (
    <Box>
      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {t('title')}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          {t('newAccount')}
        </Button>
      </Stack>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && <Alert severity="error">{t('loadError')}</Alert>}

      {accounts && accounts.length === 0 && <EmptyChartState message={t('empty')} />}

      {accounts && accounts.length > 0 && (
        <TextField
          size="small"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('searchLabel')}
          aria-label={t('searchLabel')}
          sx={{ mb: 2, maxWidth: 320 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      )}

      {accounts && accounts.length > 0 && filteredAccounts && filteredAccounts.length === 0 && (
        <EmptyChartState message={t('searchEmpty')} />
      )}

      {filteredAccounts && filteredAccounts.length > 0 && (
        <Grid container spacing={2}>
          {filteredAccounts.map((account) => (
            <Grid key={account.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                variant="outlined"
                sx={{ height: '100%', opacity: account.status === 'ARCHIVED' ? 0.6 : 1 }}
              >
                <CardActionArea onClick={() => navigate(`/transactions?accountId=${account.id}`)} sx={{ height: '100%' }}>
                  <CardContent>
                    <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {account.name}
                      </Typography>
                      {account.status === 'ARCHIVED' && (
                        <Chip size="small" label={t('archived')} />
                      )}
                    </Stack>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                      {t(`types.${account.type}`)} · {account.currency}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600, fontVariantNumeric: 'proportional-nums', mb: 1.5 }}>
                      {formatCurrencyIn(account.balance, account.currency)}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                      {account.includeInAvailableBalance && (
                        <Chip size="small" variant="outlined" label={t('includedIn.availableBalance')} />
                      )}
                      {account.includeInNetWorth && (
                        <Chip size="small" variant="outlined" label={t('includedIn.netWorth')} />
                      )}
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <CreateAccountDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </Box>
  )
}
