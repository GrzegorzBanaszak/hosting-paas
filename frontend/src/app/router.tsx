import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { NotFoundPage } from '../pages/not-found/ui/NotFoundPage'

export type AppRoute = {
  path: string
  label: string
  description: string
  icon: string
  public?: boolean
  nav?: boolean
  section?: 'primary' | 'secondary'
  element: ReactNode
}

type RouterContextValue = {
  currentPath: string
  navigate: (path: string) => void
}

const RouterContext = createContext<RouterContextValue | null>(null)

export type RouteMatch = {
  route: AppRoute
  params: Record<string, string>
}

function getCurrentPath() {
  const path = window.location.pathname || '/'
  return path === '' ? '/' : path
}

function normalizePath(path: string) {
  if (path === '') {
    return '/'
  }

  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1)
  }

  return path
}

function getPathSegments(path: string) {
  const normalized = normalizePath(path)

  if (normalized === '/') {
    return []
  }

  return normalized.slice(1).split('/')
}

export function matchPath(pattern: string, pathname: string) {
  const patternSegments = getPathSegments(pattern)
  const pathSegments = getPathSegments(pathname)

  if (patternSegments.length !== pathSegments.length) {
    return null
  }

  const params: Record<string, string> = {}

  for (let index = 0; index < patternSegments.length; index += 1) {
    const patternSegment = patternSegments[index]
    const pathSegment = pathSegments[index]

    if (!patternSegment || !pathSegment) {
      return null
    }

    if (patternSegment.startsWith(':')) {
      params[patternSegment.slice(1)] = decodeURIComponent(pathSegment)
      continue
    }

    if (patternSegment !== pathSegment) {
      return null
    }
  }

  return params
}

export function matchRoute(routes: AppRoute[], pathname: string): RouteMatch | null {
  for (const route of routes) {
    const params = matchPath(route.path, pathname)

    if (params) {
      return { route, params }
    }
  }

  return null
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
  const match = matchRoute(routes, currentPath)

  return match ? match.route.element : <NotFoundPage />
}
