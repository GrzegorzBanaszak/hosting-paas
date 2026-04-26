import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchCurrentSession, loginAdmin } from '../api/authApi'
import { ApiError, registerUnauthorizedListener } from '../../../shared/api/http'
import { clearStoredSession, createSession, persistSession, readStoredSession } from '../model/storage'
import type { AuthSession, LoginInput } from '../model/types'

type AuthStatus = 'bootstrapping' | 'authenticated' | 'unauthenticated'

type AuthContextValue = {
  status: AuthStatus
  session: AuthSession | null
  hasSessionExpired: boolean
  isInitializing: boolean
  login: (input: LoginInput) => Promise<void>
  logout: () => void
  dismissSessionExpired: () => void
  restoreSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [status, setStatus] = useState<AuthStatus>('bootstrapping')
  const [hasSessionExpired, setHasSessionExpired] = useState(false)

  const restoreSession = useCallback(async () => {
    const storedSession = readStoredSession()

    if (!storedSession) {
      setSession(null)
      setStatus('unauthenticated')
      return
    }

    setStatus('bootstrapping')

    try {
      const profile = await fetchCurrentSession()
      const nextSession = {
        ...storedSession,
        user: {
          username: profile.username,
          role: profile.role,
          email: profile.email,
          displayName: profile.displayName ?? storedSession.user.displayName,
        },
      }

      persistSession(nextSession)
      setSession(nextSession)
      setHasSessionExpired(false)
      setStatus('authenticated')
    } catch (error) {
      clearStoredSession()
      setSession(null)
      setStatus('unauthenticated')
      setHasSessionExpired(error instanceof ApiError && error.status === 401)
    }
  }, [])

  useEffect(() => {
    void restoreSession()
  }, [])

  useEffect(() => {
    return registerUnauthorizedListener(() => {
      clearStoredSession()
      setSession(null)
      setHasSessionExpired(true)
      setStatus('unauthenticated')
    })
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    const token = await loginAdmin(input)
    const profile = await fetchCurrentSession(token.accessToken)
    const nextSession = createSession(token, profile)

    persistSession(nextSession)
    setSession(nextSession)
    setHasSessionExpired(false)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(() => {
    clearStoredSession()
    setSession(null)
    setHasSessionExpired(false)
    setStatus('unauthenticated')
  }, [])

  const dismissSessionExpired = useCallback(() => {
    setHasSessionExpired(false)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      hasSessionExpired,
      isInitializing: status === 'bootstrapping',
      login,
      logout,
      dismissSessionExpired,
      restoreSession,
    }),
    [dismissSessionExpired, hasSessionExpired, login, logout, restoreSession, session, status],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
