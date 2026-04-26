import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { RouterLink } from '../../../app/router'
import { fetchApps } from '../../../features/apps/api/appsApi'
import type { AppItem } from '../../../features/apps/model/types'
import { fetchDeploymentHistory, fetchRepository } from '../../../features/repositories/api/repositoriesApi'
import type { DeploymentHistoryItem, RepositoryItem } from '../../../features/repositories/model/types'
import { ApiError } from '../../../shared/api/http'
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
import { TableBadge } from './repositoriesShared'

type RepositoryStatusFilter = 'all' | 'connected' | 'missing'
type WebhookFilter = 'all' | 'configured' | 'pending'

export function RepositoriesPage() {
  const [apps, setApps] = useState<AppItem[]>([])
  const [repositoriesByAppId, setRepositoriesByAppId] = useState<Record<string, RepositoryItem | null>>({})
  const [latestDeploymentsByAppId, setLatestDeploymentsByAppId] = useState<Record<string, DeploymentHistoryItem | null>>({})
  const [repositoryStatusFilter, setRepositoryStatusFilter] = useState<RepositoryStatusFilter>('all')
  const [webhookFilter, setWebhookFilter] = useState<WebhookFilter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    async function loadData() {
      setIsLoading(true)
      setListError(null)

      try {
        const appItems = await fetchApps()

        if (!isActive) {
          return
        }

        setApps(appItems)

        const [repositoryEntries, deploymentEntries] = await Promise.all([
          Promise.all(
            appItems.map(async (app) => {
              try {
                const repository = await fetchRepository(app.id)
                return [app.id, repository] as const
              } catch (error) {
                if (error instanceof ApiError && error.status === 404) {
                  return [app.id, null] as const
                }

                throw error
              }
            }),
          ),
          Promise.all(
            appItems.map(async (app) => {
              try {
                const deployments = await fetchDeploymentHistory(app.id)
                return [app.id, deployments[0] ?? null] as const
              } catch {
                return [app.id, null] as const
              }
            }),
          ),
        ])

        if (!isActive) {
          return
        }

        setRepositoriesByAppId(Object.fromEntries(repositoryEntries))
        setLatestDeploymentsByAppId(Object.fromEntries(deploymentEntries))
      } catch (error) {
        if (!isActive) {
          return
        }

        setListError(error instanceof Error ? error.message : 'Wystapil nieoczekiwany blad.')
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

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const repository = repositoriesByAppId[app.id] ?? null
      const matchesRepositoryStatus =
        repositoryStatusFilter === 'all' ||
        (repositoryStatusFilter === 'connected' && repository) ||
        (repositoryStatusFilter === 'missing' && !repository)
      const matchesWebhook =
        webhookFilter === 'all' ||
        (webhookFilter === 'configured' && repository?.hasWebhookSecret) ||
        (webhookFilter === 'pending' && (!repository || !repository.hasWebhookSecret))

      return matchesRepositoryStatus && matchesWebhook
    })
  }, [apps, repositoriesByAppId, repositoryStatusFilter, webhookFilter])

  const metrics = useMemo(() => {
    const connected = apps.filter((app) => repositoriesByAppId[app.id]).length
    const configuredWebhooks = apps.filter((app) => repositoriesByAppId[app.id]?.hasWebhookSecret).length
    const pending = Math.max(0, apps.length - connected)

    return {
      total: apps.length,
      connected,
      configuredWebhooks,
      pending,
    }
  }, [apps, repositoriesByAppId])

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <SectionTitle
          eyebrow="Control Plane /"
          title="Repositories"
          description="Repository mappings are attached to apps. This view shows which apps already have source configuration, webhook protection and deploy history."
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
            Pick App First
          </RouterLink>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-4">
        <MetricCard
          label="Tracked Apps"
          value={String(metrics.total)}
          detail="available app records"
          icon="apps"
        />
        <MetricCard
          label="Connected Repos"
          value={String(metrics.connected)}
          detail={`${metrics.pending} pending`}
          icon="source"
          accent="text-emerald-600"
        />
        <MetricCard
          label="Webhook Ready"
          value={String(metrics.configuredWebhooks)}
          detail="secret configured"
          icon="webhook"
          accent="text-amber-600"
        />
        <MetricCard
          label="Missing Repos"
          value={String(metrics.pending)}
          detail="need source mapping"
          icon="link_off"
          accent="text-[color:var(--hp-text-muted)]"
        />
      </section>

      <section className="flex flex-wrap items-center gap-5 border border-[rgba(219,194,176,0.75)] bg-[rgba(255,255,255,0.55)] px-6 py-5 shadow-[var(--hp-shadow)]">
        <FilterControl label="Repository">
          <select
            value={repositoryStatusFilter}
            onChange={(event) => setRepositoryStatusFilter(event.target.value as RepositoryStatusFilter)}
            className="bg-transparent text-[15px] font-semibold outline-none"
          >
            <option value="all">All states</option>
            <option value="connected">Connected</option>
            <option value="missing">Missing</option>
          </select>
        </FilterControl>

        <FilterDivider />

        <FilterControl label="Webhook">
          <select
            value={webhookFilter}
            onChange={(event) => setWebhookFilter(event.target.value as WebhookFilter)}
            className="bg-transparent text-[15px] font-semibold outline-none"
          >
            <option value="all">All secrets</option>
            <option value="configured">Configured</option>
            <option value="pending">Pending</option>
          </select>
        </FilterControl>

        <button
          type="button"
          onClick={() => {
            setRepositoryStatusFilter('all')
            setWebhookFilter('all')
          }}
          className="ml-auto inline-flex items-center gap-2 font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.12em] text-[color:var(--hp-text-muted)] transition hover:text-[color:var(--hp-accent-strong)]"
        >
          <span className="material-symbols-outlined text-[16px]">filter_list</span>
          Clear All
        </button>
      </section>

      {isLoading ? (
        <ListMessage
          title="Ladowanie repozytoriow"
          description="Pobieram aplikacje, mapowania repozytoriow i najnowsze deploymenty."
        />
      ) : listError ? (
        <ListMessage title="Nie udalo sie pobrac danych" description={listError} tone="danger" />
      ) : filteredApps.length === 0 ? (
        <EmptyState
          title="Brak wynikow dla wybranych filtrow"
          description="Zmien filtry albo podlacz repozytorium do jednej z aplikacji."
        />
      ) : (
        <DataTable
          columns={['Application', 'Repository', 'Branch', 'Webhook', 'Latest Deploy', 'Actions']}
        >
          {filteredApps.map((app) => {
            const repository = repositoriesByAppId[app.id] ?? null
            const latestDeployment = latestDeploymentsByAppId[app.id] ?? null

            return (
              <tr key={app.id} className="group transition hover:bg-[rgba(255,248,245,0.65)]">
                <td className="px-8 py-6">
                  <div className="text-[18px] font-semibold tracking-[-0.02em]">{app.name}</div>
                  <div className="mt-1 font-mono text-[12px] text-[color:var(--hp-text-muted)]">
                    {app.slug}
                  </div>
                </td>

                <td className="px-8 py-6">
                  {repository ? (
                    <>
                      <div className="inline-flex items-center gap-2 text-[15px] font-medium">
                        <span className="material-symbols-outlined text-[18px] text-[color:var(--hp-text-muted)]">
                          source
                        </span>
                        {repository.owner}/{repository.name}
                      </div>
                      <div className="mt-1 text-[13px] text-[color:var(--hp-text-muted)]">
                        {repository.provider}
                      </div>
                    </>
                  ) : (
                    <TableBadge tone="muted">Repository missing</TableBadge>
                  )}
                </td>

                <td className="px-8 py-6">
                  {repository ? (
                    <>
                      <div className="inline-flex items-center gap-2 text-[15px] font-medium">
                        <span className="material-symbols-outlined text-[18px] text-[color:var(--hp-text-muted)]">
                          account_tree
                        </span>
                        {repository.branch}
                      </div>
                      <div className="mt-1 text-[13px] text-[color:var(--hp-text-muted)]">
                        Connected {formatDeploymentDate({
                          id: repository.id,
                          appId: repository.appId,
                          repositoryId: repository.id,
                          status: '',
                          trigger: '',
                          pipelineStage: '',
                          branch: repository.branch,
                          commitSha: null,
                          artifactReference: null,
                          failureReason: null,
                          createdAtUtc: repository.connectedAtUtc,
                          startedAtUtc: null,
                          finishedAtUtc: null,
                        })}
                      </div>
                    </>
                  ) : (
                    <span className="text-[14px] text-[color:var(--hp-text-muted)]">Not configured</span>
                  )}
                </td>

                <td className="px-8 py-6">
                  {repository?.hasWebhookSecret ? (
                    <TableBadge tone="success">Configured</TableBadge>
                  ) : (
                    <TableBadge tone="warning">Pending</TableBadge>
                  )}
                </td>

                <td className="px-8 py-6">
                  {latestDeployment ? (
                    <>
                      <div className="text-[15px]">{latestDeployment.status}</div>
                      <div className="mt-1 font-mono text-[13px] text-[color:var(--hp-text-muted)]">
                        {formatCommitSha(latestDeployment.commitSha)} • {formatDeploymentDate(latestDeployment)}
                      </div>
                    </>
                  ) : (
                    <span className="text-[14px] text-[color:var(--hp-text-muted)]">No deployments</span>
                  )}
                </td>

                <td className="px-8 py-6">
                  <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                    <ActionLink href={`/repositories/${app.id}`} icon="visibility" label="View repository" />
                    <ActionLink
                      href={`/repositories/${app.id}/edit`}
                      icon={repository ? 'edit' : 'add'}
                      label={repository ? 'Edit repository' : 'Add repository'}
                    />
                  </div>
                </td>
              </tr>
            )
          })}
        </DataTable>
      )}

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="border-l-2 border-[color:var(--hp-accent-strong)] pl-6">
          <div className="font-['Space_Grotesk'] text-[12px] uppercase tracking-[0.14em] text-[color:var(--hp-accent-strong)]">
            Data Model
          </div>
          <p className="mt-4 max-w-2xl text-[18px] leading-8 text-[color:var(--hp-text-subtle)]">
            Repository is a child resource of an app. The operational goal of this screen is to show which apps already have a valid source mapping and which still need configuration.
          </p>
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-end">
          <StatusMini title="Webhook Health" value={`${metrics.configuredWebhooks}/${Math.max(metrics.connected, 1)}`} accent="text-emerald-500" />
          <div className="hidden h-12 w-px bg-[rgba(219,194,176,0.75)] md:block" />
          <div>
            <div className="font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.12em] text-[color:var(--hp-text-muted)]">
              Repository Coverage
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[38px] font-bold tracking-[-0.04em]">{metrics.connected}</span>
              <span className="text-[13px] text-[color:var(--hp-text-muted)]">apps mapped</span>
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
