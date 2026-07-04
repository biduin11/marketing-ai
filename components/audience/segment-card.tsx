import type { AudienceSegments } from "@/lib/ai/schemas/audience"

type Segment = AudienceSegments["segments"][number]

interface SegmentCardProps {
  segment: Segment
}

export function SegmentCard({ segment }: SegmentCardProps) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
      {/* Заголовок */}
      <h3 className="mb-1 text-base font-semibold leading-snug text-foreground">
        {segment.name}
      </h3>

      {/* Размер / доля рынка */}
      {segment.size && (
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          {segment.size}
        </p>
      )}

      {/* Описание */}
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
        {segment.description}
      </p>

      {/* Секции */}
      <div className="mt-auto space-y-3">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Демография
          </p>
          <p className="text-sm leading-relaxed text-foreground">{segment.demographics}</p>
        </div>

        {segment.characteristics.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Характеристики
            </p>
            <ul className="mt-1 space-y-1">
              {segment.characteristics.map((c, i) => (
                <li key={i} className="flex gap-2 text-sm text-foreground">
                  <span className="mt-0.5 shrink-0 text-muted-foreground">•</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {segment.channels.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Каналы
            </p>
            <div className="flex flex-wrap gap-1.5">
              {segment.channels.map((ch, i) => (
                <span
                  key={i}
                  className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs text-foreground"
                >
                  {ch}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
