import type { AudienceSegments } from "@/lib/ai/schemas/audience"

type Segment = AudienceSegments["segments"][number]

interface SegmentCardProps {
  segment: Segment
}

export function SegmentCard({ segment }: SegmentCardProps) {
  return (
    <div className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{segment.name}</h3>
        <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {segment.size}
        </span>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">{segment.description}</p>

      <div className="space-y-3 text-sm">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Демография
          </p>
          <p className="text-foreground">{segment.demographics}</p>
        </div>

        {segment.characteristics.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Характеристики
            </p>
            <ul className="space-y-1">
              {segment.characteristics.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-neutral-400" />
                  {c}
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
                  className="rounded-md border border-[#eaeaea] bg-neutral-50 px-2 py-0.5 text-xs text-foreground"
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
