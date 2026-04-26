import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { useAuth } from './AuthContext'

const steps = [
  { time: '14:02:11', label: 'Initializing Control Plane...', state: 'OK' },
  { time: '14:02:12', label: 'Verifying Session Tokens...', state: 'PENDING' },
  { time: '14:02:12', label: 'Fetching user metadata...', state: 'WAIT' },
]

export function SessionBootstrapPage() {
  const { restoreSession } = useAuth()

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[color:var(--hp-auth-bg)] px-6 py-16">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle,_rgba(141,75,0,0.2)_1px,_transparent_1px)] [background-position:center] [background-size:26px_26px]" />

      <div className="relative z-10 flex w-full max-w-[560px] flex-col items-center gap-8 text-center">
        <div>
          <div className="mb-4 flex items-center justify-center gap-3 font-['Space_Grotesk'] text-[13px] uppercase tracking-[0.18em] text-[color:var(--hp-text-subtle)]">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--hp-radius-sm)] bg-[color:var(--hp-accent-strong)] text-white shadow-[var(--hp-shadow)]">
              <span className="material-symbols-outlined text-[20px]">deployed_code</span>
            </span>
            Hosting-PaaS
          </div>
          <h1 className="text-[clamp(2rem,4vw,3.5rem)] font-black uppercase tracking-[-0.06em]">
            CONTROL PLANE
          </h1>
          <p className="mt-3 font-['Space_Grotesk'] text-[13px] uppercase tracking-[0.24em] text-[color:var(--hp-text-subtle)]">
            Auth Session Init
          </p>
        </div>

        <Card className="w-full overflow-hidden rounded-[24px] border-[color:var(--hp-auth-border)] bg-white/94 shadow-[0_20px_50px_rgba(35,26,19,0.12)]">
          <div className="flex items-center justify-between border-b border-[color:var(--hp-auth-border)] bg-[color:var(--hp-accent-soft)] px-6 py-4 font-['Space_Grotesk'] text-[13px] uppercase tracking-[0.16em] text-[color:var(--hp-text)]">
            <span className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-[color:var(--hp-accent)]/60" />
              Auth_Session_Init
            </span>
            <span>GET /api/auth/me</span>
          </div>

          <div className="space-y-6 px-8 py-8">
            <div>
              <h2 className="text-[44px] font-semibold tracking-[-0.06em]">Przywracanie sesji...</h2>
              <p className="mx-auto mt-4 max-w-lg text-[18px] leading-8 text-[color:var(--hp-text-subtle)]">
                Synchronizacja kontekstu uzytkownika z klastrem globalnym.
              </p>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-[color:var(--hp-surface-dim)]">
              <div className="h-full w-[66%] rounded-full bg-[color:var(--hp-accent-strong)]" />
            </div>

            <div className="rounded-[18px] border border-[color:var(--hp-auth-border)] bg-[color:var(--hp-accent-soft)] p-5 text-left">
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div
                    key={step.label}
                    className={`grid grid-cols-[88px_minmax(0,1fr)_auto] items-center gap-4 text-[15px] ${
                      index === 2 ? 'opacity-45' : ''
                    }`}
                  >
                    <span className="text-[28px] tracking-[-0.05em] text-[#c59158]">{step.time}</span>
                    <span>{step.label}</span>
                    <span
                      className={`font-['Space_Grotesk'] text-[13px] uppercase tracking-[0.14em] ${
                        step.state === 'OK'
                          ? 'text-[#005ea6]'
                          : step.state === 'PENDING'
                            ? 'text-[#c59158]'
                            : 'text-[color:var(--hp-text-muted)]'
                      }`}
                    >
                      {step.state}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-[color:var(--hp-auth-border)] bg-[color:var(--hp-accent-soft)] px-6 py-5">
            <div className="grid flex-1 grid-cols-3 gap-4 text-left">
              <Metric label="Latency" value="12ms" />
              <Metric label="Region" value="WAW-01" />
              <Metric label="Transport" value="TLS 1.3" />
            </div>
          </div>
        </Card>

        <Button kind="ghost" className="font-['Space_Grotesk'] uppercase tracking-[0.12em]" onClick={() => void restoreSession()}>
          <span className="material-symbols-outlined mr-2 text-[18px]">refresh</span>
          Retry Connection
        </Button>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.18em] text-[color:var(--hp-text-subtle)]">
        {label}
      </div>
      <div className="mt-2 text-[28px] tracking-[-0.05em]">{value}</div>
    </div>
  )
}
