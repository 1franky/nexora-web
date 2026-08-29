import { useMemo, type ReactNode } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { useThemeMode } from './ThemeModeContext'
import { createNexoraTheme } from './theme'

/** Separado de ThemeModeProvider porque necesita leer useThemeMode(), así que debe vivir un nivel adentro. */
export default function AppThemeProvider({ children }: { children: ReactNode }) {
  const { resolvedMode } = useThemeMode()
  const theme = useMemo(() => createNexoraTheme(resolvedMode), [resolvedMode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
