import { useToast } from './ToastContext'

const toneClasses = {
  default: 'border-[color:var(--hp-border)] bg-[color:var(--hp-surface-strong)]',
  success: 'border-emerald-200 bg-[color:var(--hp-success-soft)]',
  danger: 'border-rose-200 bg-[color:var(--hp-danger-soft)]',
}

export function Toaster() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-[1.5rem] border px-4 py-4 shadow-[var(--hp-shadow)] ${toneClasses[toast.tone ?? 'default']}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium">{toast.title}</div>
              {toast.description ? (
                <p className="mt-1 text-[14px] text-[color:var(--hp-text-muted)]">{toast.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="rounded-full p-1 text-[color:var(--hp-text-muted)] transition hover:bg-white/60"
              onClick={() => removeToast(toast.id)}
            >
              x
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
