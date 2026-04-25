import { RouterLink } from '../../../app/router'
import { Card, CardContent } from '../../../shared/ui/Card'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-xl">
        <CardContent className="space-y-4 p-8 text-center">
          <div className="font-['Space_Grotesk'] text-[12px] font-bold uppercase tracking-[0.24em] text-[color:var(--hp-accent)]">
            404
          </div>
          <h1 className="text-[24px] font-semibold tracking-tight">Nie znaleziono widoku</h1>
          <p className="text-[14px] text-[color:var(--hp-text-muted)]">
            Trasa nie istnieje albo jeszcze nie zostala podlaczona do panelu administracyjnego.
          </p>
          <RouterLink
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-transparent bg-[linear-gradient(135deg,#d97706,#b86212)] px-4 py-2.5 text-[14px] font-medium text-white transition hover:brightness-105"
          >
            Wroc do dashboardu
          </RouterLink>
        </CardContent>
      </Card>
    </div>
  )
}
