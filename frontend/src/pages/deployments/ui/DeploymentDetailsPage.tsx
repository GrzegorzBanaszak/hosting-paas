import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { RouterLink, useRouter } from '../../../app/router'
import { fetchApps } from '../../../features/apps/api/appsApi'
import type { AppItem } from '../../../features/apps/model/types'
import { fetchAppLogs, queueRedeploy } from '../../../features/deployments/api/deploymentsApi'
import type { AppLogEntry } from '../../../features/deployments/model/types'
import { fetchDeploymentHistory, fetchRepository } from '../../../features/repositories/api/repositoriesApi'
import type { DeploymentHistoryItem, RepositoryItem } from '../../../features/repositories/model/types'
import { Button } from '../../../shared/ui/Button'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { useToast } from '../../../widgets/toaster/ui/ToastContext'
import {
  DetailPanel,
  ListMessage,
  SectionTitle,
  formatCommitSha,
  formatDate,
} from '../../apps/ui/appsShared'

export function DeploymentDetailsPage() {
  const { currentPath } = useRouter()
  const { pushToast } = useToast()
  const appId = useMemo(() => decodeURIComponent(currentPath.split('/')[2] ?? ''), [currentPath])
  const deploymentId = useMemo(() => decodeURIComponent(currentPath.split('/')[3] ?? ''), [currentPath])
  const [app, setApp] = useState<AppItem | null>(null)
  const [repository, setRepository] = useState<RepositoryItem | null>(null)
  const [deployment, setDeployment] = useState<DeploymentHistoryItem | null>(null)
  const [logs, setLogs] = useState<AppLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isQueueing, setIsQueueing] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let isActive = true

    async function loadData() {
      setIsLoading(true)
      setError(null)

      try {
        const apps = await fetchApps()
        const selectedApp = apps.find((item) => item.id === appId) ?? null

        if (!selectedApp) {
          throw new Error('Nie znaleziono aplikacji dla wskazanego deploymentu.')
        }

        const [deployments, appLogs, repositoryResult] = await Promise.all([
          fetchDeploymentHistory(appId),
          fetchAppLogs(appId, 80),
          fetchRepository(appId).catch(() => null),
        ])

        const selectedDeployment = deployments.find((item) => item.id === deploymentId) ?? null

        if (!selectedDeployment) {
          throw new Error('Nie znaleziono wskazanego deploymentu.')
        }

        if (!isActive) {
          return
        }

        setApp(selectedApp)
        setRepository(repositoryResult)
        setDeployment(selectedDeployment)
        setLogs(
          appLogs.filter((entry) => entry.deploymentId === selectedDeployment.id).slice(0, 20),
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
  }, [appId, deploymentId, reloadToken])

  async function handleRedeploy() {
    if (!app || !repository || isQueueing) {
      return
    }

    const suggestedCommit = deployment?.commitSha ?? ''
    const commitSha = window.prompt('Podaj commit SHA do redeploy:', suggestedCommit)

    if (!commitSha) {
      return
    }

    setIsQueueing(true)

    try {
      const queued = await queueRedeploy(app.id, {
        commitSha,
        branch: repository.branch,
      })

      pushToast({
        title: 'Redeploy queued',
        description: `${app.name} queued commit ${queued.commitSha ?? 'n/a'} on branch ${queued.branch}.`,
        tone: 'success',
      })

      setReloadToken((value) => value + 1)
    } catch (queueError) {
      pushToast({
        title: 'Nie udalo sie uruchomic redeploy',
        description: queueError instanceof Error ? queueError.message : 'Wystapil nieoczekiwany blad.',
        tone: 'danger',
      })
    } finally {
      setIsQueueing(false)
    }
  }

  if (isLoading) {
    return (
      <ListMessage
        title="Ladowanie deploymentu"
        description="Pobieram szczegoly deploymentu, repozytorium i powiazane logi aplikacji."
      />
    )
  }

  if (error) {
    return <ListMessage title="Nie udalo sie pobrac deploymentu" description={error} tone="danger" />
  }

  if (!app || !deployment) {
    return (
      <EmptyState
        title="Brak deploymentu"
        description="Nie znaleziono deploymentu dla wskazanej aplikacji."
      />
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="font-['Space_Grotesk'] text-[13px] uppercase tracking-[0.14em] text-[color:var(--hp-text-muted)]">
            Deployments / {app.slug}
          </div>
          <SectionTitle
            eyebrow=""
            title={`Deployment ${deployment.id.slice(0, 8)}`}
            description={`${deployment.status} / ${deployment.pipelineStage} / ${deployment.branch} / ${formatCommitSha(deployment.commitSha)}`}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <RouterLink
            href="/deployments"
            className="inline-flex items-center justify-center rounded-[var(--hp-radius-sm)] border border-[rgba(219,194,176,0.75)] bg-white px-5 py-3 font-['Space_Grotesk'] text-[12px] font-bold uppercase tracking-[0.14em] transition hover:bg-[color:var(--hp-accent-soft)]"
          >
            <span className="material-symbols-outlined mr-2 text-[18px]">arrow_back</span>
            Back
          </RouterLink>
          <RouterLink
            href={`/apps/${app.id}`}
            className="inline-flex items-center justify-center rounded-[var(--hp-radius-sm)] border border-[rgba(219,194,176,0.75)] bg-white px-5 py-3 font-['Space_Grotesk'] text-[12px] font-bold uppercase tracking-[0.14em] transition hover:bg-[color:var(--hp-accent-soft)]"
          >
            <span className="material-symbols-outlined mr-2 text-[18px]">apps</span>
            Open App
          </RouterLink>
          <Button onClick={handleRedeploy} disabled={!repository || isQueueing}>
            {isQueueing ? 'Queueing...' : 'Redeploy'}
          </Button>
          <Button kind="secondary" disabled>
            Retry Soon
          </Button>
        </div>
      </div>

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <InfoCard title="Execution Overview">
          <div className="grid gap-4 md:grid-cols-2">
            <DetailPanel label="App" value={app.name} />
            <DetailPanel label="Deployment Id" value={deployment.id} />
            <DetailPanel label="Status" value={deployment.status} />
            <DetailPanel label="Pipeline Stage" value={deployment.pipelineStage} />
            <DetailPanel label="Trigger" value={deployment.trigger} />
            <DetailPanel label="Branch" value={deployment.branch} />
            <DetailPanel label="Commit SHA" value={deployment.commitSha ?? 'n/a'} />
            <DetailPanel label="Artifact Reference" value={deployment.artifactReference ?? 'Not published'} />
            <DetailPanel label="Created" value={formatDate(deployment.createdAtUtc)} />
            <DetailPanel label="Started" value={deployment.startedAtUtc ? formatDate(deployment.startedAtUtc) : 'Not started'} />
            <DetailPanel label="Finished" value={deployment.finishedAtUtc ? formatDate(deployment.finishedAtUtc) : 'Not finished'} />
            <DetailPanel label="Failure Reason" value={deployment.failureReason ?? 'No failure recorded'} />
          </div>
        </InfoCard>

        <div className="space-y-8">
          <InfoCard title="Repository Context">
            <DetailPanel label="Connected Repo" value={repository ? `${repository.owner}/${repository.name}` : 'Repository not connected'} />
            <DetailPanel label="Deploy Branch" value={repository?.branch ?? 'n/a'} />
            <DetailPanel label="Webhook Secret" value={repository?.hasWebhookSecret ? 'Configured' : 'Pending'} />
            <DetailPanel label="Connected At" value={repository ? formatDate(repository.connectedAtUtc) : 'n/a'} />
          </InfoCard>

          <InfoCard title="Current Limits">
            <p className="text-[14px] leading-7 text-[color:var(--hp-text-subtle)]">
              Dedicated deployment-detail and deployment-log endpoints are not exposed yet. This page is built from app deployment history plus app log entries filtered by `deploymentId`.
            </p>
          </InfoCard>
        </div>
      </section>

      <InfoCard title="Related Logs">
        {logs.length > 0 ? (
          <div className="space-y-3">
            {logs.map((entry) => (
              <div
                key={entry.id}
                className="rounded-[var(--hp-radius-sm)] border border-[rgba(219,194,176,0.75)] px-5 py-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.12em] text-[color:var(--hp-accent-strong)]">
                    {entry.level}
                  </span>
                  <span className="font-mono text-[12px] text-[color:var(--hp-text-muted)]">
                    {entry.source}
                  </span>
                  <span className="font-mono text-[12px] text-[color:var(--hp-text-muted)]">
                    {formatDate(entry.timestampUtc)}
                  </span>
                </div>
                <p className="mt-3 text-[14px] leading-7 text-[color:var(--hp-text)]">{entry.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Brak logow dla deploymentu"
            description="Backend zapisuje logi aplikacji i deploymentow, ale dla tego deploymentu nie znaleziono jeszcze wpisow z powiazanym `deploymentId`."
          />
        )}
      </InfoCard>
    </div>
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
