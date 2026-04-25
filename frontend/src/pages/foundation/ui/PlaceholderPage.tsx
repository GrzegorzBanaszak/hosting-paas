import { Badge } from '../../../shared/ui/Badge'
import { Button } from '../../../shared/ui/Button'
import { Card, CardContent, CardHeader } from '../../../shared/ui/Card'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { PageHeader } from '../../../shared/ui/PageHeader'

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  highlights,
}: {
  eyebrow: string
  title: string
  description: string
  highlights: string[]
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={<Button kind="secondary">Coming soon</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {highlights.map((item) => (
          <Card key={item}>
            <CardContent className="space-y-3">
              <Badge tone="default">Planned</Badge>
              <h2 className="text-[20px] font-semibold">{item}</h2>
              <p className="text-[14px] text-[color:var(--hp-text-muted)]">
                Layout i routing sa juz gotowe, wiec ten modul mozna wypelniac bez ruszania globalnego shella.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Empty state" subtitle="Wspolny komponent UI do pustych widokow i etapow w budowie." />
        <CardContent>
          <EmptyState
            title={`Modul ${title.toLowerCase()} jest w przygotowaniu`}
            description="Strona dziala juz w docelowym layoucie z topbarem, sidebarem i toasterem."
            action={<Button>Keep building</Button>}
          />
        </CardContent>
      </Card>
    </div>
  )
}
