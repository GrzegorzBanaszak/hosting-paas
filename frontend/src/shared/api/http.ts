import { apiBaseUrl } from '../config/api'

const unauthorizedListeners = new Set<() => void>()

export class ApiError extends Error {
  status: number
  detail?: string

  constructor(message: string, status: number, detail?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

type ApiFetchOptions = RequestInit & {
  suppressUnauthorized?: boolean
}

function getAccessToken() {
  return window.localStorage.getItem('hp.accessToken')
}

export function registerUnauthorizedListener(listener: () => void) {
  unauthorizedListeners.add(listener)

  return () => {
    unauthorizedListeners.delete(listener)
  }
}

function emitUnauthorized() {
  unauthorizedListeners.forEach((listener) => listener())
}

export async function apiFetch<T>(path: string, init?: ApiFetchOptions) {
  const headers = new Headers(init?.headers)
  const hasBody = init?.body !== undefined && init.body !== null

  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  headers.set('Accept', 'application/json')

  const token = getAccessToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  })

  if (response.status === 401) {
    if (!init?.suppressUnauthorized) {
      emitUnauthorized()
    }
    throw new ApiError('Sesja administratora wygasla.', 401)
  }

  if (!response.ok) {
    let detail: string | undefined
    let title = 'Wystapil blad odpowiedzi API.'

    try {
      const data = (await response.json()) as { title?: string; detail?: string }
      title = data.title ?? title
      detail = data.detail
    } catch {
      detail = undefined
    }

    throw new ApiError(title, response.status, detail)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
