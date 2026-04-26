import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { RouterLink, useRouter } from '../../../app/router'
import { deleteApp, fetchAppById } from '../../../features/apps/api/appsApi'
import type { AppItem } from '../../../features/apps/model/types'
import { Button } from '../../../shared/ui/Button'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { useToast } from '../../../widgets/toaster/ui/ToastContext'
import {
  buildDeploymentRows,
  DataTable,
  DetailPanel,
  getBranchLabel,
  getEnvironmentLabel,
  getErrorMessage,
  getRepositoryLabel,
  getRuntimeLabel,
  ListMessage,
  SectionTitle,
  StatusPill,
} from './appsShared'

export function AppDetailsPage() {
  const { currentPath, navigate } = useRouter()
  const { pushToast } = useToast()
  const appId = useMemo(() => decodeURIComponent(currentPath.split('/')[2] ?? ''), [currentPath])
  const [app, setApp] = useState<AppItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let isActive = true

    async function loadDetail() {
      if (!appId) {
        setApp(null)
        setError('Brak identyfikatora aplikacji w adresie.')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetchAppById(appId)

        if (!isActive) {
          return
        }

        setApp(response)
      } catch (loadError) {
        if (!isActive) {
          return
        }

        setError(getErrorMessage(loadError))
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadDetail()

    return () => {
      isActive = false
    }
  }, [appId, reloadToken])

  async function handleDelete() {
    if (!app || isDeleting) {
      return
    }

    const confirmed = window.confirm(`Usunac aplikacje "${app.name}"?`)

    if (!confirmed) {
      return
    }

    setIsDeleting(true)

    try {
      await deleteApp(app.id)

      pushToast({
        title: 'Aplikacja usunieta',
        description: `${app.name} zostala usunieta z control plane.`,
        tone: 'success',
      })

      navigate('/apps')
    } catch (deleteError) {
      pushToast({
        title: 'Nie udalo sie usunac aplikacji',
        description: getErrorMessage(deleteError),
        tone: 'danger',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <ListMessage
        title="Ladowanie szczegolow"
        description="Pobieram najnowszy snapshot aplikacji i buduje ekran overview."
      />
    )
  }

  if (error) {
    return <ListMessage title="Nie udalo sie pobrac szczegolow" description={error} tone="danger" />
  }

  if (!app) {
    return (
      <EmptyState
        title="Brak danych aplikacji"
        description="Nie udalo sie odczytac rekordu wskazanego w adresie."
      />
    )
  }

  const deploymentRows = buildDeploymentRows(app)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="font-['Space_Grotesk'] text-[13px] uppercase tracking-[0.14em] text-[color:var(--hp-text-muted)]">
              Apps / {getEnvironmentLabel(app).toUpperCase()}
            </div>
            <StatusPill status={app.status} />
          </div>

          <SectionTitle
            eyebrow=""
            title={app.name}
            description={`${app.primaryHostname ?? 'us-east-1 (N. Virginia)'} • Cluster: ${app.slug}-v4`}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <RouterLink
            href={`/apps/${app.id}/edit`}
            className="inline-flex items-center justify-center rounded-[var(--hp-radius-sm)] border border-[rgba(219,194,176,0.75)] bg-white px-5 py-3 font-['Space_Grotesk'] text-[12px] font-bold uppercase tracking-[0.14em] transition hover:bg-[color:var(--hp-accent-soft)]"
          >
            <span className="material-symbols-outlined mr-2 text-[18px]">edit</span>
            Edit
          </RouterLink>
          <ActionButton icon="cached" label="Redeploy" />
          <ActionButton icon="restart_alt" label="Restart" />
          <ActionButton icon="stop" label="Stop" />
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center justify-center rounded-[var(--hp-radius-sm)] border border-rose-200 bg-white px-5 py-3 font-['Space_Grotesk'] text-[12px] font-bold uppercase tracking-[0.14em] text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined mr-2 text-[18px]">delete</span>
            {isDeleting ? 'Deleting' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-[rgba(219,194,176,0.75)]">
        {['Overview', 'Deployments', 'Runtime', 'Repository', 'Domains', 'Env Vars', 'Logs'].map(
          (tab, index) => (
            <button
              key={tab}
              type="button"
              className={`border-b-2 px-6 py-4 font-['Space_Grotesk'] text-[12px] uppercase tracking-[0.14em] ${
                index === 0
                  ? 'border-[color:var(--hp-accent-strong)] text-[color:var(--hp-accent-strong)]'
                  : 'border-transparent text-[color:var(--hp-text-muted)]'
              }`}
            >
              {tab}
            </button>
          ),
        )}
      </div>

      <section className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="overflow-hidden rounded-[var(--hp-radius-sm)] border border-[rgba(219,194,176,0.75)] bg-white shadow-[var(--hp-shadow)]">
          <div className="flex items-center justify-between border-b border-[rgba(219,194,176,0.75)] bg-[rgba(255,241,233,0.35)] px-6 py-4">
            <div className="font-['Space_Grotesk'] text-[14px] uppercase tracking-[0.14em] text-[color:var(--hp-text)]">
              Live Health Metrics
            </div>
            <div className="font-mono text-[12px] text-[color:var(--hp-text-muted)]">Interval: 1m</div>
          </div>

          <div className="grid md:grid-cols-3 md:divide-x md:divide-[rgba(219,194,176,0.75)]">
            <MetricPod
              label="CPU Usage"
              value={`${Math.max(8, app.deploymentCount * 7.1).toFixed(1)}%`}
              detail="down 2%"
              detailClassName="text-emerald-600"
              chart={<CpuBars />}
            />
            <MetricPod
              label="Memory"
              value={`${Math.max(256, app.domainCount * 256 + 256)} MB`}
              detail="/ 2048 MB"
              detailClassName="text-[color:var(--hp-text-muted)]"
              chart={<MemoryBar progress={Math.min(85, 20 + app.domainCount * 14)} />}
            />
            <MetricPod
              label="HTTP Requests"
              value={`${Math.max(1.2, app.deploymentCount * 0.6).toFixed(1)}k`}
              detail="req/sec"
              detailClassName="text-[color:var(--hp-text-muted)]"
              chart={<RequestWave />}
            />
          </div>
        </div>

        <div className="space-y-8">
          <InfoCard title="Basic Info">
            <DetailPanel label="APP ID" value={app.id} />
            <DetailPanel label="Runtime" value={`${getRuntimeLabel(app)} (LTS)`} />
            <DetailPanel label="Plan" value={app.hasRepository ? 'Enterprise Pod' : 'Starter Pod'} />
          </InfoCard>

          <InfoCard title="Repo Info">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[4px] border border-[rgba(219,194,176,0.75)] bg-[color:var(--hp-surface-strong)]">
                <span className="material-symbols-outlined text-[22px] text-[color:var(--hp-text-subtle)]">
                  code
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold text-[color:var(--hp-accent-strong)]">
                  {getRepositoryLabel(app)}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-[color:var(--hp-text-muted)]">
                  <span className="material-symbols-outlined text-[16px]">account_tree</span>
                  <span>{getBranchLabel(app)}</span>
                  <span className="h-1 w-1 rounded-full bg-[color:var(--hp-text-muted)]" />
                  <span>#{app.id.slice(0, 7)}</span>
                </div>
              </div>
            </div>
            <RouterLink
              href={`/apps/${app.id}/edit`}
              className="mt-5 inline-flex w-full items-center justify-center rounded-[var(--hp-radius-sm)] border border-[rgba(219,194,176,0.75)] px-4 py-3 font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.12em] transition hover:bg-[color:var(--hp-accent-soft)]"
            >
              Change Repository
            </RouterLink>
          </InfoCard>
        </div>
      </section>

      <DataTable
        columns={['Deployment ID', 'Commit', 'Status', 'Triggered By', 'Date', '']}
        footer={
          <>
            <div className="font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.12em] text-[color:var(--hp-accent-strong)]">
              View all
            </div>
            <Button kind="secondary" onClick={() => setReloadToken((value) => value + 1)}>
              Refresh
            </Button>
          </>
        }
      >
        {deploymentRows.map((row, index) => (
          <tr key={row.id} className={index % 2 === 1 ? 'bg-[rgba(251,249,246,0.8)]' : ''}>
            <td className="px-8 py-5 font-mono text-[14px]">{row.id}</td>
            <td className="px-8 py-5 font-mono text-[14px] text-[color:var(--hp-accent-strong)]">
              {row.commit}
            </td>
            <td className="px-8 py-5">
              <span
                className={`inline-flex items-center gap-2 font-['Space_Grotesk'] text-[12px] font-bold uppercase tracking-[0.1em] ${
                  row.status === 'Succeeded' ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    row.status === 'Succeeded' ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                />
                {row.status}
              </span>
            </td>
            <td className="px-8 py-5 text-[15px]">{row.triggeredBy}</td>
            <td className="px-8 py-5 text-[15px] text-[color:var(--hp-text-muted)]">{row.date}</td>
            <td className="px-8 py-5 text-right text-[color:var(--hp-text-muted)]">
              <span className="material-symbols-outlined text-[18px]">more_vert</span>
            </td>
          </tr>
        ))}
      </DataTable>

      <div className="fixed bottom-6 right-6 hidden items-center gap-3 rounded-full border border-white/10 bg-[color:var(--hp-text)] px-5 py-3 text-white shadow-[var(--hp-shadow-overlay)] xl:flex">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em]">
          System Stable: 99.9% Uptime
        </span>
      </div>
    </div>
  )
}

function ActionButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center rounded-[var(--hp-radius-sm)] border border-[rgba(219,194,176,0.75)] bg-white px-5 py-3 font-['Space_Grotesk'] text-[12px] font-bold uppercase tracking-[0.14em] transition hover:bg-[color:var(--hp-accent-soft)]"
    >
      <span className="material-symbols-outlined mr-2 text-[18px]">{icon}</span>
      {label}
    </button>
  )
}

function MetricPod({
  label,
  value,
  detail,
  detailClassName,
  chart,
}: {
  label: string
  value: string
  detail: string
  detailClassName: string
  chart: ReactNode
}) {
  return (
    <div className="p-6">
      <div className="font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.12em] text-[color:var(--hp-text-muted)]">
        {label}
      </div>
      <div className="mt-3 flex items-baseline gap-3">
        <span className="text-[22px] font-semibold tracking-[-0.03em]">{value}</span>
        <span className={`text-[13px] ${detailClassName}`}>{detail}</span>
      </div>
      <div className="mt-5">{chart}</div>
    </div>
  )
}

function CpuBars() {
  return (
    <div className="flex h-16 items-end gap-1 rounded-[4px] bg-[rgba(251,249,246,0.85)] p-2">
      {[25, 48, 72, 35, 92, 64].map((height, index) => (
        <div
          key={height}
          className={`flex-1 rounded-[2px] ${index > 3 ? 'bg-amber-400' : 'bg-amber-200'}`}
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  )
}

function MemoryBar({ progress }: { progress: number }) {
  return (
    <div className="flex h-16 items-center px-2">
      <div className="h-3 w-full overflow-hidden rounded-full bg-[rgba(241,245,249,0.9)]">
        <div
          className="h-full rounded-full bg-[color:var(--hp-accent-strong)]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

function RequestWave() {
  return (
    <svg viewBox="0 0 300 60" className="h-16 w-full overflow-visible">
      <path
        d="M0 34 Q 35 12, 70 35 T 140 24 T 210 36 T 300 12"
        fill="none"
        stroke="#d97706"
        strokeWidth="3"
      />
    </svg>
  )
}

function InfoCard({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-[var(--hp-radius-sm)] border border-[rgba(219,194,176,0.75)] bg-white shadow-[var(--hp-shadow)]">
      <div className="border-b border-[rgba(219,194,176,0.75)] bg-[rgba(255,241,233,0.35)] px-6 py-4">
        <div className="font-['Space_Grotesk'] text-[14px] uppercase tracking-[0.14em] text-[color:var(--hp-text)]">
          {title}
        </div>
      </div>
      <div className="space-y-6 p-6">{children}</div>
    </section>
  )
}
