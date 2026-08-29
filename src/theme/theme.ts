import { createTheme, type Theme } from '@mui/material/styles'
import type { ResolvedThemeMode } from './ThemeModeContext'

export function createNexoraTheme(mode: ResolvedThemeMode): Theme {
  return createTheme({
    palette: {
      mode,
      primary: { main: '#1565c0' },
      secondary: { main: '#2e7d32' },
      error: { main: '#c62828' },
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
  })
}
