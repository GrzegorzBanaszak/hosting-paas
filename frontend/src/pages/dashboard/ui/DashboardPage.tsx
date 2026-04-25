import { Badge } from '../../../shared/ui/Badge'
import { Button } from '../../../shared/ui/Button'
import { Card, CardContent, CardHeader } from '../../../shared/ui/Card'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { useToast } from '../../../widgets/toaster/ui/ToastContext'

const stats = [
  { label: 'Total apps', value: '24', accent: 'success' as const, detail: '+2', icon: 'apps' },
  { label: 'Active deployments', value: '3', accent: 'warning' as const, detail: '', icon: 'rocket_launch' },
  { label: 'API latency', value: '42', accent: 'default' as const, detail: 'ms   p95', icon: 'speed' },
  { label: 'System health', value: '99.9', accent: 'success' as const, detail: '%', icon: 'monitor_heart' },
]

const deployments = [
  {
    app: 'payment-service',
    prefix: 'API',
    commit: '#a1b2c3d',
    branch: 'main',
    status: 'Building',
    tone: 'warning' as const,
    time: '2m ago',
    prefixClass: 'bg-amber-100 text-amber-700',
  },
  {
    app: 'dashboard-ui',
    prefix: 'WEB',
    commit: '#e4f5g6h',
    branch: 'staging',
    status: 'Success',
    tone: 'success' as const,
    time: '15m ago',
    prefixClass: 'bg-indigo-100 text-indigo-700',
  },
  {
    app: 'data-processor',
    prefix: 'WRK',
    commit: '#j7k8l9m',
    branch: 'main',
    status: 'Success',
    tone: 'success' as const,
    time: '1h ago',
    prefixClass: 'bg-slate-100 text-slate-700',
  },
]

const alerts = [
  {
    title: 'Database Connection High Latency',
    detail: 'Primary DB cluster showing >500ms latency spikes in us-east-1.',
    tone: 'danger' as const,
  },
  {
    title: 'Memory Usage Warning',
    detail: "Worker node pool 'data-crunchers' at 85% capacity.",
    tone: 'warning' as const,
  },
]

const activity = [
  'User admin deployed payment-service',
  'Repo sync successful for dashboard-ui',
  'Environment variables updated by User jane.doe',
]

const regions = [
  { name: 'us-east-1', cpu: 42, tone: 'bg-emerald-500' },
  { name: 'eu-west-1', cpu: 68, tone: 'bg-amber-500' },
  { name: 'ap-south-1', cpu: 21, tone: 'bg-emerald-500' },
]

export function DashboardPage() {
  const { pushToast } = useToast()

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Control Plane"
        title="Dashboard"
        description="Glowny shell panelu administracyjnego gotowy pod dane runtime, healthcheck i kolejne moduly."
        actions={
          <Button
            onClick={() =>
              pushToast({
                title: 'Powiadomienie testowe',
                description: 'System toastow jest gotowy do podpiecia pod akcje i odpowiedzi API.',
                tone: 'success',
              })
            }
          >
            <span className="material-symbols-outlined mr-2 text-[18px]">add</span>
            Deploy New App
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="mb-6 flex items-start justify-between">
                <h2 className="font-['Space_Grotesk'] text-[12px] uppercase tracking-[0.12em] text-[color:var(--hp-text-subtle)]">
                  {stat.label}
                </h2>
                <span
                  className={`material-symbols-outlined ${
                    stat.accent === 'success'
                      ? 'text-emerald-500'
                      : stat.accent === 'warning'
                        ? 'text-amber-500'
                        : 'text-slate-400'
                  }`}
                >
                  {stat.icon}
                </span>
              </div>
              <div className="flex items-end gap-3">
                <div className="text-[44px] leading-none font-bold tracking-[-0.04em] text-slate-900">
                  {stat.value}
                </div>
                {stat.detail ? (
                  <div
                    className={`pb-1 text-[14px] font-medium ${
                      stat.accent === 'success'
                        ? 'text-emerald-600'
                        : 'text-[color:var(--hp-text-subtle)]'
                    }`}
                  >
                    {stat.detail}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Card>
            <CardHeader
              title="Active Deployments"
              action={<Button kind="ghost">View All</Button>}
            />
            <CardContent className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-[14px]">
                  <thead className="bg-white text-[color:var(--hp-text-subtle)]">
                    <tr>
                      <th className="px-5 py-4 font-['Space_Grotesk'] font-medium uppercase tracking-[0.12em]">
                        App / Commit
                      </th>
                      <th className="px-5 py-4 font-['Space_Grotesk'] font-medium uppercase tracking-[0.12em]">
                        Branch
                      </th>
                      <th className="px-5 py-4 font-['Space_Grotesk'] font-medium uppercase tracking-[0.12em]">
                        Status
                      </th>
                      <th className="px-5 py-4 text-right font-['Space_Grotesk'] font-medium uppercase tracking-[0.12em]">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {deployments.map((deployment, index) => (
                      <tr
                        key={deployment.app}
                        className={`border-t border-[color:var(--hp-border)] ${
                          index % 2 === 1 ? 'bg-[color:var(--hp-surface-strong)]' : 'bg-white'
                        } hover:bg-slate-50`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-[4px] font-['Space_Grotesk'] text-xs font-bold uppercase ${deployment.prefixClass}`}
                            >
                              {deployment.prefix}
                            </div>
                            <div>
                              <div className="text-[14px] font-medium">{deployment.app}</div>
                              <div className="text-[13px] text-[color:var(--hp-text-muted)]">
                                {deployment.commit}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 rounded-[4px] bg-slate-100 px-2 py-1 font-['Space_Grotesk'] text-[12px] text-slate-700">
                            <span className="material-symbols-outlined text-[14px]">
                              call_split
                            </span>
                            {deployment.branch}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={deployment.tone}>{deployment.status}</Badge>
                        </td>
                        <td className="px-5 py-4 text-right text-[color:var(--hp-text-muted)]">
                          {deployment.time}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Platform Health" />
            <CardContent className="grid gap-4 md:grid-cols-3">
              {regions.map((region) => (
                <div
                  key={region.name}
                  className="rounded-lg border border-[color:var(--hp-border)] bg-[color:var(--hp-surface-strong)] p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-[14px] font-medium">{region.name}</span>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <span className="text-[color:var(--hp-text-muted)]">CPU</span>
                    <span className="font-medium text-[color:var(--hp-text-subtle)]">
                      {region.cpu}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-200">
                    <div
                      className={`h-1.5 rounded-full ${region.tone}`}
                      style={{ width: `${region.cpu}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <Card>
            <CardHeader
              title="Alerts"
              action={
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-600">
                  1
                </span>
              }
            />
            <CardContent className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.title}
                  className="rounded-[6px] border p-4"
                  style={{
                    borderColor: alert.tone === 'danger' ? '#fecaca' : '#fde68a',
                    backgroundColor:
                      alert.tone === 'danger' ? '#fff1f2' : '#fffbeb',
                  }}
                >
                  <div className="flex gap-3">
                    <span
                      className={`material-symbols-outlined shrink-0 ${
                        alert.tone === 'danger' ? 'text-red-500' : 'text-amber-500'
                      }`}
                    >
                      {alert.tone === 'danger' ? 'error' : 'warning'}
                    </span>
                    <div>
                      <h3 className="text-[14px] font-medium">{alert.title}</h3>
                      <p className="mt-2 text-[14px] text-[color:var(--hp-text-subtle)]">
                        {alert.detail}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="min-h-[394px]">
            <CardHeader title="Activity Log" />
            <CardContent>
              <div className="relative ml-4 border-l border-[color:var(--hp-border)]">
                {activity.map((entry, index) => (
                  <div key={entry} className="relative pl-7 pb-8 last:pb-0">
                    <div
                      className={`absolute -left-[6px] top-1 h-3 w-3 rounded-full ${
                        index === 0
                          ? 'bg-[color:var(--hp-accent)]'
                          : index === 1
                            ? 'bg-emerald-500'
                            : 'bg-slate-400'
                      }`}
                    />
                    <div>
                      <p className="text-[14px]">{entry}</p>
                      <p className="mt-2 text-[13px] text-[color:var(--hp-text-muted)]">
                        {index === 0
                          ? '2 mins ago'
                          : index === 1
                            ? '15 mins ago'
                            : '1 hour ago'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card>
        <CardHeader
          title="Foundation Hooks"
          subtitle="Wspolne komponenty sa gotowe pod loadingi, bledy i puste stany z kolejnych etapow."
        />
        <CardContent>
          <EmptyState
            title="Brak jeszcze danych z backendu"
            description="Etap 2 zamyka shell aplikacji. W Etapie 3 i 4 mozna bezpiecznie podpinac sesje, dashboard i globalna obsluge API."
            action={<Button kind="secondary">Preview API integration</Button>}
          />
        </CardContent>
      </Card>
    </div>
  )
}
