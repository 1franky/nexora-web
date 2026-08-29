import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useAuth } from '../auth/AuthContext'
import { getDashboardSummary } from '../api/dashboardApi'

function Metric({ label, value }: { label: string; value: number }) {
  const formatted = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value)
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {formatted}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  )
}

/**
 * Página de bienvenida tras el login: prueba que todo el stack funciona de
 * punta a punta (bearer token, TanStack Query, datos reales de la API).
 * El dashboard completo (gráficas, categorías, próximos pagos, widgets
 * configurables) es W2.
 */
export default function HomePage() {
  const { t } = useTranslation('dashboard')
  const { user } = useAuth()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
  })

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('title')}
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        ¡Hola, {user?.displayName}!
      </Typography>

      {isLoading && <CircularProgress sx={{ mt: 2 }} />}
      {isError && <Alert severity="error">{t('comingSoon')}</Alert>}

      {data && (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Metric label={t('availableBalance')} value={data.availableBalance} />
          <Metric label={t('netWorth')} value={data.netWorth} />
          <Metric label={t('creditCardDebt')} value={data.creditCardDebt} />
          <Metric label={t('availableCredit')} value={data.availableCredit} />
        </Grid>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
        {t('comingSoon')}
      </Typography>
    </Box>
  )
}
