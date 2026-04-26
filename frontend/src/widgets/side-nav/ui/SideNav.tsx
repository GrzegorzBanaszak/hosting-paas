import type { AppRoute } from '../../../app/router'
import type { AuthSession } from '../../../features/auth/model/types'
import { RouterLink } from '../../../app/router'
import logoUrl from '../../../assets/logo.png'
import { Button } from '../../../shared/ui/Button'

export function SideNav({
  routes,
  currentPath,
  session,
  onLogout,
}: {
  routes: AppRoute[]
  currentPath: string
  session: AuthSession | null
  onLogout: () => void
}) {
  const primaryRoutes = routes.filter(
    (route) =>
      route.nav !== false &&
      route.section !== 'secondary' &&
      route.path !== '/404' &&
      !route.public,
  )
  const secondaryRoutes = routes.filter(
    (route) =>
      route.nav !== false &&
      route.section === 'secondary' &&
      route.path !== '/404' &&
      !route.public,
  )
  const displayName = session?.user.displayName ?? session?.user.username ?? 'Administrator'
  const email = session?.user.email ?? `${session?.user.username ?? 'admin'}@local`

  return (
    <aside className="hidden h-screen w-80 shrink-0 flex-col justify-between border-r border-[color:var(--hp-border)] bg-[color:var(--hp-bg)] px-5 py-6 md:flex">
      <div>
        <div className="mb-10 flex items-center gap-4 px-3">
          <img
            src={logoUrl}
            alt="hosting-paas logo"
            className="h-10 w-10 rounded-lg object-cover shadow-[var(--hp-shadow)]"
          />
          <div>
            <div className="text-[1.15rem] font-extrabold uppercase leading-none tracking-[-0.04em]">
              hosting-paas
            </div>
            <div className="mt-1 font-['Space_Grotesk'] text-[12px] uppercase tracking-[0.12em] text-[color:var(--hp-text-subtle)]">
              Control Plane
            </div>
          </div>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-8">
          <div className="space-y-1">
            {primaryRoutes.map((route) => (
              <NavItem
                key={route.path}
                route={route}
                active={isRouteActive(route.path, currentPath)}
              />
            ))}
          </div>
        </nav>
      </div>

      <div className="border-t border-[color:var(--hp-border)] pt-6">
        <div className="mb-5 rounded-[var(--hp-radius-md)] border border-[color:var(--hp-border)] bg-[color:var(--hp-surface)] p-4 shadow-[var(--hp-shadow)]">
          <div className="font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.14em] text-[color:var(--hp-text-muted)]">
            Admin Session
          </div>
          <div className="mt-2 text-[15px] font-semibold">{displayName}</div>
          <div className="mt-1 text-[13px] text-[color:var(--hp-text-muted)]">{email}</div>
          <Button kind="secondary" className="mt-4 w-full justify-center" onClick={onLogout}>
            <span className="material-symbols-outlined mr-2 text-[18px]">logout</span>
            Logout
          </Button>
        </div>
        <div className="space-y-1">
          {secondaryRoutes.map((route) => (
            <NavItem
              key={route.path}
              route={route}
              active={isRouteActive(route.path, currentPath)}
            />
          ))}
        </div>
      </div>
    </aside>
  )
}

function NavItem({ route, active }: { route: AppRoute; active: boolean }) {
  return (
    <RouterLink
      href={route.path}
      className={`group flex items-center gap-3 px-4 py-3 text-[15px] transition ${
        active
          ? 'rounded-lg border border-[color:var(--hp-border)] bg-[color:var(--hp-surface)] text-[color:var(--hp-accent)] shadow-[var(--hp-shadow)]'
          : 'text-[color:var(--hp-text-subtle)] hover:text-[color:var(--hp-text)]'
      }`}
    >
      <span className="material-symbols-outlined">{route.icon}</span>
      <span className="min-w-0 flex-1 font-medium">{route.label}</span>
    </RouterLink>
  )
}

function isRouteActive(routePath: string, currentPath: string) {
  if (currentPath === routePath) {
    return true
  }

  if (routePath === '/') {
    return false
  }

  return currentPath.startsWith(`${routePath}/`)
}
