import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import * as authApi from '../api/authApi'
import * as usersApi from '../api/usersApi'
import type { User } from '../api/usersApi'
import { getTokens, setTokens, subscribeToTokens } from './tokenStore'

interface AuthContextValue {
  user: User | null
  /** true mientras se resuelve la sesión inicial (leer tokens guardados + pedir /users/me). */
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadCurrentUser = useCallback(async () => {
    if (!getTokens()) {
      setUser(null)
      return
    }
    try {
      setUser(await usersApi.getCurrentUser())
    } catch {
      // El token guardado ya no sirve (expiró el refresh, usuario eliminado, etc.)
      setTokens(null)
      setUser(null)
    }
  }, [])

  useEffect(() => {
    loadCurrentUser().finally(() => setIsLoading(false))
    return subscribeToTokens((tokens) => {
      if (!tokens) setUser(null)
    })
  }, [loadCurrentUser])

  const login = useCallback(async (email: string, password: string) => {
    setTokens(await authApi.login(email, password))
    await loadCurrentUser()
  }, [loadCurrentUser])

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    await usersApi.registerUser({ email, password, displayName })
    await login(email, password)
  }, [login])

  const logout = useCallback(async () => {
    const tokens = getTokens()
    setTokens(null)
    if (tokens) {
      // Best-effort: si falla (p. ej. sin red), igual ya se borró la sesión local.
      await authApi.logout(tokens.refreshToken).catch(() => undefined)
    }
  }, [])

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>.')
  return context
}
