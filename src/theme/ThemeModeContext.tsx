import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark'
/** Antes distinto de ThemeMode (existía 'system'); ya no hace falta un tipo aparte, pero se mantiene el alias por compatibilidad con quien ya lo importaba. */
export type ResolvedThemeMode = ThemeMode

interface ThemeModeContextValue {
  mode: ThemeMode
  /** Igual a `mode` siempre. Ver nota abajo: ya no hay "system" que resolver en vivo. */
  resolvedMode: ResolvedThemeMode
  setMode: (mode: ThemeMode) => void
}

const STORAGE_KEY = 'nexora.themeMode'

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined)

function systemPrefersDark(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    return false
  }
}

/**
 * Ya no existe "Sistema" como opción explícita (issue nexora-web#6): un
 * valor guardado válido se respeta tal cual; el valor legado "system" (o
 * cualquier otro no reconocido) se resuelve una sola vez a la preferencia
 * del sistema en ese momento, igual que si nunca hubiera habido nada
 * guardado — sin quedar "siguiendo" cambios futuros del SO.
 */
function readStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // localStorage no disponible: sigue abajo, resuelve del sistema sin poder persistir.
  }
  return systemPrefersDark() ? 'dark' : 'light'
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode)

  const setMode = (next: ThemeMode) => {
    setModeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Se pierde la preferencia al recargar, pero la sesión actual sigue funcionando.
    }
  }

  // Deja explícito en localStorage lo que se resolvió al montar (usuario
  // nuevo, o migrando el valor legado "system") — así no hay que volver a
  // resolver del sistema en cada carga futura, solo esta primera vez.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // no-op: sin localStorage, simplemente se re-resuelve del sistema en cada carga.
    }
    // eslint-disable-next-line -- deliberado: solo al montar, no en cada cambio de mode.
  }, [])

  const value = useMemo<ThemeModeContextValue>(() => ({ mode, resolvedMode: mode, setMode }), [mode])

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>
}

export function useThemeMode(): ThemeModeContextValue {
  const context = useContext(ThemeModeContext)
  if (!context) throw new Error('useThemeMode debe usarse dentro de <ThemeModeProvider>.')
  return context
}
