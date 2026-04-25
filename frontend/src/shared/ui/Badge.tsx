import type { ReactNode } from 'react'

const tones = {
  default:
    'border-[color:var(--hp-border)] bg-[#e2e8f0] text-[color:var(--hp-text)]',
  success:
    'border-emerald-200 bg-[color:var(--hp-success-soft)] text-[color:var(--hp-success)]',
  warning: 'border-blue-200 bg-[#eff6ff] text-[#2563eb]',
  danger:
    'border-rose-200 bg-[color:var(--hp-danger-soft)] text-[color:var(--hp-danger)]',
}

export function Badge({
  tone = 'default',
  children,
}: {
  tone?: keyof typeof tones
  children: ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-['Space_Grotesk'] text-[12px] font-medium ${tones[tone]}`}
    >
      <span className="h-2 w-2 rounded-full bg-current opacity-80" />
      {children}
    </span>
  )
}
