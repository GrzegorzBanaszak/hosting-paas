import { useMemo } from 'react'
import { RouterProvider, RouterView, useRouter } from './router'
import { routes } from './routes'
import { SideNav } from '../widgets/side-nav/ui/SideNav'
import { TopBar } from '../widgets/top-bar/ui/TopBar'
import { Toaster } from '../widgets/toaster/ui/Toaster'
import { ToastProvider } from '../widgets/toaster/ui/ToastContext'

export function AppShell() {
  return (
    <RouterProvider>
      <ToastProvider>
        <ShellContent />
        <Toaster />
      </ToastProvider>
    </RouterProvider>
  )
}

function ShellContent() {
  const { currentPath } = useRouter()
  const activeRoute = useMemo(
    () => routes.find((route) => route.path === currentPath),
    [currentPath],
  )

  return (
    <div className="h-screen overflow-hidden bg-[color:var(--hp-bg)] text-[color:var(--hp-text)]">
      <div className="flex h-full overflow-hidden">
        <SideNav routes={routes} currentPath={currentPath} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <TopBar currentRoute={activeRoute} />
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 py-6 lg:px-10 lg:py-8">
            <div className="mx-auto max-w-[1600px]">
              <RouterView routes={routes} />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
