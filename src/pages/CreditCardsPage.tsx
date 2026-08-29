import { useState } from 'react'
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
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import { listCreditCards } from '../api/creditCardsApi'
import { formatCurrencyIn } from '../components/dataviz/format'
import EmptyChartState from '../components/dataviz/EmptyChartState'
import CreateCreditCardDialog from '../components/creditCards/CreateCreditCardDialog'

export default function CreditCardsPage() {
  const { t } = useTranslation('creditCards')
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: cards, isLoading, isError } = useQuery({ queryKey: ['creditCards'], queryFn: listCreditCards })

  return (
    <Box>
      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {t('title')}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          {t('newCard')}
        </Button>
      </Stack>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && <Alert severity="error">{t('loadError')}</Alert>}

      {cards && cards.length === 0 && <EmptyChartState message={t('empty')} />}

      {cards && cards.length > 0 && (
        <Grid container spacing={2}>
          {cards.map((card) => {
            const usage = card.creditLimit > 0 ? Math.min(100, (card.currentDebt / card.creditLimit) * 100) : 0
            return (
              <Grid key={card.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card variant="outlined" sx={{ height: '100%', opacity: card.status === 'ARCHIVED' ? 0.6 : 1 }}>
                  <CardActionArea onClick={() => navigate(`/credit-cards/${card.id}`)} sx={{ height: '100%' }}>
                    <CardContent>
                      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {card.name}
                        </Typography>
                        {card.status === 'ARCHIVED' && <Chip size="small" label={t('archived')} />}
                      </Stack>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                        {card.bank} · •••• {card.last4}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 600, fontVariantNumeric: 'proportional-nums' }}>
                        {formatCurrencyIn(card.currentDebt, card.currency)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {t('debt')} · {t('limit')} {formatCurrencyIn(card.creditLimit, card.currency)}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={usage}
                        sx={{ mt: 1, mb: 1.5, height: 6, borderRadius: 3 }}
                        color={usage >= 90 ? 'error' : 'primary'}
                      />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {t('available')}: {formatCurrencyIn(card.availableCredit, card.currency)}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}

      <CreateCreditCardDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </Box>
  )
}
