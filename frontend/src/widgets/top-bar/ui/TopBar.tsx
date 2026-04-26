import type { AppRoute } from '../../../app/router'
import type { AuthSession } from '../../../features/auth/model/types'
import { useApiHealth } from '../../../shared/api/useApiHealth'
import { Badge } from '../../../shared/ui/Badge'
import { Button } from '../../../shared/ui/Button'
import { useToast } from '../../toaster/ui/ToastContext'

export function TopBar({
  currentRoute,
  session,
  onLogout,
}: {
  currentRoute?: AppRoute
  session: AuthSession | null
  onLogout: () => void
}) {
  const { pushToast } = useToast()
  const apiHealth = useApiHealth()
  const displayName = session?.user.displayName ?? session?.user.username ?? 'Admin'

  return (
    <header className="sticky top-0 z-20 border-b border-[color:var(--hp-border)] bg-white/85 px-5 py-5 backdrop-blur-sm lg:px-10">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--hp-text-muted)]">
            search
          </span>
          <input
            type="text"
            placeholder="Search resources..."
            aria-label="Search resources"
            className="w-full rounded-lg border border-[color:var(--hp-border)] bg-[color:var(--hp-surface-strong)] py-3 pl-12 pr-4 text-[14px] text-[color:var(--hp-text-subtle)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] outline-none transition focus:border-[color:var(--hp-accent)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
          <Badge tone="default">Production</Badge>
          <Badge tone={apiHealth === 'healthy' ? 'success' : apiHealth === 'checking' ? 'warning' : 'danger'}>
            API: {apiHealth === 'healthy' ? 'Healthy' : apiHealth === 'checking' ? 'Checking' : 'Offline'}
          </Badge>
          <div className="hidden h-8 w-px bg-[color:var(--hp-border)] lg:block" />
          <button
            type="button"
            aria-label="Notifications"
            className="rounded-md p-2 text-[color:var(--hp-text-subtle)] transition hover:bg-[color:var(--hp-surface-strong)]"
            onClick={() =>
              pushToast({
                title: 'Powiadomienia',
                description:
                  'Globalny system toastow jest gotowy do integracji z API i akcjami panelu.',
              })
            }
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button
            type="button"
            aria-label="Terminal"
            className="rounded-md p-2 text-[color:var(--hp-text-subtle)] transition hover:bg-[color:var(--hp-surface-strong)]"
          >
            <span className="material-symbols-outlined">terminal</span>
          </button>
          <Button kind="secondary" className="px-3 py-2" onClick={onLogout}>
            <span className="material-symbols-outlined mr-2 text-[18px]">logout</span>
            Logout
          </Button>
          <div
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-[color:var(--hp-border)] bg-[color:var(--hp-text)] text-sm font-semibold text-white shadow-[var(--hp-shadow)]"
            title={currentRoute?.label ?? displayName}
          >
            {displayName.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}
