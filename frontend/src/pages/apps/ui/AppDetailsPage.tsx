import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { RouterLink, useRouter } from '../../../app/router'
import { deleteApp, fetchAppById } from '../../../features/apps/api/appsApi'
import { fetchDeploymentHistory, fetchRepository } from '../../../features/repositories/api/repositoriesApi'
import type { AppItem } from '../../../features/apps/model/types'
import type { DeploymentHistoryItem, RepositoryItem } from '../../../features/repositories/model/types'
import { Button } from '../../../shared/ui/Button'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { useToast } from '../../../widgets/toaster/ui/ToastContext'
import {
  DataTable,
  DetailPanel,
  formatCommitSha,
  formatDate,
  formatDeploymentDate,
  getAppEndpointLabel,
  getDeploymentSummary,
  getErrorMessage,
  getLatestDeployment,
  getProjectRootLabel,
  getRepositoryBranchLabel,
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
  const [repository, setRepository] = useState<RepositoryItem | null>(null)
  const [deployments, setDeployments] = useState<DeploymentHistoryItem[]>([])
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
        const appResponse = await fetchAppById(appId)

        if (!isActive) {
          return
        }

        setApp(appResponse)

        const [repositoryResult, deploymentsResult] = await Promise.allSettled([
          fetchRepository(appId),
          fetchDeploymentHistory(appId),
        ])

        if (!isActive) {
          return
        }

        setRepository(repositoryResult.status === 'fulfilled' ? repositoryResult.value : null)
        setDeployments(deploymentsResult.status === 'fulfilled' ? deploymentsResult.value : [])
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
        description="Pobieram aplikacje, konfiguracje repozytorium i historie deploymentow."
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

  const latestDeployment = getLatestDeployment(deployments)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="font-['Space_Grotesk'] text-[13px] uppercase tracking-[0.14em] text-[color:var(--hp-text-muted)]">
              Apps / Overview
            </div>
            <StatusPill status={app.status} />
          </div>

          <SectionTitle
            eyebrow=""
            title={app.name}
            description={`${getAppEndpointLabel(app)} • ${getRuntimeLabel(app)} • ${app.deploymentCount} deployment records`}
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
          <RouterLink
            href={repository ? `/repositories/${app.id}` : `/repositories/${app.id}/edit`}
            className="inline-flex items-center justify-center rounded-[var(--hp-radius-sm)] border border-[rgba(219,194,176,0.75)] bg-white px-5 py-3 font-['Space_Grotesk'] text-[12px] font-bold uppercase tracking-[0.14em] transition hover:bg-[color:var(--hp-accent-soft)]"
          >
            <span className="material-symbols-outlined mr-2 text-[18px]">source</span>
            {repository ? 'Repository' : 'Connect Repo'}
          </RouterLink>
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

      <section className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="overflow-hidden rounded-[var(--hp-radius-sm)] border border-[rgba(219,194,176,0.75)] bg-white shadow-[var(--hp-shadow)]">
          <div className="flex items-center justify-between border-b border-[rgba(219,194,176,0.75)] bg-[rgba(255,241,233,0.35)] px-6 py-4">
            <div className="font-['Space_Grotesk'] text-[14px] uppercase tracking-[0.14em] text-[color:var(--hp-text)]">
              App Definition
            </div>
            <div className="font-mono text-[12px] text-[color:var(--hp-text-muted)]">{app.slug}</div>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-2">
            <DetailPanel label="App Id" value={app.id} />
            <DetailPanel label="Runtime" value={getRuntimeLabel(app)} />
            <DetailPanel label="Primary Hostname" value={getAppEndpointLabel(app)} />
            <DetailPanel label="Project Root" value={getProjectRootLabel(app)} />
            <DetailPanel label="Port" value={app.port ? String(app.port) : 'Not set'} />
            <DetailPanel label="Health Check" value={app.healthCheckPath} />
            <DetailPanel label="Start Command" value={app.startCommand} />
            <DetailPanel label="Build Command" value={app.buildCommand ?? 'Not configured'} />
          </div>
        </div>

        <div className="space-y-8">
          <InfoCard title="Repository">
            {repository ? (
              <>
                <DetailPanel label="Connected Repo" value={getRepositoryLabel(repository)} />
                <DetailPanel label="Branch" value={getRepositoryBranchLabel(repository)} />
                <DetailPanel label="Clone URL" value={repository.cloneUrl} />
                <DetailPanel label="Connected At" value={formatDate(repository.connectedAtUtc)} />
                <RouterLink
                  href={`/repositories/${app.id}`}
                  className="inline-flex w-full items-center justify-center rounded-[var(--hp-radius-sm)] border border-[rgba(219,194,176,0.75)] px-4 py-3 font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.12em] transition hover:bg-[color:var(--hp-accent-soft)]"
                >
                  Open Repository Details
                </RouterLink>
              </>
            ) : (
              <>
                <p className="text-[14px] leading-7 text-[color:var(--hp-text-subtle)]">
                  This app exists as a control-plane record, but it does not have a connected
                  repository yet.
                </p>
                <RouterLink
                  href={`/repositories/${app.id}/edit`}
                  className="inline-flex w-full items-center justify-center rounded-[var(--hp-radius-sm)] border border-[rgba(219,194,176,0.75)] px-4 py-3 font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.12em] transition hover:bg-[color:var(--hp-accent-soft)]"
                >
                  Connect Repository
                </RouterLink>
              </>
            )}
          </InfoCard>

          <InfoCard title="Deployment Summary">
            <DetailPanel label="Records" value={String(app.deploymentCount)} />
            <DetailPanel label="Latest" value={getDeploymentSummary(deployments)} />
            <DetailPanel
              label="Last Updated"
              value={formatDate(app.updatedAtUtc)}
            />
          </InfoCard>
        </div>
      </section>

      <DataTable
        columns={['Deployment Id', 'Status', 'Trigger', 'Branch', 'Commit', 'Stage', 'Created']}
        footer={
          <>
            <div className="font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.12em] text-[color:var(--hp-accent-strong)]">
              {deployments.length} deployment record{deployments.length === 1 ? '' : 's'}
            </div>
            <Button kind="secondary" onClick={() => setReloadToken((value) => value + 1)}>
              Refresh
            </Button>
          </>
        }
      >
        {deployments.length > 0 ? (
          deployments.map((row, index) => (
            <tr key={row.id} className={index % 2 === 1 ? 'bg-[rgba(251,249,246,0.8)]' : ''}>
              <td className="px-8 py-5 font-mono text-[14px]">{row.id.slice(0, 8)}</td>
              <td className="px-8 py-5">
                <DeploymentStatusBadge status={row.status} />
              </td>
              <td className="px-8 py-5 text-[15px]">{row.trigger}</td>
              <td className="px-8 py-5 text-[15px]">{row.branch}</td>
              <td className="px-8 py-5 font-mono text-[14px] text-[color:var(--hp-accent-strong)]">
                {formatCommitSha(row.commitSha)}
              </td>
              <td className="px-8 py-5 text-[15px]">{row.pipelineStage}</td>
              <td className="px-8 py-5 text-[15px] text-[color:var(--hp-text-muted)]">
                {formatDeploymentDate(row)}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={7} className="px-8 py-10 text-center text-[14px] text-[color:var(--hp-text-muted)]">
              No deployment records yet. Connect a repository and trigger the first deployment.
            </td>
          </tr>
        )}
      </DataTable>

      {latestDeployment ? (
        <section className="grid gap-6 xl:grid-cols-3">
          <InfoCard title="Latest Deployment">
            <DetailPanel label="Status" value={latestDeployment.status} />
            <DetailPanel label="Trigger" value={latestDeployment.trigger} />
            <DetailPanel label="Pipeline Stage" value={latestDeployment.pipelineStage} />
          </InfoCard>
          <InfoCard title="Artifact">
            <DetailPanel label="Artifact Reference" value={latestDeployment.artifactReference ?? 'Not published'} />
            <DetailPanel label="Started" value={latestDeployment.startedAtUtc ? formatDate(latestDeployment.startedAtUtc) : 'Not started'} />
            <DetailPanel label="Finished" value={latestDeployment.finishedAtUtc ? formatDate(latestDeployment.finishedAtUtc) : 'Not finished'} />
          </InfoCard>
          <InfoCard title="Failure">
            <DetailPanel label="Reason" value={latestDeployment.failureReason ?? 'No failure recorded'} />
          </InfoCard>
        </section>
      ) : null}
    </div>
  )
}

function DeploymentStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  const className =
    normalized === 'succeeded'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : normalized === 'failed'
        ? 'border-rose-200 bg-rose-50 text-rose-700'
        : normalized === 'running'
          ? 'border-blue-200 bg-blue-50 text-blue-700'
          : 'border-stone-200 bg-stone-100 text-stone-600'

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-[4px] border px-3 py-1 font-['Space_Grotesk'] text-[12px] font-bold uppercase tracking-[0.1em] ${className}`}
    >
      {status}
    </span>
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
