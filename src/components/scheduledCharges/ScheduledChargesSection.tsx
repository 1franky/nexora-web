import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import EmptyChartState from '../dataviz/EmptyChartState'
import ScheduledChargeFormDialog from './ScheduledChargeFormDialog'
import ScheduledChargesList from './ScheduledChargesList'
import { useScheduledCharges } from './useScheduledCharges'

interface ScheduledChargesSectionProps {
  accountId: string
  /** false para cuentas que no admiten cargos (archivadas): se listan los existentes, pero sin botón de alta. */
  canCreate?: boolean
}

/** «Cargos programados» de una sola cuenta/tarjeta, con alta ya apuntando a esa cuenta (W13). */
export default function ScheduledChargesSection({ accountId, canCreate = true }: ScheduledChargesSectionProps) {
  const { t } = useTranslation('scheduledCharges')
  const [createOpen, setCreateOpen] = useState(false)
  const { data: charges, isLoading, isError } = useScheduledCharges(accountId)

  return (
    <Box>
      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" component="h2">
          {t('accountSection.heading')}
        </Typography>
        {canCreate && (
          <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            {t('accountSection.new')}
          </Button>
        )}
      </Stack>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      )}
      {isError && <Alert severity="error">{t('loadError')}</Alert>}
      {charges && charges.length === 0 && <EmptyChartState message={t('emptyForAccount')} />}
      {charges && charges.length > 0 && <ScheduledChargesList charges={charges} showAccount={false} />}

      <ScheduledChargeFormDialog open={createOpen} charge={null} defaultAccountId={accountId} onClose={() => setCreateOpen(false)} />
    </Box>
  )
}
