import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedThemeMode = 'light' | 'dark'

interface ThemeModeContextValue {
  mode: ThemeMode
  /** El modo real a aplicar: resuelve 'system' según la preferencia del sistema operativo. */
  resolvedMode: ResolvedThemeMode
  setMode: (mode: ThemeMode) => void
}

const STORAGE_KEY = 'nexora.themeMode'

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined)

function readStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // localStorage no disponible: se usa 'system' como valor por defecto, sin persistir.
  }
  return 'system'
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode)
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])

  const setMode = (next: ThemeMode) => {
    setModeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Se pierde la preferencia al recargar, pero la sesión actual sigue funcionando.
    }
  }

  const value = useMemo<ThemeModeContextValue>(
    () => ({
      mode,
      resolvedMode: mode === 'system' ? (systemPrefersDark ? 'dark' : 'light') : mode,
      setMode,
    }),
    [mode, systemPrefersDark],
  )

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>
}

export function useThemeMode(): ThemeModeContextValue {
  const context = useContext(ThemeModeContext)
  if (!context) throw new Error('useThemeMode debe usarse dentro de <ThemeModeProvider>.')
  return context
}
