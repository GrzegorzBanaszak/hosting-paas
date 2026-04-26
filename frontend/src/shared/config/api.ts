const fallbackApiBaseUrl = 'http://localhost:5070'

function normalizeBaseUrl(value: string | undefined) {
  if (!value) {
    return fallbackApiBaseUrl
  }

  return value.endsWith('/') ? value.slice(0, -1) : value
}

export const apiBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL)
