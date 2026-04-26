import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { RouterLink } from '../../../app/router'
import { fetchApps } from '../../../features/apps/api/appsApi'
import { appStatuses, type AppItem, type AppStatus } from '../../../features/apps/model/types'
import { Button } from '../../../shared/ui/Button'
import { EmptyState } from '../../../shared/ui/EmptyState'
import {
  DataTable,
  getAppEndpointLabel,
  getErrorMessage,
  getProjectRootLabel,
  getRuntimeLabel,
  ListMessage,
  MetricCard,
  SectionTitle,
  StatusPill,
  formatRelativeDate,
} from './appsShared'

type RepositoryFilter = 'all' | 'connected' | 'missing'
type RuntimeFilter = 'all' | 'static-site' | 'vite-spa' | 'node-api' | 'aspnet-api'

export function AppsPage() {
  const [apps, setApps] = useState<AppItem[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | AppStatus>('all')
  const [repositoryFilter, setRepositoryFilter] = useState<RepositoryFilter>('all')
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
      const matchesRepository =
        repositoryFilter === 'all' ||
        (repositoryFilter === 'connected' && app.hasRepository) ||
        (repositoryFilter === 'missing' && !app.hasRepository)
      const runtimeLabel = getRuntimeLabel(app)
      const matchesRuntime =
        runtimeFilter === 'all' ||
        (runtimeFilter === 'static-site' && runtimeLabel === 'Static Site') ||
        (runtimeFilter === 'vite-spa' && runtimeLabel === 'Vite SPA') ||
        (runtimeFilter === 'node-api' && runtimeLabel === 'Node.js API') ||
        (runtimeFilter === 'aspnet-api' && runtimeLabel === 'ASP.NET API')

      return matchesStatus && matchesRepository && matchesRuntime
    })
  }, [apps, repositoryFilter, runtimeFilter, statusFilter])

  const metrics = useMemo(() => {
    const connectedRepositories = apps.filter((item) => item.hasRepository).length
    const deployments = apps.reduce((sum, item) => sum + item.deploymentCount, 0)
    const domains = apps.reduce((sum, item) => sum + item.domainCount, 0)

    return {
      total: apps.length,
      connectedRepositories,
      deployments,
      domains,
    }
  }, [apps])

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <SectionTitle
          eyebrow="Control Plane /"
          title="Apps"
          description="Central registry of application definitions. Each app owns its runtime configuration, repository connection and deployment history."
        />

        <div className="flex flex-wrap gap-3">
          <Button kind="secondary">
            <span className="material-symbols-outlined mr-2 text-[18px]">download</span>
            Export List
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
          label="Apps"
          value={String(metrics.total)}
          detail="registered"
          icon="apps"
        />
        <MetricCard
          label="Repos Connected"
          value={String(metrics.connectedRepositories)}
          detail={`${Math.max(0, metrics.total - metrics.connectedRepositories)} pending`}
          icon="source"
          accent="text-[color:var(--hp-accent-strong)]"
        />
        <MetricCard
          label="Deployments"
          value={String(metrics.deployments)}
          detail="tracked total"
          icon="rocket_launch"
          accent="text-amber-600"
        />
        <MetricCard
          label="Domains"
          value={String(metrics.domains)}
          detail="assigned"
          icon="language"
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
            <option value="all">All statuses</option>
            {appStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </FilterControl>

        <FilterDivider />

        <FilterControl label="Repository">
          <select
            value={repositoryFilter}
            onChange={(event) => setRepositoryFilter(event.target.value as RepositoryFilter)}
            className="bg-transparent text-[15px] font-semibold outline-none"
          >
            <option value="all">All apps</option>
            <option value="connected">Connected</option>
            <option value="missing">Missing</option>
          </select>
        </FilterControl>

        <FilterDivider />

        <FilterControl label="Runtime">
          <select
            value={runtimeFilter}
            onChange={(event) => setRuntimeFilter(event.target.value as RuntimeFilter)}
            className="bg-transparent text-[15px] font-semibold outline-none"
          >
            <option value="all">All runtimes</option>
            <option value="static-site">Static Site</option>
            <option value="vite-spa">Vite SPA</option>
            <option value="node-api">Node.js API</option>
            <option value="aspnet-api">ASP.NET API</option>
          </select>
        </FilterControl>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('all')
            setRepositoryFilter('all')
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
          description="Pobieram liste aplikacji i przygotowuje widok zgodny z modelem domenowym."
        />
      ) : listError ? (
        <ListMessage title="Nie udalo sie pobrac listy" description={listError} tone="danger" />
      ) : filteredApps.length === 0 ? (
        <EmptyState
          title="Brak aplikacji dla wybranych filtrow"
          description="Zmien filtry albo utworz nowa aplikacje, aby rozpoczac konfiguracje runtime i repozytorium."
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
            'App',
            'Status',
            'Runtime',
            'Endpoint',
            'Repository',
            'Deployments',
            'Last Updated',
            'Actions',
          ]}
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
                <div className="text-[15px] font-semibold">{getRuntimeLabel(app)}</div>
                <div className="mt-1 font-mono text-[12px] text-[color:var(--hp-text-muted)]">
                  port {app.port ?? 'n/a'} • root {getProjectRootLabel(app)}
                </div>
              </td>

              <td className="px-8 py-6">
                <div className="text-[15px]">{getAppEndpointLabel(app)}</div>
                <div className="mt-1 font-mono text-[12px] text-[color:var(--hp-text-muted)]">
                  {app.domainCount} domain{app.domainCount === 1 ? '' : 's'}
                </div>
              </td>

              <td className="px-8 py-6">
                <span
                  className={`inline-flex rounded-[4px] border px-3 py-1 font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.1em] ${
                    app.hasRepository
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-stone-200 bg-stone-100 text-stone-600'
                  }`}
                >
                  {app.hasRepository ? 'Connected' : 'Not connected'}
                </span>
              </td>

              <td className="px-8 py-6">
                <div className="text-[15px] font-semibold">{app.deploymentCount}</div>
                <div className="mt-1 text-[12px] text-[color:var(--hp-text-muted)]">
                  tracked deployment records
                </div>
              </td>

              <td className="px-8 py-6">
                <div className="text-[15px]">{formatRelativeDate(app.updatedAtUtc)}</div>
                <div className="mt-1 font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.1em] text-[color:var(--hp-text-muted)]">
                  Created {formatRelativeDate(app.createdAtUtc)}
                </div>
              </td>

              <td className="px-8 py-6">
                <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                  <ActionIcon href={`/apps/${app.id}`} icon="visibility" label="View app" />
                  <ActionIcon href={`/apps/${app.id}/edit`} icon="edit" label="Edit app" />
                  <ActionIcon href={`/repositories/${app.id}`} icon="source" label="Repository" />
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="border-l-2 border-[color:var(--hp-accent-strong)] pl-6">
          <div className="font-['Space_Grotesk'] text-[12px] uppercase tracking-[0.14em] text-[color:var(--hp-accent-strong)]">
            Data Model
          </div>
          <p className="mt-4 max-w-2xl text-[18px] leading-8 text-[color:var(--hp-text-subtle)]">
            `App` is the primary record. Repository connection and deployments are secondary
            resources attached to the app after creation.
          </p>
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-end">
          <StatusMini title="Connected Repos" value={`${metrics.connectedRepositories}/${metrics.total}`} accent="text-[color:var(--hp-accent-strong)]" />
          <div className="hidden h-12 w-px bg-[rgba(219,194,176,0.75)] md:block" />
          <div>
            <div className="font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.12em] text-[color:var(--hp-text-muted)]">
              Pending Setup
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[38px] font-bold tracking-[-0.04em]">
                {Math.max(0, metrics.total - metrics.connectedRepositories)}
              </span>
              <span className="text-[13px] text-[color:var(--hp-text-muted)]">
                apps without repository
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
