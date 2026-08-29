import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation('common')

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      <Typography variant="h4" component="h1" color="primary" gutterBottom sx={{ fontWeight: 700 }}>
        {t('app.name')}
      </Typography>
      <Paper elevation={2} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        {children}
      </Paper>
    </Box>
  )
}
