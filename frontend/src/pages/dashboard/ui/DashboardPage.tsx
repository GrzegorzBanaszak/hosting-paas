import { useAuth } from '../../../features/auth/ui/AuthContext'
import { useApiHealth } from '../../../shared/api/useApiHealth'
import { apiBaseUrl } from '../../../shared/config/api'
import { Badge } from '../../../shared/ui/Badge'
import { Button } from '../../../shared/ui/Button'
import { Card, CardContent, CardHeader } from '../../../shared/ui/Card'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { useToast } from '../../../widgets/toaster/ui/ToastContext'

const overviewCards = [
  {
    title: 'Panel status',
    value: 'Etap 4',
    detail: 'Dashboard platformy jest gotowy na dane runtime i metryki z API.',
    icon: 'space_dashboard',
  },
  {
    title: 'Dostepne moduly',
    value: '6',
    detail: 'Apps, repos, deployments, runtime, env vars i domains maja juz miejsce w shellu.',
    icon: 'widgets',
  },
  {
    title: 'Tryb pracy',
    value: 'Admin',
    detail: 'Widok korzysta z sesji operatora i statusu healthcheck.',
    icon: 'admin_panel_settings',
  },
]

const recentActivity = [
  {
    title: 'Dashboard bootstrap zakonczony',
    detail: 'Widok startowy panelu prezentuje status API i sekcje pod kolejne moduly.',
    time: 'Teraz',
    icon: 'dashboard',
    tone: 'bg-[color:var(--hp-accent)]',
  },
  {
    title: 'Routing do modulow zostal przygotowany',
    detail: 'Placeholdery dla aplikacji, runtime, deploymentow i domen sa aktywne w shellu.',
    time: 'Etap 2-3',
    icon: 'route',
    tone: 'bg-emerald-500',
  },
  {
    title: 'Sesja administratora jest podlaczona',
    detail: 'Topbar i dashboard korzystaja z aktualnej sesji oraz obslugi wygasniecia tokenu.',
    time: 'Etap 3',
    icon: 'badge',
    tone: 'bg-slate-500',
  },
]

const metricPlaceholders = [
  {
    title: 'Aplikacje',
    description: 'Tutaj pojawi sie liczba wszystkich aplikacji, ich status i trendy zmian.',
    icon: 'apps',
  },
  {
    title: 'Deploymenty',
    description: 'Sekcja przewiduje aktywne wdrozenia, ostatnie bledy i czas wykonania.',
    icon: 'rocket_launch',
  },
  {
    title: 'Runtime',
    description: 'Miejsce na healthcheck instancji, start/stop/restart i ostatni znany stan.',
    icon: 'memory',
  },
]

const moduleBacklog = [
  {
    title: 'Lista aplikacji',
    stage: 'Etap 5',
    detail: 'Dashboard ma juz miejsce na przyszle metryki listy aplikacji i statusy operacyjne.',
  },
  {
    title: 'Integracja GitHub',
    stage: 'Etap 6',
    detail: 'Dojdzie konfiguracja repozytorium, brancha deployujacego i webhookow.',
  },
  {
    title: 'Deploymenty i logi',
    stage: 'Etap 7',
    detail: 'Sekcja aktywnosci zostanie rozszerzona o realne wdrozenia i historie wykonania.',
  },
  {
    title: 'Sekrety i domeny',
    stage: 'Etap 9-10',
    detail: 'Puste stany sygnalizuja miejsce pod env vars, sekrety i routing domen.',
  },
]

function getApiBadgeTone(status: ReturnType<typeof useApiHealth>) {
  if (status === 'healthy') {
    return 'success' as const
  }

  if (status === 'checking') {
    return 'warning' as const
  }

  return 'danger' as const
}

function formatSessionExpiry(expiresAtUtc: string | undefined) {
  if (!expiresAtUtc) {
    return 'Brak danych'
  }

  const parsed = new Date(expiresAtUtc)

  if (Number.isNaN(parsed.getTime())) {
    return 'Brak danych'
  }

  return parsed.toLocaleString('pl-PL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function DashboardPage() {
  const { pushToast } = useToast()
  const { session } = useAuth()
  const apiHealth = useApiHealth()
  const displayName = session?.user.displayName ?? session?.user.username ?? 'Administrator'
  const apiStatusLabel =
    apiHealth === 'healthy' ? 'Healthy' : apiHealth === 'checking' ? 'Checking' : 'Offline'

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Control Plane"
        title="Dashboard"
        description="Widok startowy panelu administracyjnego pokazuje kondycje platformy, status API i gotowe miejsca pod kolejne moduly produktowe."
        actions={
          <>
            <Button kind="secondary" onClick={() => window.location.reload()}>
              <span className="material-symbols-outlined mr-2 text-[18px]">refresh</span>
              Odswiez panel
            </Button>
            <Button
              onClick={() =>
                pushToast({
                  title: 'Metryki jeszcze niepodlaczone',
                  description:
                    'Etap 4 przygotowuje uklad dashboardu. Realne dane dla aplikacji i deploymentow dojda w kolejnych etapach.',
                })
              }
            >
              <span className="material-symbols-outlined mr-2 text-[18px]">monitoring</span>
              Podejrzyj metryki
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="xl:col-span-1">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-['Space_Grotesk'] text-[12px] uppercase tracking-[0.12em] text-[color:var(--hp-text-muted)]">
                  API healthcheck
                </div>
                <div className="mt-2 text-[30px] font-bold tracking-[-0.04em] text-slate-900">
                  {apiStatusLabel}
                </div>
              </div>
              <span
                className={`material-symbols-outlined text-[28px] ${
                  apiHealth === 'healthy'
                    ? 'text-emerald-600'
                    : apiHealth === 'checking'
                      ? 'text-blue-600'
                      : 'text-rose-600'
                }`}
              >
                monitor_heart
              </span>
            </div>
            <Badge tone={getApiBadgeTone(apiHealth)}>Health: {apiStatusLabel}</Badge>
            <p className="text-[14px] leading-6 text-[color:var(--hp-text-muted)]">
              Endpoint healthcheck jest odpytywany cyklicznie przez frontend i zasila
              status w topbarze oraz na dashboardzie.
            </p>
          </CardContent>
        </Card>

        {overviewCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-5">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="font-['Space_Grotesk'] text-[12px] uppercase tracking-[0.12em] text-[color:var(--hp-text-muted)]">
                  {card.title}
                </div>
                <span className="material-symbols-outlined text-[24px] text-[color:var(--hp-accent)]">
                  {card.icon}
                </span>
              </div>
              <div className="text-[34px] leading-none font-bold tracking-[-0.04em] text-slate-900">
                {card.value}
              </div>
              <p className="mt-4 text-[14px] leading-6 text-[color:var(--hp-text-muted)]">
                {card.detail}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <Card>
            <CardHeader
              title="Podstawowe informacje o platformie"
              subtitle="Dashboard korzysta z obecnych danych sesji i konfiguracji frontendu."
            />
            <CardContent className="grid gap-4 md:grid-cols-2">
              <PlatformInfoRow label="Srodowisko" value="Production" icon="cloud_done" />
              <PlatformInfoRow label="Baza API" value={apiBaseUrl} icon="lan" />
              <PlatformInfoRow label="Operator" value={displayName} icon="person" />
              <PlatformInfoRow
                label="Rola"
                value={session?.user.role ?? 'Brak sesji'}
                icon="verified_user"
              />
              <PlatformInfoRow
                label="Sesja wazna do"
                value={formatSessionExpiry(session?.expiresAtUtc)}
                icon="schedule"
              />
              <PlatformInfoRow label="Klient" value={window.navigator.platform} icon="devices" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Miejsce na metryki aplikacji i deploymentow"
              subtitle="Sekcja jest gotowa pod realne agregaty z backendu i telemetry."
            />
            <CardContent className="grid gap-4 md:grid-cols-3">
              {metricPlaceholders.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[var(--hp-radius-md)] border border-dashed border-[color:var(--hp-border-strong)] bg-[color:var(--hp-surface-strong)] p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[color:var(--hp-accent)]">
                      {item.icon}
                    </span>
                    <h3 className="text-[15px] font-semibold">{item.title}</h3>
                  </div>
                  <p className="mt-3 text-[14px] leading-6 text-[color:var(--hp-text-muted)]">
                    {item.description}
                  </p>
                  <div className="mt-4 h-2 rounded-full bg-slate-200">
                    <div className="h-2 w-1/3 rounded-full bg-[color:var(--hp-accent)] opacity-40" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Niegotowe moduly"
              subtitle="Puste stany prowadza kolejne etapy implementacji bez udawania danych runtime."
            />
            <CardContent>
              <EmptyState
                title="Realne metryki i aktywnosc pojawia sie w kolejnych etapach"
                description="Dashboard celowo nie symuluje backendu. Zamiast tego przygotowuje stabilny uklad pod dane aplikacji, deploymentow, env vars i domen."
                action={
                  <Button
                    kind="secondary"
                    onClick={() =>
                      pushToast({
                        title: 'Backlog dashboardu',
                        description:
                          'Nastepne etapy podpina lista aplikacji, deploymenty, runtime oraz konfiguracje domen i sekretow.',
                      })
                    }
                  >
                    Zobacz zakres dalszych prac
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-5">
          <Card>
            <CardHeader title="Ostatnia aktywnosc" />
            <CardContent>
              <div className="relative ml-3 border-l border-[color:var(--hp-border)]">
                {recentActivity.map((item) => (
                  <div key={item.title} className="relative pb-6 pl-6 last:pb-0">
                    <div
                      className={`absolute -left-[7px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full ${item.tone}`}
                    />
                    <div className="rounded-[var(--hp-radius-sm)] bg-[color:var(--hp-surface-strong)] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="material-symbols-outlined text-[color:var(--hp-accent)]">
                            {item.icon}
                          </span>
                          <div>
                            <div className="text-[15px] font-semibold">{item.title}</div>
                            <p className="mt-1 text-[14px] leading-6 text-[color:var(--hp-text-muted)]">
                              {item.detail}
                            </p>
                          </div>
                        </div>
                        <span className="whitespace-nowrap text-[12px] font-medium text-[color:var(--hp-text-muted)]">
                          {item.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Backlog modulow"
              subtitle="Dashboard sygnalizuje kolejne obszary produktu."
            />
            <CardContent className="space-y-3">
              {moduleBacklog.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[var(--hp-radius-md)] border border-[color:var(--hp-border)] bg-[color:var(--hp-surface-strong)] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[15px] font-semibold">{item.title}</h3>
                    <span className="rounded-full bg-[color:var(--hp-accent-soft)] px-3 py-1 font-['Space_Grotesk'] text-[12px] font-medium text-[color:var(--hp-accent)]">
                      {item.stage}
                    </span>
                  </div>
                  <p className="mt-2 text-[14px] leading-6 text-[color:var(--hp-text-muted)]">
                    {item.detail}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

function PlatformInfoRow({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: string
}) {
  return (
    <div className="rounded-[var(--hp-radius-md)] border border-[color:var(--hp-border)] bg-[color:var(--hp-surface-strong)] p-4">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-[color:var(--hp-accent)]">{icon}</span>
        <div className="font-['Space_Grotesk'] text-[12px] uppercase tracking-[0.12em] text-[color:var(--hp-text-muted)]">
          {label}
        </div>
      </div>
      <div className="mt-3 break-all text-[15px] font-semibold leading-6 text-[color:var(--hp-text-subtle)]">
        {value}
      </div>
    </div>
  )
}
