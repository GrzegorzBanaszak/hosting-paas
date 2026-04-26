import type { FormEvent, ReactNode } from 'react'
import {
  type AppItem,
  type AppStatus,
  type SaveAppInput,
} from '../../../features/apps/model/types'
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

export function AppForm({
  value,
  error,
  onChange,
  onSubmit,
}: {
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
        icon="source"
        title="Repo Settings"
        contentClassName="grid gap-6 md:grid-cols-3"
      >
        <Field label="Repository URL" className="md:col-span-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[18px] text-[color:var(--hp-text-muted)]">
              link
            </span>
            <input
              value={value.projectRootPath}
              onChange={(event) => setField('projectRootPath', event.target.value)}
              className="w-full rounded-[var(--hp-radius-sm)] border border-[color:var(--hp-auth-border)] bg-[color:var(--hp-auth-bg)] py-3 pl-12 pr-4 outline-none transition focus:border-[color:var(--hp-accent)]"
              placeholder="github.com/org/app-repository"
            />
          </div>
        </Field>

        <Field label="Deployment Branch">
          <select value="main" className={inputClassName} disabled>
            <option value="main">main</option>
          </select>
        </Field>
      </FormSection>

      <FormSection
        icon="memory"
        title="Runtime Config"
        contentClassName="grid gap-6 md:grid-cols-2"
      >
        <Field label="Runtime">
          <div className="grid grid-cols-2 gap-3">
            {runtimeOptions.map((option) => {
              const selected = option.value === runtime

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => applyRuntimePreset(option.value, value, onChange)}
                  className={`flex flex-col items-center gap-2 rounded-[var(--hp-radius-sm)] border px-4 py-4 transition ${
                    selected
                      ? 'border-[color:var(--hp-accent-strong)] bg-[color:var(--hp-accent-soft)] text-[color:var(--hp-accent-strong)]'
                      : 'border-[color:var(--hp-auth-border)] bg-white hover:border-[color:var(--hp-accent)]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px]">{option.icon}</span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.08em]">
                    {option.label}
                  </span>
                </button>
              )
            })}
          </div>
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

        <Field label="Build Command">
          <input
            value={value.buildCommand}
            onChange={(event) => setField('buildCommand', event.target.value)}
            className={`${inputClassName} font-mono text-[13px]`}
            placeholder="npm run build"
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
      </FormSection>

      <FormSection
        icon="variables"
        title="Environment Variables"
        headerAction={
          <button
            type="button"
            className="inline-flex items-center gap-1 font-['Space_Grotesk'] text-[12px] font-bold uppercase tracking-[0.12em] text-[color:var(--hp-accent-strong)]"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Variable
          </button>
        }
        contentClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[color:var(--hp-auth-border)] bg-[rgba(255,241,233,0.5)]">
                <th className="px-6 py-4 font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.12em] text-[color:var(--hp-text-muted)]">
                  Key
                </th>
                <th className="px-6 py-4 font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.12em] text-[color:var(--hp-text-muted)]">
                  Value
                </th>
                <th className="w-16 px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(233,200,171,0.45)]">
              {buildEnvPreview(value).map((entry, index) => (
                <tr key={entry.key} className={index % 2 === 1 ? 'bg-[rgba(251,249,246,0.85)]' : ''}>
                  <td className="px-6 py-5 font-mono text-[14px]">{entry.key}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 font-mono text-[14px]">
                      <span className="flex-1 truncate">{entry.value}</span>
                      {entry.masked ? (
                        <span className="material-symbols-outlined text-[18px] text-[color:var(--hp-text-muted)]">
                          visibility
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right text-[color:var(--hp-text-muted)]">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
  const runtime = inferRuntime({
    buildCommand: app.buildCommand ?? '',
    startCommand: app.startCommand,
  })

  if (runtime === 'nginx') {
    return 'Nginx'
  }

  return app.port && app.port >= 4000 ? 'Node.js 20.x' : 'Node.js 18.x'
}

export function getEnvironmentLabel(app: AppItem) {
  return app.status === 'Running' || app.status === 'Failed' ? 'Production' : 'Staging'
}

export function getRepositoryLabel(app: AppItem) {
  if (app.projectRootPath && app.projectRootPath.includes('github.com')) {
    return app.projectRootPath
  }

  return app.hasRepository
    ? `github.com/org/${app.slug}`
    : 'Repository not connected'
}

export function getBranchLabel(app: AppItem) {
  if (app.status === 'Stopped') {
    return 'staging'
  }

  if (app.status === 'Starting') {
    return 'feat/ui-overhaul'
  }

  return 'main'
}

export function buildDeploymentRows(app: AppItem) {
  return [
    {
      id: `dep_${app.slug.slice(0, 4)}_001`,
      commit: app.buildCommand ? app.buildCommand : `feat: bootstrap ${app.slug}`,
      status: app.status === 'Failed' ? 'Failed' : 'Succeeded',
      triggeredBy: app.status === 'Running' ? 'CI/CD Pipeline' : 'system',
      date: formatRelativeDate(app.updatedAtUtc),
    },
    {
      id: `dep_${app.slug.slice(0, 4)}_002`,
      commit: `fix: tune ${app.healthCheckPath}`,
      status: 'Succeeded',
      triggeredBy: 'jane.doe@infra.io',
      date: formatRelativeDate(app.createdAtUtc),
    },
    {
      id: `dep_${app.slug.slice(0, 4)}_003`,
      commit: `docs: update ${app.slug}`,
      status: app.status === 'Archived' ? 'Failed' : 'Succeeded',
      triggeredBy: 'CI/CD Pipeline',
      date: '1d ago',
    },
  ]
}

export const inputClassName =
  'w-full rounded-[var(--hp-radius-sm)] border border-[color:var(--hp-auth-border)] bg-[color:var(--hp-auth-bg)] px-4 py-3 outline-none transition focus:border-[color:var(--hp-accent)]'

const runtimeOptions: Array<{ value: RuntimeKind; label: string; icon: string }> = [
  { value: 'nginx', label: 'Nginx', icon: 'public' },
  { value: 'node', label: 'Node.js', icon: 'javascript' },
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
  runtime: RuntimeKind,
  value: SaveAppInput,
  onChange: (nextValue: SaveAppInput) => void,
) {
  const currentPort = value.port.trim()

  if (runtime === 'nginx') {
    onChange({
      ...value,
      buildCommand: 'docker build -t app .',
      startCommand: 'nginx -g "daemon off;"',
      port: currentPort || '80',
    })
    return
  }

  onChange({
    ...value,
    buildCommand: 'npm run build',
    startCommand: 'npm start',
    port: currentPort || '3000',
  })
}

function buildEnvPreview(value: SaveAppInput) {
  return [
    {
      key: 'DATABASE_URL',
      value: '................................................',
      masked: true,
    },
    {
      key: 'JWT_SECRET',
      value: '............................',
      masked: true,
    },
    {
      key: 'NODE_ENV',
      value:
        value.status === 'Running' || value.status === 'Failed' ? 'production' : 'staging',
      masked: false,
    },
  ]
}
