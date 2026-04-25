import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { NotFoundPage } from '../pages/not-found/ui/NotFoundPage'

export type AppRoute = {
  path: string
  label: string
  description: string
  icon: string
  section?: 'primary' | 'secondary'
  element: ReactNode
}

type RouterContextValue = {
  currentPath: string
  navigate: (path: string) => void
}

const RouterContext = createContext<RouterContextValue | null>(null)

function getCurrentPath() {
  const path = window.location.pathname || '/'
  return path === '' ? '/' : path
}

export function RouterProvider({
  children,
}: {
  children: ReactNode
}) {
  const [currentPath, setCurrentPath] = useState(getCurrentPath)

  useEffect(() => {
    const handlePopState = () => setCurrentPath(getCurrentPath())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const value = useMemo<RouterContextValue>(
    () => ({
      currentPath,
      navigate: (path) => {
        if (path === currentPath) {
          return
        }

        window.history.pushState({}, '', path)
        setCurrentPath(path)
      },
    }),
    [currentPath],
  )

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

export function useRouter() {
  const context = useContext(RouterContext)

  if (!context) {
    throw new Error('useRouter must be used within RouterProvider')
  }

  return context
}

export function RouterLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: ReactNode
}) {
  const { navigate } = useRouter()

  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return
        }

        event.preventDefault()
        navigate(href)
      }}
    >
      {children}
    </a>
  )
}

export function RouterView({ routes }: { routes: AppRoute[] }) {
  const { currentPath } = useRouter()
  const route = routes.find((item) => item.path === currentPath)

  return route ? route.element : <NotFoundPage />
}
