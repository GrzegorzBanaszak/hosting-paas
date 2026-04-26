import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useRouter } from '../../../app/router'
import { fetchApps } from '../../../features/apps/api/appsApi'
import type { AppItem } from '../../../features/apps/model/types'
import {
  fetchRepository,
  saveRepository,
} from '../../../features/repositories/api/repositoriesApi'
import type { RepositoryItem, SaveRepositoryInput } from '../../../features/repositories/model/types'
import { ApiError } from '../../../shared/api/http'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { useToast } from '../../../widgets/toaster/ui/ToastContext'
import { ListMessage } from '../../apps/ui/appsShared'
import {
  defaultRepositoryFormValues,
  mapRepositoryToFormValues,
  RepositoryForm,
} from './repositoriesShared'

export function RepositoryEditPage() {
  const { currentPath, navigate } = useRouter()
  const { pushToast } = useToast()
  const isCreateMode = currentPath === '/repositories/create'
  const appId = useMemo(() => decodeURIComponent(currentPath.split('/')[2] ?? ''), [currentPath])
  const [apps, setApps] = useState<AppItem[]>([])
  const [selectedAppId, setSelectedAppId] = useState('')
  const [repository, setRepository] = useState<RepositoryItem | null>(null)
  const [formValues, setFormValues] = useState<SaveRepositoryInput>(defaultRepositoryFormValues)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const availableAppsForCreate = useMemo(
    () =>
      isCreateMode
        ? apps.filter((item) => item.hasRepository === false || item.id === selectedAppId)
        : apps,
    [apps, isCreateMode, selectedAppId],
  )

  const selectedApp = useMemo(
    () => apps.find((item) => item.id === (isCreateMode ? selectedAppId : appId)) ?? null,
    [appId, apps, isCreateMode, selectedAppId],
  )

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

        if (isCreateMode) {
          const appsWithoutRepository = appItems.filter((item) => item.hasRepository === false)
          setSelectedAppId((current) => current || appsWithoutRepository[0]?.id || '')
          setRepository(null)
          setFormValues(defaultRepositoryFormValues)
          setIsLoading(false)
          return
        }

        const existingRepository = await fetchRepository(appId)

        if (!isActive) {
          return
        }

        setSelectedAppId(appId)
        setRepository(existingRepository)
        setFormValues(mapRepositoryToFormValues(existingRepository))
      } catch (loadError) {
        if (!isActive) {
          return
        }

        if (!isCreateMode && loadError instanceof ApiError && loadError.status === 404) {
          setSelectedAppId(appId)
          setRepository(null)
          setFormValues(defaultRepositoryFormValues)
          setError(null)
          setIsLoading(false)
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
  }, [appId, isCreateMode])

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const targetAppId = isCreateMode ? selectedAppId : appId

    if (!targetAppId || !selectedApp) {
      setError('Najpierw wybierz aplikacje.')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await saveRepository(targetAppId, formValues)

      pushToast({
        title: repository ? 'Repozytorium zaktualizowane' : 'Repozytorium podlaczone',
        description: `${selectedApp.name} jest polaczone z ${response.owner}/${response.name}.`,
        tone: 'success',
      })

      navigate(`/repositories/${targetAppId}`)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Wystapil nieoczekiwany blad.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <ListMessage
        title="Ladowanie formularza repozytorium"
        description="Pobieram aplikacje i aktualne mapowanie repozytorium."
      />
    )
  }

  if (error && !selectedApp && !isCreateMode) {
    return (
      <ListMessage title="Nie udalo sie przygotowac ekranu edycji" description={error} tone="danger" />
    )
  }

  if (!isCreateMode && !selectedApp) {
    return (
      <EmptyState
        title="Brak danych aplikacji"
        description="Nie moge otworzyc formularza repozytorium bez poprawnego identyfikatora."
      />
    )
  }

  if (isCreateMode && availableAppsForCreate.length === 0) {
    return (
      <EmptyState
        title="Wszystkie aplikacje maja juz repozytorium"
        description="Aby zmienic mapowanie repozytorium, przejdz do szczegolow wybranej aplikacji albo uzyj ekranu edycji repozytorium."
      />
    )
  }

  return (
    <div className="space-y-8">
      <div className="sticky top-[-1.5rem] z-10 -mx-5 -mt-6 flex flex-col gap-4 border-b border-[color:var(--hp-auth-border)] bg-[rgba(255,241,233,0.96)] px-5 py-5 backdrop-blur-sm md:flex-row md:items-center md:justify-between lg:top-[-2rem] lg:-mx-10 lg:-mt-8 lg:px-10">
        <div>
          <div className="font-['Space_Grotesk'] text-[13px] uppercase tracking-[0.18em] text-[color:var(--hp-accent-strong)]">
            {isCreateMode ? 'REPOSITORIES / CREATE' : 'REPOSITORIES / EDIT'}
          </div>
          <h1 className="mt-2 text-[clamp(2rem,3vw,3.25rem)] font-semibold leading-none tracking-[-0.04em]">
            {isCreateMode
              ? 'Add repository'
              : `Edit: ${repository ? `${repository.owner}/${repository.name}` : selectedApp?.name ?? ''}`}
          </h1>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate(isCreateMode ? '/repositories' : `/repositories/${appId}`)}
            className="rounded-[var(--hp-radius-sm)] border border-[rgba(219,194,176,0.75)] bg-white px-7 py-3 text-[15px] font-semibold transition hover:bg-[color:var(--hp-accent-soft)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="repository-edit-form"
            className="rounded-[var(--hp-radius-sm)] border border-transparent bg-[color:var(--hp-accent-strong)] px-8 py-3 text-[15px] font-semibold text-white transition hover:bg-[color:var(--hp-accent)]"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px]">
        <RepositoryForm
          selectedApp={selectedApp}
          availableApps={availableAppsForCreate}
          selectedAppId={isCreateMode ? selectedAppId : appId}
          value={formValues}
          error={error}
          isSaving={isSaving}
          isCreateMode={isCreateMode}
          onAppChange={setSelectedAppId}
          onChange={setFormValues}
          onSubmit={handleSave}
          onCancel={() => navigate(isCreateMode ? '/repositories' : `/repositories/${appId}`)}
        />
      </div>
    </div>
  )
}
