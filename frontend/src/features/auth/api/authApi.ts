import { apiFetch } from '../../../shared/api/http'
import type { AdminSessionResponse, AuthTokenResponse, LoginInput } from '../model/types'

export function loginAdmin(input: LoginInput) {
  return apiFetch<AuthTokenResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
    suppressUnauthorized: true,
  })
}

export function fetchCurrentSession(accessToken?: string) {
  return apiFetch<AdminSessionResponse>('/api/auth/me', {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  })
}
