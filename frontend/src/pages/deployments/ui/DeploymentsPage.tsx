import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { RouterLink } from '../../../app/router'
import { fetchApps } from '../../../features/apps/api/appsApi'
import type { AppItem } from '../../../features/apps/model/types'
import { fetchDeploymentHistory } from '../../../features/repositories/api/repositoriesApi'
import type { DeploymentHistoryItem } from '../../../features/repositories/model/types'
import { Button } from '../../../shared/ui/Button'
import { EmptyState } from '../../../shared/ui/EmptyState'
import {
  DataTable,
  ListMessage,
  MetricCard,
  SectionTitle,
  formatCommitSha,
  formatDeploymentDate,
} from '../../apps/ui/appsShared'

type DeploymentRecord = {
  app: AppItem
  deployment: DeploymentHistoryItem
}

type StatusFilter = 'all' | 'Queued' | 'Running' | 'Succeeded' | 'Failed' | 'Cancelled'
type TriggerFilter = 'all' | 'Push' | 'Manual' | 'Redeploy'

export function DeploymentsPage() {
  const [apps, setApps] = useState<AppItem[]>([])
  const [records, setRecords] = useState<DeploymentRecord[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [triggerFilter, setTriggerFilter] = useState<TriggerFilter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    async function loadData() {
      setIsLoading(true)
      setError(null)

      try {
        const appItems = await fetchApps()

        if (!isActive) {
          return
        }

        setApps(appItems)

        const deploymentEntries = await Promise.all(
          appItems.map(async (app) => {
            try {
              const deployments = await fetchDeploymentHistory(app.id)
              return deployments.map((deployment) => ({ app, deployment }))
            } catch {
              return [] as DeploymentRecord[]
            }
          }),
        )

        if (!isActive) {
          return
        }

        setRecords(
          deploymentEntries
            .flat()
            .sort(
              (left, right) =>
                new Date(right.deployment.createdAtUtc).getTime() -
                new Date(left.deployment.createdAtUtc).getTime(),
            ),
        )
      } catch (loadError) {
        if (!isActive) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : 'Wystapil nieoczekiwany blad.')
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      isActive = false
    }
  }, [])

  const filteredRecords = useMemo(() => {
    return records.filter(({ deployment }) => {
      const matchesStatus = statusFilter === 'all' || deployment.status === statusFilter
      const matchesTrigger = triggerFilter === 'all' || deployment.trigger === triggerFilter
      return matchesStatus && matchesTrigger
    })
  }, [records, statusFilter, triggerFilter])

  const metrics = useMemo(() => {
    const queued = records.filter((item) => item.deployment.status === 'Queued').length
    const running = records.filter((item) => item.deployment.status === 'Running').length
    const failed = records.filter((item) => item.deployment.status === 'Failed').length

    return {
      total: records.length,
      queued,
      running,
      failed,
    }
  }, [records])

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <SectionTitle
          eyebrow="Control Plane /"
          title="Deployments"
          description="Operational view of deployment executions across all apps, with real status, trigger, stage and commit metadata."
        />

        <div className="flex flex-wrap gap-3">
          <Button kind="secondary" onClick={() => window.location.reload()}>
            <span className="material-symbols-outlined mr-2 text-[18px]">refresh</span>
            Refresh
          </Button>
          <RouterLink
            href="/apps"
            className="inline-flex items-center justify-center rounded-[var(--hp-radius-sm)] border border-transparent bg-[color:var(--hp-accent-strong)] px-6 py-3 font-['Space_Grotesk'] text-[12px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[color:var(--hp-accent)]"
          >
            <span className="material-symbols-outlined mr-2 text-[18px]">apps</span>
            Open Apps
          </RouterLink>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-4">
        <MetricCard label="Deployments" value={String(metrics.total)} detail="tracked records" icon="rocket_launch" />
        <MetricCard label="Queued" value={String(metrics.queued)} detail="waiting in queue" icon="schedule" accent="text-amber-600" />
        <MetricCard label="Running" value={String(metrics.running)} detail="currently executing" icon="play_circle" accent="text-sky-600" />
        <MetricCard label="Failed" value={String(metrics.failed)} detail="require inspection" icon="error" accent="text-rose-600" />
      </section>

      <section className="flex flex-wrap items-center gap-5 border border-[rgba(219,194,176,0.75)] bg-[rgba(255,255,255,0.55)] px-6 py-5 shadow-[var(--hp-shadow)]">
        <FilterControl label="Status">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="bg-transparent text-[15px] font-semibold outline-none"
          >
            <option value="all">All statuses</option>
            <option value="Queued">Queued</option>
            <option value="Running">Running</option>
            <option value="Succeeded">Succeeded</option>
            <option value="Failed">Failed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </FilterControl>

        <FilterDivider />

        <FilterControl label="Trigger">
          <select
            value={triggerFilter}
            onChange={(event) => setTriggerFilter(event.target.value as TriggerFilter)}
            className="bg-transparent text-[15px] font-semibold outline-none"
          >
            <option value="all">All triggers</option>
            <option value="Push">Push</option>
            <option value="Manual">Manual</option>
            <option value="Redeploy">Redeploy</option>
          </select>
        </FilterControl>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('all')
            setTriggerFilter('all')
          }}
          className="ml-auto inline-flex items-center gap-2 font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.12em] text-[color:var(--hp-text-muted)] transition hover:text-[color:var(--hp-accent-strong)]"
        >
          <span className="material-symbols-outlined text-[16px]">filter_list</span>
          Clear All
        </button>
      </section>

      {isLoading ? (
        <ListMessage
          title="Ladowanie deploymentow"
          description="Pobieram aplikacje i skladam globalna historie deploymentow."
        />
      ) : error ? (
        <ListMessage title="Nie udalo sie pobrac deploymentow" description={error} tone="danger" />
      ) : filteredRecords.length === 0 ? (
        <EmptyState
          title="Brak deploymentow"
          description="Po podpieciu repozytorium i pierwszym deployu tutaj pojawia sie historia wykonania pipeline."
        />
      ) : (
        <DataTable
          columns={['App', 'Deployment', 'Status', 'Trigger', 'Commit', 'Created', 'Actions']}
        >
          {filteredRecords.map(({ app, deployment }) => (
            <tr key={deployment.id} className="group transition hover:bg-[rgba(255,248,245,0.65)]">
              <td className="px-8 py-6">
                <div className="text-[18px] font-semibold tracking-[-0.02em]">{app.name}</div>
                <div className="mt-1 font-mono text-[12px] text-[color:var(--hp-text-muted)]">{app.slug}</div>
              </td>
              <td className="px-8 py-6">
                <div className="text-[15px] font-semibold">{deployment.id.slice(0, 8)}</div>
                <div className="mt-1 text-[13px] text-[color:var(--hp-text-muted)]">
                  {deployment.pipelineStage} / {deployment.branch}
                </div>
              </td>
              <td className="px-8 py-6">
                <DeploymentStatusBadge status={deployment.status} />
              </td>
              <td className="px-8 py-6">
                <div className="text-[15px]">{deployment.trigger}</div>
              </td>
              <td className="px-8 py-6">
                <div className="font-mono text-[14px] text-[color:var(--hp-accent-strong)]">
                  {formatCommitSha(deployment.commitSha)}
                </div>
                <div className="mt-1 text-[13px] text-[color:var(--hp-text-muted)]">
                  artifact {deployment.artifactReference ?? 'n/a'}
                </div>
              </td>
              <td className="px-8 py-6 text-[15px] text-[color:var(--hp-text-muted)]">
                {formatDeploymentDate(deployment)}
              </td>
              <td className="px-8 py-6">
                <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                  <ActionLink
                    href={`/deployments/${app.id}/${deployment.id}`}
                    icon="visibility"
                    label="View deployment"
                  />
                  <ActionLink href={`/apps/${app.id}`} icon="apps" label="Open app" />
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="border-l-2 border-[color:var(--hp-accent-strong)] pl-6">
          <div className="font-['Space_Grotesk'] text-[12px] uppercase tracking-[0.14em] text-[color:var(--hp-accent-strong)]">
            Stage 7
          </div>
          <p className="mt-4 max-w-2xl text-[18px] leading-8 text-[color:var(--hp-text-subtle)]">
            This stage is grounded in existing API capabilities: deployment history per app and manual redeploy. Dedicated deployment logs and standalone detail endpoints can be added later without changing the UI structure.
          </p>
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-end">
          <StatusMini title="Apps Covered" value={String(apps.filter((item) => item.deploymentCount > 0).length)} accent="text-[color:var(--hp-accent-strong)]" />
          <div className="hidden h-12 w-px bg-[rgba(219,194,176,0.75)] md:block" />
          <div>
            <div className="font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.12em] text-[color:var(--hp-text-muted)]">
              Last Known Queue
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[38px] font-bold tracking-[-0.04em]">{metrics.queued}</span>
              <span className="text-[13px] text-[color:var(--hp-text-muted)]">waiting executions</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function FilterControl({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="flex items-center gap-3">
      <span className="font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.12em] text-[color:var(--hp-text-muted)]">
        {label}:
      </span>
      {children}
    </label>
  )
}

function FilterDivider() {
  return <div className="hidden h-5 w-px bg-[rgba(219,194,176,0.75)] md:block" />
}

function ActionLink({
  href,
  icon,
  label,
}: {
  href: string
  icon: string
  label: string
}) {
  return (
    <RouterLink
      href={href}
      className="rounded-[4px] border border-transparent p-2 text-[color:var(--hp-text-subtle)] transition hover:border-[rgba(219,194,176,0.75)] hover:bg-white"
      aria-label={label}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
    </RouterLink>
  )
}

function StatusMini({
  title,
  value,
  accent,
}: {
  title: string
  value: string
  accent: string
}) {
  return (
    <div>
      <div className="font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.12em] text-[color:var(--hp-text-muted)]">
        {title}
      </div>
      <div className={`mt-3 font-mono text-[28px] leading-none ${accent}`}>{value}</div>
    </div>
  )
}

function DeploymentStatusBadge({ status }: { status: string }) {
  const className =
    status === 'Succeeded'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : status === 'Failed'
        ? 'border-rose-200 bg-rose-50 text-rose-700'
        : status === 'Running'
          ? 'border-blue-200 bg-blue-50 text-blue-700'
          : 'border-amber-200 bg-amber-50 text-amber-700'

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-[4px] border px-3 py-1 font-['Space_Grotesk'] text-[12px] font-bold uppercase tracking-[0.1em] ${className}`}
    >
      {status}
    </span>
  )
}
