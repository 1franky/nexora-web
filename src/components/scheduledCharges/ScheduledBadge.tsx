import { useTranslation } from 'react-i18next'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import EventRepeatIcon from '@mui/icons-material/EventRepeat'

/** Distintivo «Programado» para movimientos con scheduledChargeId (generados por un cargo programado). */
export default function ScheduledBadge() {
  const { t } = useTranslation('scheduledCharges')
  return (
    <Tooltip title={t('badgeHint')}>
      <Chip size="small" color="info" variant="outlined" icon={<EventRepeatIcon />} label={t('badge')} />
    </Tooltip>
  )
}
