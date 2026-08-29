import { useState, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness'
import CheckIcon from '@mui/icons-material/Check'
import { useThemeMode, type ThemeMode } from '../theme/ThemeModeContext'

const OPTIONS: { value: ThemeMode; icon: React.ReactNode }[] = [
  { value: 'light', icon: <LightModeIcon fontSize="small" /> },
  { value: 'dark', icon: <DarkModeIcon fontSize="small" /> },
  { value: 'system', icon: <SettingsBrightnessIcon fontSize="small" /> },
]

export default function ThemeModeMenu() {
  const { t } = useTranslation('common')
  const { mode, setMode } = useThemeMode()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const handleOpen = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)
  const handleSelect = (value: ThemeMode) => {
    setMode(value)
    handleClose()
  }

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen} aria-label={t('theme.system')}>
        <Brightness4Icon />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {OPTIONS.map((option) => (
          <MenuItem key={option.value} selected={mode === option.value} onClick={() => handleSelect(option.value)}>
            <ListItemIcon>{option.icon}</ListItemIcon>
            <ListItemText>{t(`theme.${option.value}`)}</ListItemText>
            {mode === option.value && <CheckIcon fontSize="small" />}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
