import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { getLocationContext } from './sessionLocation'
import type { SessionLocation } from './sessionLocation'

const SESSION_STORAGE_KEY = 'busy_pos_session'
const SESSION_STORAGE_VERSION = 1

export type SessionUser = {
  id: number
  username: string | null
  fullname: string
  birthday: string | null
  rfc: string | null
  cellphone: number | null
  email: string | null
  typeUser: number
}

type StoredSession = SessionLocation & {
  version: number
  accessToken: string
  tokenType: string
  tokenExpiresAt: number
  user: SessionUser
}

type SessionContextValue = SessionLocation & {
  accessToken: string | null
  tokenType: string | null
  user: SessionUser | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  refreshSession: () => Promise<void>
}

type TokenResponse = {
  access_token: string
  token_type: string
  dashboard?: string
}

type JwtPayload = {
  exp?: number
  sub?: string
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

const decodeJwtPayload = (token: string): JwtPayload | null => {
  const payload = token.split('.')[1]

  if (!payload) {
    return null
  }

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const paddedBase64 = base64.padEnd(base64.length + ((4 - base64.length % 4) % 4), '=')
    const decodedPayload = window.atob(paddedBase64)

    return JSON.parse(decodedPayload) as JwtPayload
  } catch {
    return null
  }
}

const getTokenExpiresAt = (token: string): number | null => {
  const payload = decodeJwtPayload(token)

  if (!payload?.exp) {
    return null
  }

  return payload.exp * 1000
}

const isTokenExpired = (tokenExpiresAt: number): boolean => {
  return tokenExpiresAt <= Date.now()
}

const clearStoredSession = () => {
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

const readStoredSession = (): StoredSession | null => {
  const rawSession = localStorage.getItem(SESSION_STORAGE_KEY)

  if (!rawSession) {
    return null
  }

  try {
    const parsedSession = JSON.parse(rawSession) as StoredSession

    if (
      parsedSession.version !== SESSION_STORAGE_VERSION ||
      !parsedSession.accessToken ||
      !parsedSession.tokenType ||
      !parsedSession.user ||
      !parsedSession.tokenExpiresAt
    ) {
      clearStoredSession()
      return null
    }

    return parsedSession
  } catch {
    clearStoredSession()
    return null
  }
}

const requestUserInfo = async (
  apiBaseUrl: string,
  tokenType: string,
  accessToken: string
): Promise<SessionUser> => {
  const response = await fetch(`${apiBaseUrl}/auth/me`, {
    headers: {
      Authorization: `${tokenType} ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new Error('La sesión guardada no es válida.')
  }

  return response.json() as Promise<SessionUser>
}

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const locationContext = useMemo(getLocationContext, [])
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [tokenType, setTokenType] = useState<string | null>(null)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  const persistSession = useCallback(
    (nextAccessToken: string, nextTokenType: string, nextUser: SessionUser) => {
      const tokenExpiresAt = getTokenExpiresAt(nextAccessToken)

      if (!tokenExpiresAt) {
        throw new Error('El token recibido no incluye expiración.')
      }

      const normalizedTokenType = nextTokenType || 'bearer'
      const storedSession: StoredSession = {
        version: SESSION_STORAGE_VERSION,
        ...locationContext,
        accessToken: nextAccessToken,
        tokenType: normalizedTokenType,
        tokenExpiresAt,
        user: nextUser
      }

      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(storedSession))
      setAccessToken(nextAccessToken)
      setTokenType(normalizedTokenType)
      setUser(nextUser)
    },
    [locationContext]
  )

  const logout = useCallback(() => {
    clearStoredSession()
    setAccessToken(null)
    setTokenType(null)
    setUser(null)
  }, [])

  const refreshSession = useCallback(async () => {
    const storedSession = readStoredSession()

    if (!storedSession || isTokenExpired(storedSession.tokenExpiresAt)) {
      logout()
      return
    }

    try {
      const sessionUser = await requestUserInfo(
        locationContext.apiBaseUrl,
        storedSession.tokenType,
        storedSession.accessToken
      )

      persistSession(storedSession.accessToken, storedSession.tokenType, sessionUser)
    } catch {
      logout()
    }
  }, [locationContext.apiBaseUrl, logout, persistSession])

  const login = useCallback(
    async (username: string, password: string) => {
      const credentials = new URLSearchParams()
      credentials.set('username', username)
      credentials.set('password', password)

      let response: Response

      try {
        response = await fetch(`${locationContext.apiBaseUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: credentials
        })
      } catch {
        throw new Error('No fue posible conectar con la API.')
      }

      if (!response.ok) {
        if (response.status === 400 || response.status === 401) {
          throw new Error('Usuario o contraseña incorrectos.')
        }

        throw new Error('No fue posible iniciar sesión.')
      }

      const tokenResponse = (await response.json()) as TokenResponse
      const nextAccessToken = tokenResponse.access_token
      const nextTokenType = tokenResponse.token_type || 'bearer'

      if (!nextAccessToken) {
        throw new Error('La API no devolvió un token de sesión.')
      }

      const sessionUser = await requestUserInfo(
        locationContext.apiBaseUrl,
        nextTokenType,
        nextAccessToken
      )

      persistSession(nextAccessToken, nextTokenType, sessionUser)
    },
    [locationContext.apiBaseUrl, persistSession]
  )

  useEffect(() => {
    let isMounted = true

    const bootstrapSession = async () => {
      await refreshSession()

      if (isMounted) {
        setIsBootstrapping(false)
      }
    }

    bootstrapSession()

    return () => {
      isMounted = false
    }
  }, [refreshSession])

  const value = useMemo<SessionContextValue>(
    () => ({
      ...locationContext,
      accessToken,
      tokenType,
      user,
      isAuthenticated: Boolean(accessToken && user),
      isBootstrapping,
      login,
      logout,
      refreshSession
    }),
    [
      accessToken,
      isBootstrapping,
      locationContext,
      login,
      logout,
      refreshSession,
      tokenType,
      user
    ]
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export const useSession = () => {
  const context = useContext(SessionContext)

  if (!context) {
    throw new Error('useSession debe utilizarse dentro de SessionProvider.')
  }

  return context
}
