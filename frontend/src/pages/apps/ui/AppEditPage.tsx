import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useRouter } from '../../../app/router'
import { createApp, fetchAppById, updateApp } from '../../../features/apps/api/appsApi'
import type { AppItem, SaveAppInput } from '../../../features/apps/model/types'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { useToast } from '../../../widgets/toaster/ui/ToastContext'
import {
  AppForm,
  defaultFormValues,
  getErrorMessage,
  ListMessage,
  mapAppToFormValues,
  StatusPill,
} from './appsShared'

export function AppEditPage() {
  const { currentPath, navigate } = useRouter()
  const { pushToast } = useToast()
  const isCreateMode = currentPath === '/apps/create'
  const appId = useMemo(() => decodeURIComponent(currentPath.split('/')[2] ?? ''), [currentPath])
  const [app, setApp] = useState<AppItem | null>(null)
  const [formValues, setFormValues] = useState<SaveAppInput>(defaultFormValues)
  const [isLoading, setIsLoading] = useState(!isCreateMode)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isCreateMode) {
      setApp(null)
      setFormValues(defaultFormValues)
      setIsLoading(false)
      setError(null)
      return
    }

    let isActive = true

    async function loadApp() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetchAppById(appId)

        if (!isActive) {
          return
        }

        setApp(response)
        setFormValues(mapAppToFormValues(response))
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

    void loadApp()

    return () => {
      isActive = false
    }
  }, [appId, isCreateMode])

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      if (isCreateMode) {
        const created = await createApp(formValues)

        pushToast({
          title: 'Aplikacja utworzona',
          description: `${created.name} jest gotowa do dalszej konfiguracji.`,
          tone: 'success',
        })

        navigate(`/apps/${created.id}`)
        return
      }

      if (!app) {
        return
      }

      const updated = await updateApp(app.id, formValues)

      pushToast({
        title: 'Aplikacja zaktualizowana',
        description: `${updated.name} ma zapisane zmiany.`,
        tone: 'success',
      })

      navigate(`/apps/${updated.id}`)
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <ListMessage
        title="Ladowanie formularza"
        description="Pobieram dane aplikacji i skladam widok edycji."
      />
    )
  }

  if (!isCreateMode && error && !app) {
    return (
      <ListMessage title="Nie udalo sie przygotowac ekranu edycji" description={error} tone="danger" />
    )
  }

  if (!isCreateMode && !app) {
    return (
      <EmptyState
        title="Brak danych aplikacji"
        description="Nie moge otworzyc formularza edycji bez poprawnego identyfikatora."
      />
    )
  }

  return (
    <div className="space-y-8">
      <div className="sticky top-[-1.5rem] z-10 -mx-5 -mt-6 flex flex-col gap-4 border-b border-[color:var(--hp-auth-border)] bg-[rgba(255,241,233,0.96)] px-5 py-5 backdrop-blur-sm md:flex-row md:items-center md:justify-between lg:top-[-2rem] lg:-mx-10 lg:-mt-8 lg:px-10">
        <div className="flex items-center gap-4">
          <div>
            <div className="font-['Space_Grotesk'] text-[13px] uppercase tracking-[0.18em] text-[color:var(--hp-accent-strong)]">
              {isCreateMode ? 'APPS / CREATE' : 'APPS / PRODUCTION'}
            </div>
            <h1 className="mt-2 text-[clamp(2rem,3vw,3.25rem)] font-semibold leading-none tracking-[-0.04em]">
              {isCreateMode ? 'Create app' : `Edit: ${app?.name ?? ''}`}
            </h1>
          </div>
          {!isCreateMode && app ? <StatusPill status={app.status} /> : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate(isCreateMode ? '/apps' : `/apps/${app?.id}`)}
            className="rounded-[var(--hp-radius-sm)] border border-[rgba(219,194,176,0.75)] bg-white px-7 py-3 text-[15px] font-semibold transition hover:bg-[color:var(--hp-accent-soft)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="app-edit-form"
            className="rounded-[var(--hp-radius-sm)] border border-transparent bg-[color:var(--hp-accent-strong)] px-8 py-3 text-[15px] font-semibold text-white transition hover:bg-[color:var(--hp-accent)]"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px]">
        <AppForm
          value={formValues}
          error={error}
          onChange={setFormValues}
          onSubmit={handleSave}
        />
      </div>
    </div>
  )
}
