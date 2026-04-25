import type { AppRoute } from '../../../app/router'
import { Badge } from '../../../shared/ui/Badge'
import { useToast } from '../../toaster/ui/ToastContext'

export function TopBar({ currentRoute }: { currentRoute?: AppRoute }) {
  const { pushToast } = useToast()

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
          <Badge tone="success">API: Healthy</Badge>
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
          <div
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-[color:var(--hp-border)] bg-[color:var(--hp-text)] text-sm font-semibold text-white shadow-[var(--hp-shadow)]"
            title={currentRoute?.label ?? 'Admin'}
          >
            AD
          </div>
        </div>
      </div>
    </header>
  )
}
