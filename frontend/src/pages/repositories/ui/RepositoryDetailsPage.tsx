import { useEffect, useMemo, useState } from 'react'
import { RouterLink, useRouter } from '../../../app/router'
import { fetchAppById } from '../../../features/apps/api/appsApi'
import type { AppItem } from '../../../features/apps/model/types'
import {
  fetchDeploymentHistory,
  fetchRepository,
  removeRepository,
} from '../../../features/repositories/api/repositoriesApi'
import type {
  DeploymentHistoryItem,
  RepositoryItem,
} from '../../../features/repositories/model/types'
import { ApiError } from '../../../shared/api/http'
import { Button } from '../../../shared/ui/Button'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { useToast } from '../../../widgets/toaster/ui/ToastContext'
import { ListMessage } from '../../apps/ui/appsShared'
import {
  RepositoryHero,
  RepositoryOverview,
} from './repositoriesShared'

export function RepositoryDetailsPage() {
  const { currentPath, navigate } = useRouter()
  const { pushToast } = useToast()
  const appId = useMemo(() => decodeURIComponent(currentPath.split('/')[2] ?? ''), [currentPath])
  const [app, setApp] = useState<AppItem | null>(null)
  const [repository, setRepository] = useState<RepositoryItem | null>(null)
  const [latestDeployment, setLatestDeployment] = useState<DeploymentHistoryItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    let isActive = true

    async function loadData() {
      if (!appId) {
        setError('Brak identyfikatora aplikacji w adresie.')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const appResponse = await fetchAppById(appId)
        const deployments = await fetchDeploymentHistory(appId)

        let repositoryResponse: RepositoryItem | null = null

        try {
          repositoryResponse = await fetchRepository(appId)
        } catch (loadError) {
          if (!(loadError instanceof ApiError && loadError.status === 404)) {
            throw loadError
          }
        }

        if (!isActive) {
          return
        }

        setApp(appResponse)
        setRepository(repositoryResponse)
        setLatestDeployment(deployments[0] ?? null)
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
  }, [appId])

  async function handleDelete() {
    if (!app || !repository || isDeleting) {
      return
    }

    const confirmed = window.confirm(
      `Odlaczyc repozytorium ${repository.owner}/${repository.name} od aplikacji "${app.name}"?`,
    )

    if (!confirmed) {
      return
    }

    setIsDeleting(true)

    try {
      await removeRepository(app.id)

      pushToast({
        title: 'Repozytorium odlaczone',
        description: `${app.name} nie ma juz aktywnego polaczenia z GitHubem.`,
        tone: 'success',
      })

      navigate('/repositories')
    } catch (deleteError) {
      pushToast({
        title: 'Nie udalo sie odpiac repozytorium',
        description: deleteError instanceof Error ? deleteError.message : 'Wystapil nieoczekiwany blad.',
        tone: 'danger',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <ListMessage
        title="Ladowanie szczegolow repozytorium"
        description="Pobieram aplikacje, mapowanie repo i ostatni deployment."
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

  return (
    <div className="space-y-8">
      <RepositoryHero
        eyebrow={`Repositories / ${app.slug}`}
        title={repository ? `${repository.owner}/${repository.name}` : `${app.name} repository`}
        description={
          repository
            ? `Connected to ${app.name} on branch ${repository.branch}.`
            : `Application ${app.name} does not have a connected repository yet.`
        }
        actions={
          <>
            <RouterLink
              href="/repositories"
              className="inline-flex items-center justify-center rounded-[var(--hp-radius-sm)] border border-[rgba(219,194,176,0.75)] bg-white px-5 py-3 font-['Space_Grotesk'] text-[12px] font-bold uppercase tracking-[0.14em] transition hover:bg-[color:var(--hp-accent-soft)]"
            >
              <span className="material-symbols-outlined mr-2 text-[18px]">arrow_back</span>
              Back
            </RouterLink>
            <RouterLink
              href={repository ? `/repositories/${app.id}/edit` : '/repositories/create'}
              className="inline-flex items-center justify-center rounded-[var(--hp-radius-sm)] border border-transparent bg-[color:var(--hp-accent-strong)] px-6 py-3 font-['Space_Grotesk'] text-[12px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[color:var(--hp-accent)]"
            >
              <span className="material-symbols-outlined mr-2 text-[18px]">edit</span>
              {repository ? 'Edit' : 'Add Repository'}
            </RouterLink>
            {repository ? (
              <Button
                className="bg-[#ba1a1a] hover:bg-[#8f1212]"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            ) : null}
          </>
        }
      />

      <RepositoryOverview app={app} repository={repository} latestDeployment={latestDeployment} />
    </div>
  )
}
