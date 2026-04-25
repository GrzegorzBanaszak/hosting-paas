import type { ReactNode } from 'react'

export function PageHeader({
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
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div className="flex items-center gap-2 text-[14px] text-[color:var(--hp-text-muted)]">
          <span>{eyebrow}</span>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="font-medium text-[color:var(--hp-text)]">{title}</span>
        </div>
        <h1 className="mt-3 text-[24px] font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[color:var(--hp-text-muted)]">
          {description}
        </p>
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  )
}
