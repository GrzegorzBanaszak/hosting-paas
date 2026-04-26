import { Button } from '../../../shared/ui/Button'
import { useAuth } from './AuthContext'

export function SessionExpiredModal() {
  const { logout } = useAuth()

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[rgba(97,103,115,0.36)] px-6 py-10 backdrop-blur-[6px]">
      <div className="w-full max-w-[560px] overflow-hidden rounded-[24px] border border-[color:var(--hp-border)] bg-white shadow-[0_20px_50px_rgba(35,26,19,0.18)]">
        <div className="flex items-center justify-center bg-[color:var(--hp-surface-strong)] px-6 py-10">
          <div className="flex h-20 w-20 items-center justify-center rounded-[20px] border border-amber-200 bg-amber-50 text-[color:var(--hp-accent)]">
            <span className="material-symbols-outlined text-[36px]">timer_off</span>
          </div>
        </div>

        <div className="space-y-8 px-10 py-8 text-center">
          <div>
            <h2 className="text-[52px] font-semibold tracking-[-0.06em]">Sesja wygasla</h2>
            <p className="mx-auto mt-4 max-w-md text-[19px] leading-8 text-[color:var(--hp-text-subtle)]">
              Twoja sesja administratora wygasla ze wzgledow bezpieczenstwa. Prosze
              zalogowac sie ponownie.
            </p>
          </div>

          <div className="rounded-[14px] border border-[color:var(--hp-border)] bg-[color:var(--hp-surface-strong)] text-left">
            <div className="flex items-center justify-between border-b border-[color:var(--hp-border)] px-5 py-3 font-['Space_Grotesk'] text-[12px] uppercase tracking-[0.14em] text-[color:var(--hp-text-subtle)]">
              <span>System Event</span>
              <span className="text-[color:var(--hp-accent-strong)]">TIMEOUT_0X42</span>
            </div>
            <div className="flex items-center gap-3 px-5 py-4 text-[15px] text-[color:var(--hp-text-subtle)]">
              <span className="material-symbols-outlined text-[18px]">shield_lock</span>
              Auto-logout triggered to secure administrator access.
            </div>
          </div>

          <div className="space-y-4">
            <Button
              className="w-full justify-center rounded-[var(--hp-radius-md)] py-4 text-[18px] font-semibold"
              onClick={logout}
            >
              Zaloguj ponownie
            </Button>
            <Button
              kind="secondary"
              className="w-full justify-center rounded-[var(--hp-radius-md)] py-4 text-[18px] font-semibold"
              onClick={logout}
            >
              Powrot
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[color:var(--hp-border)] bg-[color:var(--hp-surface-strong)] px-6 py-4 text-[12px] font-['Space_Grotesk'] uppercase tracking-[0.14em] text-[color:var(--hp-text-muted)]">
          <span>Auth Service v2.4.1</span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-slate-200" />
            <span className="h-2 w-2 rounded-full bg-slate-200" />
            <span className="h-2 w-2 rounded-full bg-[color:var(--hp-accent)]" />
          </span>
        </div>
      </div>
    </div>
  )
}
