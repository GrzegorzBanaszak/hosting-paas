import type { FormEvent, ReactNode } from 'react'
import {
  type AppItem,
  type AppStatus,
  type SaveAppInput,
} from '../../../features/apps/model/types'
import type { DeploymentHistoryItem, RepositoryItem } from '../../../features/repositories/model/types'
import { ApiError } from '../../../shared/api/http'
import { Card, CardContent } from '../../../shared/ui/Card'

export const defaultFormValues: SaveAppInput = {
  name: '',
  slug: '',
  description: '',
  status: 'Draft',
  port: '',
  buildCommand: '',
  startCommand: '',
  projectRootPath: '',
  healthCheckPath: '/health',
  primaryHostname: '',
}

export type RuntimeKind = 'nginx' | 'node'
export type AppFormMode = 'create' | 'edit'
export type RuntimePreset =
  | 'static-site'
  | 'vite-spa'
  | 'node-api'
  | 'aspnet-api'

export function AppForm({
  mode,
  value,
  error,
  onChange,
  onSubmit,
}: {
  mode: AppFormMode
  value: SaveAppInput
  error: string | null
  onChange: (nextValue: SaveAppInput) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  function setField<K extends keyof SaveAppInput>(field: K, fieldValue: SaveAppInput[K]) {
    onChange({
      ...value,
      [field]: fieldValue,
    })
  }

  const runtime = inferRuntime(value)
  const runtimePreset = inferRuntimePreset(value)
  const isCreateMode = mode === 'create'

  return (
    <form id="app-edit-form" className="space-y-8" onSubmit={onSubmit}>
      <FormSection
        icon="info"
        title="Basic Info"
        contentClassName="grid gap-6 md:grid-cols-2"
      >
        <Field label="Application Name">
          <input
            required
            minLength={3}
            value={value.name}
            onChange={(event) => setField('name', event.target.value)}
            className={inputClassName}
          />
        </Field>

        <Field label="URL Slug">
          <div className="flex rounded-[var(--hp-radius-sm)]">
            <span className="flex items-center rounded-l-[var(--hp-radius-sm)] border border-r-0 border-[color:var(--hp-auth-border)] bg-[color:var(--hp-accent-soft)] px-4 text-[13px] text-[color:var(--hp-text-muted)]">
              {value.primaryHostname.trim() || 'infra-cockpit.io'}/
            </span>
            <input
              required
              minLength={3}
              value={value.slug}
              onChange={(event) => setField('slug', event.target.value)}
              className={`${inputClassName} rounded-l-none`}
            />
          </div>
        </Field>

        <Field label="Description" className="md:col-span-2">
          <textarea
            rows={4}
            value={value.description}
            onChange={(event) => setField('description', event.target.value)}
            className={`${inputClassName} min-h-[132px]`}
          />
        </Field>
      </FormSection>

      <FormSection
        icon="rocket_launch"
        title={isCreateMode ? 'App Runtime' : 'Runtime Preset'}
        contentClassName="space-y-6"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {runtimePresetOptions.map((option) => {
            const selected = option.value === runtimePreset

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => applyRuntimePreset(option.value, value, onChange)}
                className={`rounded-[var(--hp-radius-sm)] border px-5 py-5 text-left transition ${
                  selected
                    ? 'border-[color:var(--hp-accent-strong)] bg-[color:var(--hp-accent-soft)] text-[color:var(--hp-accent-strong)]'
                    : 'border-[color:var(--hp-auth-border)] bg-white hover:border-[color:var(--hp-accent)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="material-symbols-outlined text-[26px]">{option.icon}</span>
                  <span className="rounded-full border border-current/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em]">
                    {option.badge}
                  </span>
                </div>
                <div className="mt-5 text-[15px] font-semibold">{option.label}</div>
                <p className="mt-2 text-[13px] leading-6 text-[color:var(--hp-text-muted)]">
                  {option.description}
                </p>
              </button>
            )
          })}
        </div>

        <div className="rounded-[var(--hp-radius-md)] border border-[color:var(--hp-auth-border)] bg-[rgba(251,249,246,0.85)] px-5 py-4">
          <div className="font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.14em] text-[color:var(--hp-text-muted)]">
            Selected Runtime
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <div className="text-[18px] font-semibold">{getRuntimePresetLabel(runtimePreset)}</div>
            <span className="rounded-full border border-[rgba(219,194,176,0.9)] px-3 py-1 text-[12px] text-[color:var(--hp-text-muted)]">
              Engine: {runtime === 'nginx' ? 'Nginx' : 'Application process'}
            </span>
          </div>
        </div>
      </FormSection>

      <FormSection
        icon="memory"
        title="Runtime Config"
        contentClassName="grid gap-6 md:grid-cols-2"
      >
        <Field label="Project Root Path">
          <input
            value={value.projectRootPath}
            onChange={(event) => setField('projectRootPath', event.target.value)}
            className={`${inputClassName} font-mono text-[13px]`}
            placeholder="., frontend, src/Web"
          />
        </Field>

        <Field label="Listen Port">
          <input
            inputMode="numeric"
            value={value.port}
            onChange={(event) => setField('port', event.target.value)}
            className={inputClassName}
            placeholder="3000"
          />
        </Field>

        <Field label="Start Command">
          <input
            required
            value={value.startCommand}
            onChange={(event) => setField('startCommand', event.target.value)}
            className={`${inputClassName} font-mono text-[13px]`}
            placeholder="npm start"
          />
        </Field>

        <Field label="Build Command">
          <input
            value={value.buildCommand}
            onChange={(event) => setField('buildCommand', event.target.value)}
            className={`${inputClassName} font-mono text-[13px]`}
            placeholder="npm run build"
          />
        </Field>

        <Field label="Health Check Path">
          <input
            value={value.healthCheckPath}
            onChange={(event) => setField('healthCheckPath', event.target.value)}
            className={`${inputClassName} font-mono text-[13px]`}
            placeholder="/health"
          />
        </Field>

        <div className="rounded-[var(--hp-radius-md)] border border-dashed border-[color:var(--hp-auth-border)] bg-[rgba(255,249,245,0.85)] px-5 py-4 md:col-span-2">
          <div className="font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.14em] text-[color:var(--hp-text-muted)]">
            Next Step
          </div>
          <p className="mt-2 text-[14px] leading-7 text-[color:var(--hp-text-subtle)]">
            Repository connection, environment variables and deployments should be configured
            after the app is created. This screen should only define the app identity and
            runtime baseline.
          </p>
        </div>
      </FormSection>

      {error ? (
        <div className="rounded-[var(--hp-radius-md)] border border-rose-200 bg-[color:var(--hp-danger-soft)] px-4 py-3 text-[14px] text-[color:var(--hp-danger)]">
          {error}
        </div>
      ) : null}

    </form>
  )
}

export function Field({
  label,
  className = '',
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <label className={`block ${className}`.trim()}>
      <span className="mb-2 block font-['Space_Grotesk'] text-[12px] uppercase tracking-[0.12em] text-[color:var(--hp-text-subtle)]">
        {label}
      </span>
      {children}
    </label>
  )
}

export function FormSection({
  icon,
  title,
  headerAction,
  contentClassName = '',
  children,
}: {
  icon: string
  title: string
  headerAction?: ReactNode
  contentClassName?: string
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-[var(--hp-radius-lg)] border border-[color:var(--hp-auth-border)] bg-white shadow-[var(--hp-shadow)]">
      <div className="flex items-center justify-between gap-4 border-b border-[color:var(--hp-auth-border)] bg-[rgba(251,249,246,0.85)] px-6 py-5">
        <h2 className="flex items-center gap-3 text-[22px] font-semibold tracking-tight">
          <span className="material-symbols-outlined text-[24px] text-[color:var(--hp-accent-strong)]">
            {icon}
          </span>
          {title}
        </h2>
        {headerAction}
      </div>
      <div className={`p-6 ${contentClassName}`.trim()}>{children}</div>
    </section>
  )
}

export function MetricCard({
  label,
  value,
  detail,
  icon,
  accent = 'text-[color:var(--hp-text-muted)]',
}: {
  label: string
  value: string
  detail: string
  icon: string
  accent?: string
}) {
  return (
    <Card className="rounded-none border-[rgba(219,194,176,0.75)] shadow-none">
      <CardContent className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.14em] text-[color:var(--hp-text-muted)]">
            {label}
          </div>
          <span className={`material-symbols-outlined text-[18px] ${accent}`}>{icon}</span>
        </div>
        <div className="flex items-end gap-3">
          <span className="text-[46px] font-bold leading-none tracking-[-0.04em]">{value}</span>
          <span className={`pb-1 text-[13px] ${accent}`}>{detail}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function DetailPanel({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.12em] text-[color:var(--hp-text-muted)]">
        {label}
      </div>
      <div className="mt-2 break-all text-[16px] font-medium leading-6 text-[color:var(--hp-text)]">
        {value}
      </div>
    </div>
  )
}

export function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--hp-radius-sm)] border border-[rgba(219,194,176,0.75)] bg-white px-5 py-4">
      <div className="font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.12em] text-[color:var(--hp-text-muted)]">
        {label}
      </div>
      <div className="mt-2 text-[16px] font-semibold text-[color:var(--hp-text)]">{value}</div>
    </div>
  )
}

export function ListMessage({
  title,
  description,
  tone = 'default',
}: {
  title: string
  description: string
  tone?: 'default' | 'danger'
}) {
  return (
    <div
      className={`rounded-[var(--hp-radius-md)] border px-4 py-4 ${
        tone === 'danger'
          ? 'border-rose-200 bg-[color:var(--hp-danger-soft)]'
          : 'border-[color:var(--hp-auth-border)] bg-[rgba(255,255,255,0.7)]'
      }`}
    >
      <div className="text-[15px] font-semibold">{title}</div>
      <p className="mt-2 text-[14px] text-[color:var(--hp-text-muted)]">{description}</p>
    </div>
  )
}

export function StatusPill({ status }: { status: AppStatus }) {
  const styles = statusStyles[status] ?? statusStyles.Draft

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-[4px] border px-3 py-1 font-['Space_Grotesk'] text-[12px] font-bold uppercase tracking-[0.1em] ${styles.className}`}
    >
      <span className={`h-2 w-2 rounded-full ${styles.dotClassName}`} />
      {styles.label}
    </span>
  )
}

export function DataTable({
  columns,
  children,
  footer,
}: {
  columns: string[]
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="overflow-hidden border border-[rgba(219,194,176,0.75)] bg-white shadow-[var(--hp-shadow)]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="border-b border-[rgba(219,194,176,0.75)] bg-[rgba(251,249,246,0.85)]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-8 py-4 font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.12em] text-[color:var(--hp-text-muted)]"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(233,200,171,0.25)]">{children}</tbody>
        </table>
      </div>
      {footer ? (
        <div className="flex flex-col gap-4 border-t border-[rgba(219,194,176,0.75)] bg-[rgba(251,249,246,0.8)] px-8 py-5 md:flex-row md:items-center md:justify-between">
          {footer}
        </div>
      ) : null}
    </div>
  )
}

export function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div>
      <div className="font-['Space_Grotesk'] text-[13px] uppercase tracking-[0.18em] text-[color:var(--hp-accent-strong)]">
        {eyebrow}
      </div>
      <h1 className="mt-2 text-[clamp(2rem,3vw,3.25rem)] font-semibold leading-none tracking-[-0.04em]">
        {title}
      </h1>
      <p className="mt-3 max-w-3xl text-[18px] leading-8 text-[color:var(--hp-text-subtle)]">
        {description}
      </p>
    </div>
  )
}

export function mapStatusTone(status: AppStatus) {
  if (status === 'Running') {
    return 'success' as const
  }

  if (status === 'Starting' || status === 'Stopped' || status === 'Draft') {
    return 'warning' as const
  }

  if (status === 'Degraded' || status === 'Failed' || status === 'Archived') {
    return 'danger' as const
  }

  return 'default' as const
}

export function mapAppToFormValues(app: AppItem): SaveAppInput {
  return {
    name: app.name,
    slug: app.slug,
    description: app.description ?? '',
    status: app.status,
    port: app.port ? String(app.port) : '',
    buildCommand: app.buildCommand ?? '',
    startCommand: app.startCommand,
    projectRootPath: app.projectRootPath ?? '',
    healthCheckPath: app.healthCheckPath,
    primaryHostname: app.primaryHostname ?? '',
  }
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.detail ? `${error.message} ${error.detail}` : error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Wystapil nieoczekiwany blad.'
}

export function formatDate(value: string) {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'Brak danych'
  }

  return parsed.toLocaleString('pl-PL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function formatRelativeDate(value: string) {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'Brak danych'
  }

  const diffMs = Date.now() - parsed.getTime()
  const minutes = Math.max(0, Math.round(diffMs / 60000))

  if (minutes < 1) {
    return 'Just now'
  }

  if (minutes < 60) {
    return `${minutes} min ago`
  }

  const hours = Math.round(minutes / 60)
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }

  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export function inferRuntime(source: Pick<SaveAppInput, 'buildCommand' | 'startCommand'>): RuntimeKind {
  const commands = `${source.buildCommand} ${source.startCommand}`.toLowerCase()

  if (commands.includes('nginx')) {
    return 'nginx'
  }

  return 'node'
}

export function getRuntimeLabel(app: AppItem) {
  return getRuntimePresetLabel(inferRuntimePreset({
    buildCommand: app.buildCommand ?? '',
    startCommand: app.startCommand,
    port: app.port ? String(app.port) : '',
  }))
}

export function getAppEndpointLabel(app: AppItem) {
  return app.primaryHostname?.trim() || 'Primary hostname not configured'
}

export function getRepositoryLabel(repository: RepositoryItem | null) {
  if (!repository) {
    return 'Repository not connected'
  }

  return `${repository.owner}/${repository.name}`
}

export function getRepositoryBranchLabel(repository: RepositoryItem | null) {
  return repository?.branch ?? 'Not configured'
}

export function getProjectRootLabel(app: AppItem) {
  return app.projectRootPath?.trim() || '.'
}

export function getDeploymentSummary(deployments: DeploymentHistoryItem[]) {
  if (deployments.length === 0) {
    return 'No deployments yet'
  }

  const latest = deployments[0]
  const commit = latest.commitSha ? latest.commitSha.slice(0, 7) : 'manual'
  return `${latest.status} • ${latest.trigger} • ${commit}`
}

export function getLatestDeployment(deployments: DeploymentHistoryItem[]) {
  return deployments[0] ?? null
}

export function formatCommitSha(commitSha: string | null) {
  return commitSha ? commitSha.slice(0, 7) : 'N/A'
}

export function formatDeploymentDate(item: DeploymentHistoryItem) {
  return formatRelativeDate(item.finishedAtUtc ?? item.startedAtUtc ?? item.createdAtUtc)
}

export const inputClassName =
  'w-full rounded-[var(--hp-radius-sm)] border border-[color:var(--hp-auth-border)] bg-[color:var(--hp-auth-bg)] px-4 py-3 outline-none transition focus:border-[color:var(--hp-accent)]'

const runtimePresetOptions: Array<{
  value: RuntimePreset
  label: string
  icon: string
  badge: string
  description: string
}> = [
  {
    value: 'static-site',
    label: 'Static Site',
    icon: 'language',
    badge: 'HTML',
    description: 'Simple static website served by Nginx with no build step and root health check.',
  },
  {
    value: 'vite-spa',
    label: 'Vite SPA',
    icon: 'web',
    badge: 'Vite',
    description: 'Frontend app built with Vite and served as a web application on port 3000.',
  },
  {
    value: 'node-api',
    label: 'Node.js API',
    icon: 'terminal',
    badge: 'Node',
    description: 'Backend service started as a Node.js process with build and runtime commands.',
  },
  {
    value: 'aspnet-api',
    label: 'ASP.NET API',
    icon: 'api',
    badge: '.NET',
    description: 'ASP.NET Core service using dotnet build and dotnet run on port 8080.',
  },
]

const statusStyles: Record<
  AppStatus,
  { className: string; dotClassName: string; label: string }
> = {
  Draft: {
    className: 'border-blue-200 bg-blue-50 text-blue-700',
    dotClassName: 'bg-blue-500',
    label: 'Pending',
  },
  Stopped: {
    className: 'border-stone-200 bg-stone-50 text-stone-500',
    dotClassName: 'bg-stone-400',
    label: 'Stopped',
  },
  Starting: {
    className: 'border-blue-200 bg-blue-50 text-blue-700',
    dotClassName: 'bg-blue-500',
    label: 'Pending',
  },
  Running: {
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dotClassName: 'bg-emerald-500',
    label: 'Running',
  },
  Degraded: {
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    dotClassName: 'bg-amber-500',
    label: 'Degraded',
  },
  Failed: {
    className: 'border-rose-200 bg-rose-50 text-rose-700',
    dotClassName: 'bg-rose-500',
    label: 'Failed',
  },
  Archived: {
    className: 'border-rose-200 bg-rose-50 text-rose-700',
    dotClassName: 'bg-rose-500',
    label: 'Archived',
  },
}

function applyRuntimePreset(
  runtimePreset: RuntimePreset,
  value: SaveAppInput,
  onChange: (nextValue: SaveAppInput) => void,
) {
  const currentPort = value.port.trim()
  const currentRoot = value.projectRootPath.trim()

  switch (runtimePreset) {
    case 'static-site':
      onChange({
        ...value,
        buildCommand: '',
        startCommand: 'nginx -g "daemon off;"',
        port: currentPort || '80',
        projectRootPath: currentRoot || '.',
        healthCheckPath: '/',
      })
      return
    case 'vite-spa':
      onChange({
        ...value,
        buildCommand: 'npm run build',
        startCommand: 'npm run preview -- --host 0.0.0.0 --port 3000',
        port: currentPort || '3000',
        projectRootPath: currentRoot || '.',
        healthCheckPath: '/',
      })
      return
    case 'node-api':
      onChange({
        ...value,
        buildCommand: 'npm run build',
        startCommand: 'npm run start',
        port: currentPort || '3000',
        projectRootPath: currentRoot || '.',
        healthCheckPath: '/health',
      })
      return
    case 'aspnet-api':
      onChange({
        ...value,
        buildCommand: 'dotnet build',
        startCommand: 'dotnet run --no-build',
        port: currentPort || '8080',
        projectRootPath: currentRoot || '.',
        healthCheckPath: '/health',
      })
  }
}

function inferRuntimePreset(source: Pick<SaveAppInput, 'buildCommand' | 'startCommand' | 'port'>): RuntimePreset {
  const buildCommand = source.buildCommand.toLowerCase()
  const startCommand = source.startCommand.toLowerCase()
  const commands = `${buildCommand} ${startCommand}`
  const port = source.port.trim()

  if (commands.includes('dotnet')) {
    return 'aspnet-api'
  }

  if (commands.includes('nginx')) {
    return 'static-site'
  }

  if (commands.includes('preview')) {
    return 'vite-spa'
  }

  if (commands.includes('npm') || commands.includes('node') || port === '3000') {
    return 'node-api'
  }

  return 'node-api'
}

function getRuntimePresetLabel(runtimePreset: RuntimePreset) {
  return runtimePresetOptions.find((option) => option.value === runtimePreset)?.label ?? 'Custom'
}
