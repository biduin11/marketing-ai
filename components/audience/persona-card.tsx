import type { BuyerPersona } from "@/lib/ai/schemas/audience"

type Persona = BuyerPersona["personas"][number]

interface PersonaCardProps {
  persona: Persona
}

function ListItems({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
          {item}
        </li>
      ))}
    </ul>
  )
}

export function PersonaCard({ persona }: PersonaCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4 border-b border-border pb-4">
        <div className="flex items-baseline gap-3">
          <h3 className="text-base font-semibold text-foreground">{persona.name}</h3>
          <span className="text-sm text-muted-foreground">
            {persona.age} · {persona.occupation}
          </span>
        </div>
        {persona.quote && (
          <p className="mt-2 text-sm italic text-muted-foreground">
            &laquo;{persona.quote}&raquo;
          </p>
        )}
      </div>

      {/* 3-column grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Цели
          </p>
          <ListItems items={persona.goals} />
          {persona.desires.length > 0 && (
            <>
              <p className="mb-2 mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Желания
              </p>
              <ListItems items={persona.desires} />
            </>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Боли
          </p>
          <ListItems items={persona.pains} />
          {persona.fears.length > 0 && (
            <>
              <p className="mb-2 mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Страхи
              </p>
              <ListItems items={persona.fears} />
            </>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Триггеры
          </p>
          <ListItems items={persona.triggers} />
          {persona.objections.length > 0 && (
            <>
              <p className="mb-2 mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Возражения
              </p>
              <ListItems items={persona.objections} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
