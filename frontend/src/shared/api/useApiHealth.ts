import { useEffect, useState } from 'react'
import { apiBaseUrl } from '../config/api'

export type ApiHealthStatus = 'checking' | 'healthy' | 'offline'

export function useApiHealth(pollIntervalMs = 300000) {
  const [status, setStatus] = useState<ApiHealthStatus>('checking')

  useEffect(() => {
    let isActive = true

    async function checkApiHealth() {
      try {
        const response = await fetch(`${apiBaseUrl}/health`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        })

        if (!isActive) {
          return
        }

        setStatus(response.ok ? 'healthy' : 'offline')
      } catch {
        if (!isActive) {
          return
        }

        setStatus('offline')
      }
    }

    void checkApiHealth()
    const intervalId = window.setInterval(() => {
      void checkApiHealth()
    }, pollIntervalMs)

    return () => {
      isActive = false
      window.clearInterval(intervalId)
    }
  }, [pollIntervalMs])

  return status
}
