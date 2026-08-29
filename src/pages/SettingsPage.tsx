import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { useAuth } from '../auth/AuthContext'
import { useThemeMode, type ThemeMode } from '../theme/ThemeModeContext'

const THEME_OPTIONS: ThemeMode[] = ['light', 'dark', 'system']

export default function SettingsPage() {
  const { t } = useTranslation('settings')
  const { user } = useAuth()
  const { mode, setMode } = useThemeMode()

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('title')}
      </Typography>

      <Stack spacing={3} sx={{ maxWidth: 560, mt: 3 }}>
        <SectionCard title={t('account.heading')}>
          <Stack spacing={1.5}>
            <Field label={t('account.name')} value={user?.displayName ?? '—'} />
            <Field label={t('account.email')} value={user?.email ?? '—'} />
          </Stack>
        </SectionCard>

        <SectionCard title={t('appearance.heading')} subtitle={t('appearance.subtitle')}>
          <ToggleButtonGroup
            exclusive
            value={mode}
            onChange={(_event, value: ThemeMode | null) => value && setMode(value)}
            aria-label={t('appearance.heading')}
          >
            {THEME_OPTIONS.map((option) => (
              <ToggleButton key={option} value={option}>
                {t(`common:theme.${option}`)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </SectionCard>

        <SectionCard title={t('language.heading')} subtitle={t('language.subtitle')}>
          <TextField select value="es" disabled fullWidth size="small" sx={{ maxWidth: 240 }}>
            <MenuItem value="es">Español</MenuItem>
          </TextField>
        </SectionCard>
      </Stack>
    </Box>
  )
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {subtitle}
          </Typography>
        )}
        <Box sx={{ mt: subtitle ? 0 : 2 }}>{children}</Box>
      </CardContent>
    </Card>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Box>
  )
}
