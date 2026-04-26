import type { FormEvent, ReactNode } from 'react'
import { Button } from '../../../shared/ui/Button'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { DetailPanel, ListMessage, formatDate } from '../../apps/ui/appsShared'
import type {
  DeploymentHistoryItem,
  RepositoryItem,
  SaveRepositoryInput,
} from '../../../features/repositories/model/types'
import type { AppItem } from '../../../features/apps/model/types'

export const defaultRepositoryFormValues: SaveRepositoryInput = {
  provider: 'GitHub',
  owner: '',
  name: '',
  branch: 'main',
  cloneUrl: '',
  externalRepositoryId: '',
  webhookSecret: '',
}

export function RepositoryForm({
  selectedApp,
  availableApps,
  selectedAppId,
  value,
  error,
  isSaving,
  isCreateMode,
  onAppChange,
  onChange,
  onSubmit,
  onCancel,
}: {
  selectedApp: AppItem | null
  availableApps: AppItem[]
  selectedAppId: string
  value: SaveRepositoryInput
  error: string | null
  isSaving: boolean
  isCreateMode: boolean
  onAppChange: (appId: string) => void
  onChange: (nextValue: SaveRepositoryInput) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}) {
  function setField<K extends keyof SaveRepositoryInput>(
    field: K,
    fieldValue: SaveRepositoryInput[K],
  ) {
    onChange({
      ...value,
      [field]: fieldValue,
    })
  }

  function loadSampleCloneUrl() {
    if (!value.owner.trim() || !value.name.trim()) {
      return
    }

    onChange({
      ...value,
      cloneUrl: `https://github.com/${value.owner.trim()}/${value.name.trim()}.git`,
    })
  }

  return (
    <form id="repository-edit-form" className="space-y-8" onSubmit={onSubmit}>
      <FormSection
        icon="link"
        title="App Binding"
        contentClassName="grid gap-6 md:grid-cols-2"
      >
        <Field label="Application">
          {isCreateMode ? (
            <select
              value={selectedAppId}
              onChange={(event) => onAppChange(event.target.value)}
              className={inputClassName}
            >
              <option value="">Select application</option>
              {availableApps.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name} ({app.slug})
                </option>
              ))}
            </select>
          ) : (
            <input value={selectedApp?.name ?? ''} disabled className={inputClassName} />
          )}
        </Field>

        <Field label="Provider">
          <input value="GitHub" disabled className={inputClassName} />
        </Field>

        <div className="rounded-[var(--hp-radius-md)] border border-dashed border-[color:var(--hp-auth-border)] bg-[rgba(255,249,245,0.85)] px-5 py-4 md:col-span-2">
          <div className="font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.14em] text-[color:var(--hp-text-muted)]">
            Model Rule
          </div>
          <p className="mt-2 text-[14px] leading-7 text-[color:var(--hp-text-subtle)]">
            One repository mapping belongs to one app. Branch ownership should stay unique per connected app.
          </p>
        </div>
      </FormSection>

      <FormSection
        icon="source"
        title="Repository Mapping"
        contentClassName="grid gap-6 md:grid-cols-2"
      >
        <Field label="Owner">
          <input
            required
            value={value.owner}
            onChange={(event) => setField('owner', event.target.value)}
            className={inputClassName}
            placeholder="example-org"
          />
        </Field>

        <Field label="Repository Name">
          <input
            required
            value={value.name}
            onChange={(event) => setField('name', event.target.value)}
            className={inputClassName}
            placeholder="hosting-paas-demo"
          />
        </Field>

        <Field label="Deploy Branch">
          <input
            required
            value={value.branch}
            onChange={(event) => setField('branch', event.target.value)}
            className={inputClassName}
            placeholder="main"
          />
        </Field>

        <Field label="External Repository ID">
          <input
            value={value.externalRepositoryId}
            onChange={(event) => setField('externalRepositoryId', event.target.value)}
            className={inputClassName}
            placeholder="optional provider id"
          />
        </Field>
      </FormSection>

      <FormSection
        icon="settings_ethernet"
        title="Clone And Webhook"
        contentClassName="space-y-6"
      >
        <Field label="Clone URL">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              required
              value={value.cloneUrl}
              onChange={(event) => setField('cloneUrl', event.target.value)}
              className={inputClassName}
              placeholder="https://github.com/example/repo.git"
            />
            <Button kind="secondary" type="button" onClick={loadSampleCloneUrl}>
              Generate
            </Button>
          </div>
        </Field>

        <Field label="Webhook Secret">
          <input
            value={value.webhookSecret}
            onChange={(event) => setField('webhookSecret', event.target.value)}
            className={inputClassName}
            placeholder="optional secret for signature validation"
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <DetailPanel label="Webhook Path" value="/api/webhooks/github" />
          <DetailPanel label="Events" value="GitHub push events" />
        </div>
      </FormSection>

      {error ? (
        <ListMessage title="Nie udalo sie zapisac repozytorium" description={error} tone="danger" />
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        <Button kind="secondary" type="button" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button disabled={isSaving || !selectedAppId}>
          {isSaving ? 'Saving...' : isCreateMode ? 'Connect Repository' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}

export function RepositoryOverview({
  app,
  repository,
  deployments,
}: {
  app: AppItem
  repository: RepositoryItem | null
  deployments: DeploymentHistoryItem[]
}) {
  const latestDeployment = deployments[0] ?? null

  return (
    <div className="space-y-8">
      <section className="grid gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <InfoCard title="Repository Overview">
          <div className="grid gap-4 md:grid-cols-2">
            <DetailPanel label="Application" value={app.name} />
            <DetailPanel label="Slug" value={app.slug} />
            <DetailPanel
              label="Owner / Repo"
              value={repository ? `${repository.owner}/${repository.name}` : 'Repository not connected'}
            />
            <DetailPanel label="Provider" value={repository?.provider ?? 'n/a'} />
            <DetailPanel label="Branch" value={repository?.branch ?? 'n/a'} />
            <DetailPanel
              label="Connected At"
              value={repository ? formatDate(repository.connectedAtUtc) : 'No data'}
            />
            <DetailPanel label="Clone URL" value={repository?.cloneUrl ?? 'No data'} />
            <DetailPanel label="Webhook Secret" value={repository?.hasWebhookSecret ? 'Configured' : 'Pending'} />
          </div>
        </InfoCard>

        <div className="space-y-8">
          <InfoCard title="App Context">
            <DetailPanel label="App Status" value={app.status} />
            <DetailPanel label="Deployments" value={String(app.deploymentCount)} />
            <DetailPanel label="Domains" value={String(app.domainCount)} />
            <DetailPanel label="Project Root" value={app.projectRootPath ?? '.'} />
          </InfoCard>

          <InfoCard title="Latest Deployment">
            <DetailPanel label="Status" value={latestDeployment?.status ?? 'No deployments'} />
            <DetailPanel label="Trigger" value={latestDeployment?.trigger ?? 'n/a'} />
            <DetailPanel label="Commit" value={latestDeployment?.commitSha ?? 'n/a'} />
            <DetailPanel label="Stage" value={latestDeployment?.pipelineStage ?? 'n/a'} />
          </InfoCard>
        </div>
      </section>

      <InfoCard title="Deployment History">
        {deployments.length === 0 ? (
          <EmptyState
            title="Brak deploymentow"
            description="Po pierwszym deployu tutaj pojawi sie historia commitow, branchy i statusow wykonania."
          />
        ) : (
          <div className="space-y-4">
            {deployments.map((deployment) => (
              <div
                key={deployment.id}
                className="rounded-[var(--hp-radius-sm)] border border-[rgba(219,194,176,0.75)] px-5 py-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <TableBadge tone={mapDeploymentTone(deployment.status)}>
                    {deployment.status}
                  </TableBadge>
                  <TableBadge tone="muted">{deployment.pipelineStage}</TableBadge>
                  <TableBadge tone="muted">{deployment.trigger}</TableBadge>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <DetailPanel label="Commit SHA" value={deployment.commitSha ?? 'Brak'} />
                  <DetailPanel label="Branch" value={deployment.branch} />
                  <DetailPanel label="Created" value={formatDate(deployment.createdAtUtc)} />
                  <DetailPanel
                    label="Finished"
                    value={deployment.finishedAtUtc ? formatDate(deployment.finishedAtUtc) : 'In progress or unavailable'}
                  />
                </div>
                {deployment.failureReason ? (
                  <div className="mt-4">
                    <ListMessage
                      title="Blad deploymentu"
                      description={deployment.failureReason}
                      tone="danger"
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </InfoCard>
    </div>
  )
}

export function RepositoryHero({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <div className="font-['Space_Grotesk'] text-[13px] uppercase tracking-[0.14em] text-[color:var(--hp-text-muted)]">
          {eyebrow}
        </div>
        <div className="mt-2 text-[clamp(2rem,3vw,3.25rem)] font-semibold leading-none tracking-[-0.04em]">
          {title}
        </div>
        <div className="mt-3 max-w-3xl text-[18px] leading-8 text-[color:var(--hp-text-subtle)]">
          {description}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block font-['Space_Grotesk'] text-[12px] uppercase tracking-[0.12em] text-[color:var(--hp-text-muted)]">
        {label}
      </span>
      {children}
    </label>
  )
}

export function InfoCard({
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

export function FormSection({
  icon,
  title,
  contentClassName = '',
  children,
}: {
  icon: string
  title: string
  contentClassName?: string
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-[var(--hp-radius-lg)] border border-[color:var(--hp-auth-border)] bg-white shadow-[var(--hp-shadow)]">
      <div className="flex items-center gap-3 border-b border-[color:var(--hp-auth-border)] bg-[rgba(251,249,246,0.85)] px-6 py-5">
        <span className="material-symbols-outlined text-[24px] text-[color:var(--hp-accent-strong)]">
          {icon}
        </span>
        <h2 className="text-[22px] font-semibold tracking-tight">{title}</h2>
      </div>
      <div className={`p-6 ${contentClassName}`.trim()}>{children}</div>
    </section>
  )
}

export function TableBadge({
  children,
  tone,
}: {
  children: ReactNode
  tone: 'success' | 'warning' | 'danger' | 'muted'
}) {
  const className =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : tone === 'danger'
          ? 'border-rose-200 bg-rose-50 text-rose-700'
          : 'border-stone-200 bg-stone-100 text-stone-600'

  return (
    <span
      className={`inline-flex rounded-[4px] border px-3 py-1 font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.1em] ${className}`}
    >
      {children}
    </span>
  )
}

export function mapRepositoryToFormValues(repository: RepositoryItem): SaveRepositoryInput {
  return {
    provider: repository.provider,
    owner: repository.owner,
    name: repository.name,
    branch: repository.branch,
    cloneUrl: repository.cloneUrl,
    externalRepositoryId: repository.externalRepositoryId ?? '',
    webhookSecret: '',
  }
}

export function mapDeploymentTone(status: string): 'success' | 'warning' | 'danger' | 'muted' {
  if (status === 'Succeeded' || status === 'Running') {
    return 'success'
  }

  if (status === 'Queued') {
    return 'warning'
  }

  if (status === 'Failed' || status === 'Cancelled') {
    return 'danger'
  }

  return 'muted'
}

export const repositoryInputClassName =
  'w-full rounded-lg border border-[color:var(--hp-border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--hp-accent)] disabled:bg-[color:var(--hp-surface-strong)]'

const inputClassName = repositoryInputClassName
