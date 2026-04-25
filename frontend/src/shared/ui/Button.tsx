import type { ButtonHTMLAttributes, ReactNode } from 'react'

const variants = {
  primary:
    'border-transparent bg-[color:var(--hp-accent)] text-white hover:bg-[color:var(--hp-accent-strong)]',
  secondary:
    'border-[color:var(--hp-border)] bg-white text-[color:var(--hp-text)] hover:border-[color:var(--hp-border-strong)]',
  ghost:
    'border-transparent bg-transparent text-[color:var(--hp-accent)] hover:underline',
}

export function Button({
  kind = 'primary',
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  kind?: keyof typeof variants
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-lg border px-4 py-2.5 text-[14px] font-medium transition active:scale-[0.99] ${variants[kind]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}
