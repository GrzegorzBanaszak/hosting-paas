import type { ReactNode } from 'react'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-[var(--hp-radius-md)] border border-dashed border-[color:var(--hp-border-strong)] bg-[color:var(--hp-surface-strong)] px-6 py-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-[color:var(--hp-accent-soft)] font-['Space_Grotesk'] text-lg font-bold text-[color:var(--hp-accent)]">
        hp
      </div>
      <h3 className="text-[20px] font-semibold tracking-tight">{title}</h3>
      <p className="mx-auto mt-2 max-w-2xl text-[14px] text-[color:var(--hp-text-muted)]">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
