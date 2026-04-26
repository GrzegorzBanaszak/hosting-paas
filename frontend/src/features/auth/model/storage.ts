import type { AuthSession, AuthTokenResponse, AdminSessionResponse } from './types'

const sessionStorageKey = 'hp.authSession'
const accessTokenStorageKey = 'hp.accessToken'

export function createSession(
  token: AuthTokenResponse,
  profile: AdminSessionResponse,
): AuthSession {
  return {
    accessToken: token.accessToken,
    tokenType: token.tokenType,
    expiresAtUtc: token.expiresAtUtc,
    user: {
      username: profile.username,
      role: profile.role,
      email: profile.email,
      displayName: profile.displayName ?? token.displayName,
    },
  }
}

export function readStoredSession() {
  const raw = window.localStorage.getItem(sessionStorageKey)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    clearStoredSession()
    return null
  }
}

export function persistSession(session: AuthSession) {
  window.localStorage.setItem(sessionStorageKey, JSON.stringify(session))
  window.localStorage.setItem(accessTokenStorageKey, session.accessToken)
}

export function clearStoredSession() {
  window.localStorage.removeItem(sessionStorageKey)
  window.localStorage.removeItem(accessTokenStorageKey)
}
