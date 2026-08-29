import { useTranslation } from 'react-i18next'
import { styled } from '@mui/material/styles'
import Switch, { type SwitchProps } from '@mui/material/Switch'
import Tooltip from '@mui/material/Tooltip'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { useThemeMode } from '../theme/ThemeModeContext'

/**
 * Switch con solecito/lunita en el propio thumb (prop `icon`/`checkedIcon`
 * de MuiSwitch — no un botón que abre un menú aparte): con solo dos temas,
 * un clic que alterna directamente es más rápido que elegir de una lista.
 */
const SunMoonSwitch = styled((props: SwitchProps) => <Switch disableRipple {...props} />)(({ theme }) => ({
  width: 52,
  height: 30,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 3,
    transitionDuration: '200ms',
    '&.Mui-checked': {
      transform: 'translateX(22px)',
      '& + .MuiSwitch-track': {
        opacity: 1,
      },
    },
  },
  '& .MuiSwitch-thumb': {
    width: 24,
    height: 24,
    boxShadow: 'none',
  },
  '& .MuiSwitch-track': {
    borderRadius: 15,
    opacity: 1,
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.24)' : 'rgba(0,0,0,0.24)',
  },
}))

export default function ThemeModeSwitch() {
  const { t } = useTranslation('common')
  const { mode, setMode } = useThemeMode()
  const isDark = mode === 'dark'

  return (
    <Tooltip title={t(isDark ? 'theme.switchToLight' : 'theme.switchToDark')}>
      <SunMoonSwitch
        checked={isDark}
        onChange={() => setMode(isDark ? 'light' : 'dark')}
        icon={<LightModeIcon sx={{ fontSize: 16, color: '#f5b301', p: '4px' }} />}
        checkedIcon={<DarkModeIcon sx={{ fontSize: 16, color: '#1e293b', p: '4px' }} />}
        slotProps={{ input: { 'aria-label': t(isDark ? 'theme.switchToLight' : 'theme.switchToDark') } }}
      />
    </Tooltip>
  )
}
