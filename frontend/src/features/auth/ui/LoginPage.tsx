import { useState, type FormEvent } from 'react'
import { useRouter } from '../../../app/router'
import { ApiError } from '../../../shared/api/http'
import { apiBaseUrl } from '../../../shared/config/api'
import { useApiHealth, type ApiHealthStatus } from '../../../shared/api/useApiHealth'
import { Button } from '../../../shared/ui/Button'
import { useToast } from '../../../widgets/toaster/ui/ToastContext'
import { useAuth } from './AuthContext'

export function LoginPage() {
  const { navigate } = useRouter()
  const { login, hasSessionExpired, dismissSessionExpired } = useAuth()
  const { pushToast } = useToast()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const apiStatus = useApiHealth()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)
    dismissSessionExpired()

    try {
      await login({
        username,
        password,
      })

      pushToast({
        title: 'Sesja aktywna',
        description: 'Przywrocono dostep administratora do control plane.',
        tone: 'success',
      })
      navigate('/')
    } catch (error) {
      const nextMessage =
        error instanceof ApiError
          ? error.detail ?? error.message
          : 'Nie udalo sie zalogowac do control plane.'

      setErrorMessage(nextMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[color:var(--hp-auth-bg)] px-4 py-8 text-[color:var(--hp-text)] sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:radial-gradient(circle,_rgba(141,75,0,0.95)_1px,_transparent_1px)] [background-size:24px_24px]" />

      <main className="relative z-10 flex w-full max-w-[460px] flex-col items-center gap-6 sm:gap-7">
        <header className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-[color:var(--hp-accent-strong)] text-white">
              <span className="material-symbols-outlined text-[20px]">terminal</span>
            </span>
            <h1 className="text-[26px] font-semibold uppercase tracking-[-0.05em] text-[color:var(--hp-text)] sm:text-[28px]">
              hosting-paas <span className="px-1 font-normal text-[#7b746d]">|</span>{' '}
              <span className="text-[color:var(--hp-accent-strong)]">Control Plane</span>
            </h1>
          </div>
          <p className="font-['Space_Grotesk'] text-[12px] uppercase tracking-[0.22em] text-[#5f5448] sm:text-[13px]">
            Central Infrastructure Access
          </p>
        </header>

        <div className="w-full overflow-hidden rounded-[6px] border border-[#e3c6ae] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between border-b border-[#e3c6ae] bg-[#fff1e9] px-6 py-4">
            <div className="flex items-center gap-2 font-['Space_Grotesk'] text-[12px] uppercase tracking-[0.12em] text-[#4f4032] sm:text-[13px]">
              <span
                className="material-symbols-outlined text-[14px]"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
              >
                lock
              </span>
              Administrator Authentication
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-[#cb985b]" />
          </div>

          <form className="flex flex-col gap-6 px-6 py-7" onSubmit={handleSubmit}>
            {hasSessionExpired ? (
              <div className="rounded-[4px] border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-900">
                Poprzednia sesja wygasla. Zaloguj sie ponownie, aby odzyskac dostep.
              </div>
            ) : null}

            {errorMessage ? (
              <div className="rounded-[4px] border border-rose-200 bg-rose-50 px-4 py-3 text-[14px] text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="font-['Space_Grotesk'] text-[12px] uppercase tracking-[0.12em] text-[#8b7564]">
                  Email / Login
                </span>
                <span className="relative block">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#8b7564]">
                    alternate_email
                  </span>
                  <input
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="w-full rounded-[4px] border border-[#e3c6ae] bg-[#fff1e9] py-3 pl-10 pr-4 text-[16px] text-[color:var(--hp-text)] outline-none transition focus:border-[color:var(--hp-accent-strong)] focus:ring-2 focus:ring-[rgba(141,75,0,0.12)]"
                    placeholder="admin@infra.local"
                  />
                </span>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="flex items-center justify-between gap-4">
                  <span className="font-['Space_Grotesk'] text-[12px] uppercase tracking-[0.12em] text-[#8b7564]">
                    Password
                  </span>
                  <span className="text-[13px] text-[color:var(--hp-accent-strong)] hover:underline">
                    Forgot Access?
                  </span>
                </span>
                <span className="relative block">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#8b7564]">
                    key
                  </span>
                  <input
                    required
                    minLength={8}
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-[4px] border border-[#e3c6ae] bg-[#fff1e9] py-3 pl-10 pr-4 text-[16px] text-[color:var(--hp-text)] outline-none transition focus:border-[color:var(--hp-accent-strong)] focus:ring-2 focus:ring-[rgba(141,75,0,0.12)]"
                    placeholder="••••••••••••"
                  />
                </span>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full rounded-[4px] border-none bg-[color:var(--hp-accent-strong)] py-4 font-medium uppercase tracking-[0.2em] hover:bg-[#8d4b00]"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Autoryzacja...' : 'Zaloguj'}
              <span className="material-symbols-outlined ml-2 text-[18px]">login</span>
            </Button>
          </form>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e3c6ae] bg-[#f7e5d9] px-6 py-3">
            <MetaPill icon="verified_user" tone="text-[color:var(--hp-accent-strong)]">
              Admin access: secured
            </MetaPill>
            <MetaPill icon="encrypted" tone="text-[#006096]">
              Session: encrypted
            </MetaPill>
          </footer>
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            className="group inline-flex items-center gap-3 rounded-full border border-[#dbc2b0] bg-white/70 px-4 py-2 shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition hover:bg-white"
            onClick={() => window.open(`${apiBaseUrl}/health`, '_blank', 'noopener,noreferrer')}
          >
            <ApiStatusDot status={apiStatus} />
            <span className="font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.08em] text-[#554336] sm:text-[12px]">
              Status API: {apiStatus === 'checking' ? 'Checking' : apiStatus === 'healthy' ? 'Online' : 'Offline'}
            </span>
            <span className="material-symbols-outlined text-[14px] text-[#c3a58d] transition group-hover:text-[color:var(--hp-accent-strong)]">
              arrow_forward
            </span>
          </button>

          <p className="px-4 text-center text-[11px] leading-6 text-[#a08f80] sm:text-[12px]">
            Authorized use only. All activities are monitored and logged.
            <br />
            Control Plane Version 4.8.2-stable
          </p>
        </div>
      </main>
    </div>
  )
}

function ApiStatusDot({ status }: { status: ApiHealthStatus }) {
  if (status === 'checking') {
    return (
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
      </span>
    )
  }

  if (status === 'healthy') {
    return (
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
    )
  }

  return <span className="inline-flex h-2 w-2 rounded-full bg-rose-500" />
}

function MetaPill({
  children,
  icon,
  tone,
}: {
  children: string
  icon: string
  tone: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`material-symbols-outlined text-[14px] ${tone}`}
        style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
      >
        {icon}
      </span>
      <span className="font-['Space_Grotesk'] text-[10px] uppercase tracking-[0.04em] text-[#554336] sm:text-[11px]">
        {children}
      </span>
    </div>
  )
}
