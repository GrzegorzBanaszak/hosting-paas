import type { HTMLAttributes, ReactNode } from 'react'

export function Card({
  className = '',
  children,
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}) {
  return (
    <section
      className={`overflow-hidden rounded-[var(--hp-radius-md)] border border-[color:var(--hp-border)] bg-[color:var(--hp-surface)] shadow-[var(--hp-shadow)] ${className}`.trim()}
    >
      {children}
    </section>
  )
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[color:var(--hp-border)] bg-[color:var(--hp-surface-strong)] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-[20px] font-semibold tracking-tight">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-[14px] text-[color:var(--hp-text-muted)]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  )
}

export function CardContent({
  className = '',
  children,
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}) {
  return <div className={`px-5 py-5 ${className}`.trim()}>{children}</div>
}
