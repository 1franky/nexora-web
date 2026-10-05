import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import EmptyChartState from '../components/dataviz/EmptyChartState'
import ScheduledChargeFormDialog from '../components/scheduledCharges/ScheduledChargeFormDialog'
import ScheduledChargesList from '../components/scheduledCharges/ScheduledChargesList'
import { useScheduledCharges } from '../components/scheduledCharges/useScheduledCharges'

/** Cargos programados de todas las cuentas (W13, plan-cargos-programados.md sección 6). */
export default function ScheduledChargesPage() {
  const { t } = useTranslation('scheduledCharges')
  const [createOpen, setCreateOpen] = useState(false)
  const { data: charges, isLoading, isError } = useScheduledCharges()

  return (
    <Box>
      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1">
            {t('title')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('subtitle')}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          {t('newCharge')}
        </Button>
      </Stack>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && <Alert severity="error">{t('loadError')}</Alert>}

      {charges && charges.length === 0 && <EmptyChartState message={t('empty')} />}

      {charges && charges.length > 0 && <ScheduledChargesList charges={charges} />}

      <ScheduledChargeFormDialog open={createOpen} charge={null} onClose={() => setCreateOpen(false)} />
    </Box>
  )
}
