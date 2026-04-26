import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { RouterLink } from '../../../app/router'
import { fetchApps } from '../../../features/apps/api/appsApi'
import { appStatuses, type AppItem, type AppStatus } from '../../../features/apps/model/types'
import { Button } from '../../../shared/ui/Button'
import { EmptyState } from '../../../shared/ui/EmptyState'
import {
  DataTable,
  getBranchLabel,
  getEnvironmentLabel,
  getErrorMessage,
  getRepositoryLabel,
  getRuntimeLabel,
  ListMessage,
  MetricCard,
  SectionTitle,
  StatusPill,
  formatRelativeDate,
} from './appsShared'

type EnvironmentFilter = 'all' | 'production' | 'staging'
type RuntimeFilter = 'all' | 'node' | 'python' | 'go'

export function AppsPage() {
  const [apps, setApps] = useState<AppItem[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | AppStatus>('all')
  const [environmentFilter, setEnvironmentFilter] = useState<EnvironmentFilter>('all')
  const [runtimeFilter, setRuntimeFilter] = useState<RuntimeFilter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    async function loadApps() {
      setIsLoading(true)
      setListError(null)

      try {
        const response = await fetchApps()

        if (!isActive) {
          return
        }

        setApps(response)
      } catch (error) {
        if (!isActive) {
          return
        }

        setListError(getErrorMessage(error))
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadApps()

    return () => {
      isActive = false
    }
  }, [])

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter
      const environment = getEnvironmentLabel(app).toLowerCase()
      const matchesEnvironment =
        environmentFilter === 'all' || environment === environmentFilter
      const runtime = getRuntimeLabel(app).toLowerCase()
      const matchesRuntime =
        runtimeFilter === 'all' ||
        (runtimeFilter === 'node' && runtime.includes('node')) ||
        (runtimeFilter === 'python' && runtime.includes('python')) ||
        (runtimeFilter === 'go' && runtime.includes('go'))

      return matchesStatus && matchesEnvironment && matchesRuntime
    })
  }, [apps, environmentFilter, runtimeFilter, statusFilter])

  const metrics = useMemo(() => {
    const running = apps.filter((item) => item.status === 'Running').length
    const globalHealth = apps.length === 0 ? 0 : Math.round((running / apps.length) * 1000) / 10
    const resourceUsage = apps.length === 0 ? 0 : Math.min(96, 28 + running * 9 + apps.length * 2)
    const requests = apps.reduce((sum, item) => sum + item.deploymentCount * 18_400, 0)

    return {
      total: apps.length,
      globalHealth,
      resourceUsage,
      requests,
    }
  }, [apps])

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <SectionTitle
          eyebrow="Infrastructure /"
          title="Apps"
          description="Manage and monitor your running application services."
        />

        <div className="flex flex-wrap gap-3">
          <Button kind="secondary">
            <span className="material-symbols-outlined mr-2 text-[18px]">download</span>
            Export Config
          </Button>
          <RouterLink
            href="/apps/create"
            className="inline-flex items-center justify-center rounded-[var(--hp-radius-sm)] border border-transparent bg-[color:var(--hp-accent-strong)] px-6 py-3 font-['Space_Grotesk'] text-[12px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[color:var(--hp-accent)]"
          >
            <span className="material-symbols-outlined mr-2 text-[18px]">add</span>
            New App
          </RouterLink>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-4">
        <MetricCard
          label="Total Services"
          value={String(metrics.total)}
          detail={`+${Math.max(1, metrics.total)} this month`}
          icon="terminal"
        />
        <MetricCard
          label="Global Status"
          value={`${metrics.globalHealth.toFixed(1)}%`}
          detail="Healthy"
          icon="check_circle"
          accent="text-emerald-600"
        />
        <MetricCard
          label="Resource Usage"
          value={`${metrics.resourceUsage}%`}
          detail="Peak utilization"
          icon="memory"
          accent="text-amber-600"
        />
        <MetricCard
          label="Daily Requests"
          value={formatCompactNumber(metrics.requests)}
          detail="up 12%"
          icon="show_chart"
          accent="text-emerald-600"
        />
      </section>

      <section className="flex flex-wrap items-center gap-5 border border-[rgba(219,194,176,0.75)] bg-[rgba(255,255,255,0.55)] px-6 py-5 shadow-[var(--hp-shadow)]">
        <FilterControl label="Status">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | AppStatus)}
            className="bg-transparent text-[15px] font-semibold outline-none"
          >
            <option value="all">All Statuses</option>
            {appStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </FilterControl>

        <FilterDivider />

        <FilterControl label="Env">
          <select
            value={environmentFilter}
            onChange={(event) => setEnvironmentFilter(event.target.value as EnvironmentFilter)}
            className="bg-transparent text-[15px] font-semibold outline-none"
          >
            <option value="all">All Environments</option>
            <option value="production">Production</option>
            <option value="staging">Staging</option>
          </select>
        </FilterControl>

        <FilterDivider />

        <FilterControl label="Runtime">
          <select
            value={runtimeFilter}
            onChange={(event) => setRuntimeFilter(event.target.value as RuntimeFilter)}
            className="bg-transparent text-[15px] font-semibold outline-none"
          >
            <option value="all">All Runtimes</option>
            <option value="node">Node.js</option>
            <option value="python">Python</option>
            <option value="go">Go</option>
          </select>
        </FilterControl>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('all')
            setEnvironmentFilter('all')
            setRuntimeFilter('all')
          }}
          className="ml-auto inline-flex items-center gap-2 font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.12em] text-[color:var(--hp-text-muted)] transition hover:text-[color:var(--hp-accent-strong)]"
        >
          <span className="material-symbols-outlined text-[16px]">filter_list</span>
          Clear All
        </button>
      </section>

      {isLoading ? (
        <ListMessage
          title="Ladowanie aplikacji"
          description="Pobieram liste z backendu i buduje dashboard dla sekcji /apps."
        />
      ) : listError ? (
        <ListMessage title="Nie udalo sie pobrac listy" description={listError} tone="danger" />
      ) : filteredApps.length === 0 ? (
        <EmptyState
          title="Brak aplikacji dla wybranych filtrow"
          description="Zmien filtry albo dodaj nowa aplikacje, aby wypelnic cockpit aplikacji."
          action={
            <RouterLink
              href="/apps/create"
              className="inline-flex items-center justify-center rounded-[var(--hp-radius-sm)] border border-transparent bg-[color:var(--hp-accent-strong)] px-5 py-3 font-medium text-white transition hover:bg-[color:var(--hp-accent)]"
            >
              Dodaj aplikacje
            </RouterLink>
          }
        />
      ) : (
        <DataTable
          columns={[
            'App Name / Slug',
            'Status',
            'Branch & Repo',
            'Runtime',
            'Environment',
            'Last Updated',
            'Actions',
          ]}
          footer={
            <>
              <span className="font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.12em] text-[color:var(--hp-text-muted)]">
                Showing 1-{filteredApps.length} of {apps.length} apps
              </span>
              <div className="flex items-center gap-2">
                {['chevron_left', '1', '2', '3', 'chevron_right'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`flex h-10 w-10 items-center justify-center border text-[13px] transition ${
                      item === '1'
                        ? 'border-[rgba(219,194,176,0.75)] bg-[rgba(255,241,233,0.9)] font-semibold text-[color:var(--hp-accent-strong)]'
                        : 'border-[rgba(219,194,176,0.75)] bg-white text-[color:var(--hp-text-subtle)] hover:bg-[color:var(--hp-accent-soft)]'
                    }`}
                  >
                    {item.startsWith('chevron') ? (
                      <span className="material-symbols-outlined text-[18px]">{item}</span>
                    ) : (
                      item
                    )}
                  </button>
                ))}
              </div>
            </>
          }
        >
          {filteredApps.map((app) => (
            <tr key={app.id} className="group transition hover:bg-[rgba(255,248,245,0.65)]">
              <td className="px-8 py-6">
                <RouterLink href={`/apps/${app.id}`} className="block">
                  <div className="text-[18px] font-semibold tracking-[-0.02em]">{app.name}</div>
                  <div className="mt-1 font-mono text-[12px] text-[color:var(--hp-text-muted)]">
                    {app.slug}
                  </div>
                </RouterLink>
              </td>

              <td className="px-8 py-6">
                <StatusPill status={app.status} />
              </td>

              <td className="px-8 py-6">
                <div className="flex items-center gap-2 text-[15px] font-medium">
                  <span className="material-symbols-outlined text-[18px] text-[color:var(--hp-text-muted)]">
                    account_tree
                  </span>
                  {getBranchLabel(app)}
                </div>
                <div className="mt-1 flex items-center gap-1 text-[13px] text-[color:var(--hp-text-muted)]">
                  <span className="material-symbols-outlined text-[14px]">link</span>
                  <span>{getRepositoryLabel(app)}</span>
                </div>
              </td>

              <td className="px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-[color:var(--hp-surface-strong)]">
                    <span className="material-symbols-outlined text-[18px] text-[color:var(--hp-text-subtle)]">
                      memory
                    </span>
                  </div>
                  <span className="text-[15px] font-semibold">{getRuntimeLabel(app)}</span>
                </div>
              </td>

              <td className="px-8 py-6">
                <span
                  className={`inline-flex rounded-[4px] border px-3 py-1 font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.1em] ${
                    getEnvironmentLabel(app) === 'Production'
                      ? 'border-amber-200 bg-amber-50 text-amber-700'
                      : 'border-stone-200 bg-stone-100 text-stone-600'
                  }`}
                >
                  {getEnvironmentLabel(app)}
                </span>
              </td>

              <td className="px-8 py-6">
                <div className="text-[15px]">{formatRelativeDate(app.updatedAtUtc)}</div>
                <div
                  className={`mt-1 font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.1em] ${
                    app.status === 'Failed'
                      ? 'text-rose-600'
                      : app.status === 'Starting'
                        ? 'text-blue-600'
                        : 'text-[color:var(--hp-text-muted)]'
                  }`}
                >
                  {app.status === 'Failed'
                    ? 'Health Check Failed'
                    : app.status === 'Starting'
                      ? 'Deploying...'
                      : 'By: system'}
                </div>
              </td>

              <td className="px-8 py-6">
                <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                  <ActionIcon href={`/apps/${app.id}`} icon="visibility" label="View app" />
                  <ActionIcon href={`/apps/${app.id}/edit`} icon="edit" label="Edit app" />
                  <button
                    type="button"
                    className="rounded-[4px] border border-transparent p-2 text-[color:var(--hp-accent-strong)] transition hover:border-[rgba(219,194,176,0.75)] hover:bg-white"
                    aria-label="Redeploy app"
                  >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="border-l-2 border-[color:var(--hp-accent-strong)] pl-6">
          <div className="font-['Space_Grotesk'] text-[12px] uppercase tracking-[0.14em] text-[color:var(--hp-accent-strong)]">
            Technical Guidance
          </div>
          <p className="mt-4 max-w-2xl text-[18px] leading-8 text-[color:var(--hp-text-subtle)]">
            Running instances use isolated kernels via KVM. Ensure environment variables are
            synced across all production replicas before triggering a manual redeploy.
          </p>
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-end">
          <StatusMini title="Region Health" value="|||||" accent="text-emerald-500" />
          <div className="hidden h-12 w-px bg-[rgba(219,194,176,0.75)] md:block" />
          <div>
            <div className="font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.12em] text-[color:var(--hp-text-muted)]">
              API Latency
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[38px] font-bold tracking-[-0.04em]">12ms</span>
              <span className="material-symbols-outlined text-[18px] text-emerald-500">
                trending_down
              </span>
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

function ActionIcon({
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

function formatCompactNumber(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }

  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}k`
  }

  return String(value)
}
