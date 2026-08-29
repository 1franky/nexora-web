/**
 * Guarda el access/refresh token en localStorage. Simplificación deliberada
 * para este MVP: un SPA puro sin backend-for-frontend no tiene forma de usar
 * cookies httpOnly aquí, así que localStorage es el lugar estándar — con el
 * trade-off conocido de exposición a XSS. El access token dura poco (15 min
 * por defecto en la API) para acotar el daño si llegara a filtrarse.
 */
export interface Tokens {
  accessToken: string
  refreshToken: string
}

const STORAGE_KEY = 'nexora.tokens'

type Listener = (tokens: Tokens | null) => void

let current: Tokens | null = loadFromStorage()
const listeners = new Set<Listener>()

function loadFromStorage(): Tokens | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Tokens) : null
  } catch {
    return null
  }
}

export function getTokens(): Tokens | null {
  return current
}

export function setTokens(next: Tokens | null): void {
  current = next
  try {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // localStorage no disponible (modo privado, cuota llena, etc.): la
    // sesión sigue funcionando en memoria, solo no persiste al recargar.
  }
  listeners.forEach((listener) => listener(next))
}

/** Se notifica cuando los tokens cambian (login, logout, refresh). Devuelve una función para desuscribirse. */
export function subscribeToTokens(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
