import { Users } from "lucide-react"
import type { AudienceSegments, BuyerPersona } from "@/lib/ai/schemas/audience"
import { EmptyState } from "@/components/empty-state"
import { cn } from "@/lib/utils"

interface AudienceTabProps {
  audienceSegments: AudienceSegments | null
  buyerPersona: BuyerPersona | null
}

const PSYCHOTYPE_LABEL: Record<string, { label: string; color: string }> = {
  traditionalist: { label: "Традиционалист", color: "#3b82f6" },
  independent: { label: "Независимый", color: "#8b5cf6" },
  aesthete: { label: "Эстет", color: "#f59e0b" },
  hedonist: { label: "Гедонист", color: "#ef4444" },
}

const SEGMENT_COLORS = ["#111111", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"]

function WeightedBars({ items, color }: { items: { label: string; percent: number }[]; color: string }) {
  const max = Math.max(...items.map((i) => i.percent), 1)
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i}>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-foreground">{item.label}</span>
            <span className="text-xs font-medium text-foreground">{item.percent}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full rounded-full transition-all" style={{ width: `${(item.percent / max) * 100}%`, backgroundColor: color }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function AudienceTab({ audienceSegments, buyerPersona }: AudienceTabProps) {
  if (!audienceSegments) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <EmptyState
          icon={Users}
          title="Анализ аудитории не создан"
          description="Перейдите в «Аудитория» и нажмите «Сгенерировать» — AI проведёт сегментацию."
        />
      </div>
    )
  }

  const icpColor =
    (audienceSegments.icpMatch ?? 0) >= 70 ? "#16a34a"
      : (audienceSegments.icpMatch ?? 0) >= 40 ? "#d97706"
        : "#dc2626"

  return (
    <div className="space-y-5">
      {/* ICP metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {audienceSegments.totalAudience && (
          <div className="rounded-2xl border border-[#eaeaea] bg-white p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Объём аудитории</p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {audienceSegments.totalAudience.toLocaleString("ru-RU")}
            </p>
            <p className="text-xs text-muted-foreground">чел.</p>
          </div>
        )}
        {audienceSegments.potentialReach && (
          <div className="rounded-2xl border border-[#eaeaea] bg-white p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Потенциальный охват</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{audienceSegments.potentialReach}</p>
          </div>
        )}
        {audienceSegments.icpMatch !== undefined && (
          <div className="rounded-2xl border border-[#eaeaea] bg-white p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">ICP Match</p>
            <p className="mt-1 text-xl font-semibold" style={{ color: icpColor }}>
              {audienceSegments.icpMatch}%
            </p>
            <p className="text-xs" style={{ color: icpColor }}>{audienceSegments.icpLevel ?? ""}</p>
          </div>
        )}
        <div className="rounded-2xl border border-[#eaeaea] bg-white p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Сегментов</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{audienceSegments.segments.length}</p>
          <p className="text-xs text-muted-foreground">целевых групп</p>
        </div>
      </div>

      {/* Segments */}
      <div className="rounded-2xl border border-[#eaeaea] bg-white shadow-sm">
        <div className="border-b border-[#eaeaea] px-5 py-3">
          <p className="text-sm font-medium text-foreground">Сегменты аудитории</p>
        </div>
        <div className="divide-y divide-[#eaeaea]">
          {audienceSegments.segments.map((seg, i) => (
            <div key={i} className="p-5">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }} />
                  <span className="text-sm font-semibold text-foreground">{seg.name}</span>
                  {seg.share !== undefined && (
                    <span className="rounded-full border border-[#eaeaea] bg-neutral-50 px-2 py-0.5 text-xs text-muted-foreground">
                      {seg.share}% аудитории
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{seg.size}</span>
              </div>

              <p className="mb-3 text-sm text-muted-foreground">{seg.description}</p>

              <div className="mb-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Демография</p>
                  <p className="text-xs text-foreground">{seg.demographics}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Каналы охвата</p>
                  <div className="flex flex-wrap gap-1">
                    {seg.channels.map((ch, j) => (
                      <span key={j} className="rounded border border-[#eaeaea] bg-neutral-50 px-1.5 py-0.5 text-xs text-foreground">{ch}</span>
                    ))}
                  </div>
                </div>
              </div>

              {seg.characteristics.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {seg.characteristics.map((ch, j) => (
                    <span key={j} className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-muted-foreground">{ch}</span>
                  ))}
                </div>
              )}

              {/* Share bar */}
              {seg.share !== undefined && (
                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full rounded-full" style={{ width: `${seg.share}%`, backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Needs / Pains / Triggers */}
      {(audienceSegments.needs?.length || audienceSegments.pains?.length || audienceSegments.triggers?.length) ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {audienceSegments.needs && audienceSegments.needs.length > 0 && (
            <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
              <p className="mb-4 text-sm font-medium text-foreground">Потребности</p>
              <WeightedBars items={audienceSegments.needs} color="#3b82f6" />
            </div>
          )}
          {audienceSegments.pains && audienceSegments.pains.length > 0 && (
            <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
              <p className="mb-4 text-sm font-medium text-foreground">Боли</p>
              <WeightedBars items={audienceSegments.pains} color="#dc2626" />
            </div>
          )}
          {audienceSegments.triggers && audienceSegments.triggers.length > 0 && (
            <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
              <p className="mb-4 text-sm font-medium text-foreground">Триггеры решения</p>
              <WeightedBars items={audienceSegments.triggers} color="#16a34a" />
            </div>
          )}
        </div>
      ) : null}

      {/* Personas */}
      {buyerPersona && buyerPersona.personas.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-medium text-foreground">Buyer Personas</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {buyerPersona.personas.map((persona, i) => {
              const psycho = persona.psychotype ? PSYCHOTYPE_LABEL[persona.psychotype] : null
              return (
                <div key={i} className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{persona.name}</p>
                      <p className="text-xs text-muted-foreground">{persona.occupation} · {persona.age}</p>
                      {persona.income && <p className="text-xs text-muted-foreground">{persona.income}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {persona.share !== undefined && (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-muted-foreground">{persona.share}%</span>
                      )}
                      {psycho && (
                        <span className="rounded border px-2 py-0.5 text-xs font-medium" style={{ borderColor: `${psycho.color}30`, backgroundColor: `${psycho.color}10`, color: psycho.color }}>
                          {psycho.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {persona.quote && (
                    <blockquote className="mb-3 rounded-lg border-l-2 border-neutral-300 bg-neutral-50 px-3 py-2 text-xs italic text-muted-foreground">
                      «{persona.quote}»
                    </blockquote>
                  )}

                  <div className="grid gap-2 sm:grid-cols-2">
                    {persona.goals.length > 0 && (
                      <div>
                        <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-[#16a34a]">Цели</p>
                        {persona.goals.slice(0, 2).map((g, j) => (
                          <p key={j} className="text-xs text-muted-foreground">· {g}</p>
                        ))}
                      </div>
                    )}
                    {persona.pains.length > 0 && (
                      <div>
                        <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-[#dc2626]">Боли</p>
                        {persona.pains.slice(0, 2).map((p, j) => (
                          <p key={j} className="text-xs text-muted-foreground">· {p}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
