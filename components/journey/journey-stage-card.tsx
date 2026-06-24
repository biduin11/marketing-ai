import type { Cjm } from "@/lib/ai/schemas/cjm"
import { cn } from "@/lib/utils"

type Stage = Cjm["stages"][number]

interface JourneyStageCardProps {
  stage: Stage
  index: number
}

const emotionConfig = {
  positive: { dot: "bg-[#16a34a]", label: "😊 Позитив" },
  neutral: { dot: "bg-[#d97706]", label: "😐 Нейтрально" },
  negative: { dot: "bg-[#dc2626]", label: "😔 Негатив" },
} as const

const churnConfig = {
  low: { cls: "bg-green-50 text-[#16a34a] border-green-200", label: "Риск: низкий" },
  medium: { cls: "bg-amber-50 text-[#d97706] border-amber-200", label: "Риск: средний" },
  high: { cls: "bg-red-50 text-[#dc2626] border-red-200", label: "Риск: высокий" },
} as const

function SectionList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-neutral-400" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function JourneyStageCard({ stage, index }: JourneyStageCardProps) {
  const emotion = emotionConfig[stage.emotion]
  const churn = churnConfig[stage.churnRisk]

  return (
    <div className="flex min-w-[220px] max-w-[260px] shrink-0 flex-col gap-3 rounded-2xl border border-[#eaeaea] bg-white p-4 shadow-sm">
      {/* Header */}
      <div>
        <div className="mb-1 flex items-center gap-1.5">
          <span className="flex size-5 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-foreground">
            {index + 1}
          </span>
          <h3 className="text-sm font-semibold text-foreground">{stage.name}</h3>
        </div>
        <p className="text-xs text-muted-foreground">{stage.description}</p>
      </div>

      {/* Emotion + Churn */}
      <div className="flex flex-wrap gap-1.5">
        <span className="flex items-center gap-1 rounded-full bg-neutral-50 border border-[#eaeaea] px-2 py-0.5 text-xs text-muted-foreground">
          <span className={cn("size-1.5 rounded-full", emotion.dot)} />
          {emotion.label}
        </span>
        <span className={cn("rounded-full border px-2 py-0.5 text-xs", churn.cls)}>
          {churn.label}
        </span>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        <SectionList title="Точки контакта" items={stage.touchpoints} />
        <SectionList title="Действия клиента" items={stage.customerActions} />
        <SectionList title="Боли" items={stage.painPoints} />
        <SectionList title="Возможности" items={stage.opportunities} />
        {stage.churnReasons.length > 0 && (
          <SectionList title="Причины ухода" items={stage.churnReasons} />
        )}
      </div>
    </div>
  )
}
