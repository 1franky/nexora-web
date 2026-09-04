import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { getSatCertificate } from '../../api/satApi'
import SatCertificateConnectForm from './SatCertificateConnectForm'
import SatCertificateStatusCard from './SatCertificateStatusCard'

/** Sección "Conexión SAT" embebida en Configuración (W10) — ver plan-integracion-sat.md sección 8. */
export default function SatConnectionSection() {
  const { t } = useTranslation('sat')

  const { data: certificate, isLoading, isError } = useQuery({
    queryKey: ['sat', 'certificate'],
    queryFn: getSatCertificate,
  })

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  if (isError) {
    return <Alert severity="error">{t('connection.loadError')}</Alert>
  }

  return certificate ? <SatCertificateStatusCard certificate={certificate} /> : <SatCertificateConnectForm />
}
