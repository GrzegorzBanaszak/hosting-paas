import { useEffect, useMemo } from 'react'
import { matchRoute, RouterProvider, RouterView, useRouter } from './router'
import { routes } from './routes'
import { SideNav } from '../widgets/side-nav/ui/SideNav'
import { TopBar } from '../widgets/top-bar/ui/TopBar'
import { Toaster } from '../widgets/toaster/ui/Toaster'
import { ToastProvider } from '../widgets/toaster/ui/ToastContext'
import { AuthProvider, useAuth } from '../features/auth/ui/AuthContext'
import { SessionBootstrapPage } from '../features/auth/ui/SessionBootstrapPage'
import { SessionExpiredModal } from '../features/auth/ui/SessionExpiredModal'

export function AppShell() {
  return (
    <RouterProvider>
      <ToastProvider>
        <AuthProvider>
          <ShellContent />
          <Toaster />
        </AuthProvider>
      </ToastProvider>
    </RouterProvider>
  )
}

function ShellContent() {
  const { currentPath, navigate } = useRouter()
  const { hasSessionExpired, isInitializing, session, status, logout } = useAuth()
  const activeRoute = useMemo(
    () => matchRoute(routes, currentPath)?.route,
    [currentPath],
  )
  const isPublicRoute = activeRoute?.public === true
  const protectedRoutes = useMemo(() => routes.filter((route) => !route.public), [])
  const publicRoutes = useMemo(() => routes.filter((route) => route.public), [])

  useEffect(() => {
    if (isInitializing) {
      return
    }

    if (status === 'authenticated' && isPublicRoute) {
      navigate('/')
      return
    }

    if (status === 'unauthenticated' && !isPublicRoute && !hasSessionExpired) {
      navigate('/login')
    }
  }, [currentPath, hasSessionExpired, isInitializing, isPublicRoute, navigate, status])

  if (isInitializing) {
    return <SessionBootstrapPage />
  }

  if (status === 'authenticated' && isPublicRoute) {
    return null
  }

  if (status === 'unauthenticated' && !isPublicRoute && !hasSessionExpired) {
    return null
  }

  if (status !== 'authenticated' && isPublicRoute) {
    return <RouterView routes={publicRoutes} />
  }

  return (
    <div className="relative h-screen overflow-hidden bg-[color:var(--hp-bg)] text-[color:var(--hp-text)]">
      <div className={`flex h-full overflow-hidden ${hasSessionExpired ? 'blur-[3px]' : ''}`}>
        <SideNav
          routes={protectedRoutes}
          currentPath={currentPath}
          session={session}
          onLogout={logout}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <TopBar currentRoute={activeRoute} session={session} onLogout={logout} />
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 py-6 lg:px-10 lg:py-8">
            <div className="mx-auto max-w-[1600px]">
              <RouterView routes={protectedRoutes} />
            </div>
          </main>
        </div>
      </div>
      {hasSessionExpired ? <SessionExpiredModal /> : null}
    </div>
  )
}
