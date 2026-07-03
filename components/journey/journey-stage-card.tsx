import type { Cjm } from "@/lib/ai/schemas/cjm"

type Stage = Cjm["stages"][number]

interface JourneyStageCardProps {
  stage: Stage
  index: number
}

const emotionConfig = {
  positive: { label: "Позитивно",  color: "bg-success/10 text-success border-success/20" },
  neutral:  { label: "Нейтрально", color: "bg-gray-50 text-gray-600 border-gray-200" },
  negative: { label: "Негативно",  color: "bg-danger/10 text-danger border-danger/20" },
} as const

const riskConfig = {
  low:    { label: "Риск: низкий",  color: "bg-success/10 text-success border-success/20" },
  medium: { label: "Риск: средний", color: "bg-warning/10 text-warning border-warning/20" },
  high:   { label: "Риск: высокий", color: "bg-danger/10 text-danger border-danger/20" },
} as const

function SectionList({
  icon,
  title,
  items,
  colSpan,
}: {
  icon: string
  title: string
  items: string[]
  colSpan?: string
}) {
  if (!items?.length) return null
  return (
    <div className={colSpan}>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#6b7280]">
        {icon} {title}
      </p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-[#111]">
            <span className="mt-0.5 shrink-0 text-[#6b7280]">•</span>
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function JourneyStageCard({ stage, index }: JourneyStageCardProps) {
  const emotion = emotionConfig[stage.emotion] ?? emotionConfig.neutral
  const risk    = riskConfig[stage.churnRisk]  ?? riskConfig.low

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      {/* Заголовок */}
      <div className="mb-2 flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-[#111]">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-snug text-[#111]">
            {stage.name}
          </h3>
          {stage.description && (
            <p className="mt-1 text-sm leading-relaxed text-[#6b7280]">
              {stage.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <span className={`rounded-full border px-2 py-1 text-xs ${emotion.color}`}>
            {emotion.label}
          </span>
          <span className={`rounded-full border px-2 py-1 text-xs ${risk.color}`}>
            {risk.label}
          </span>
        </div>
      </div>

      {/* Разделитель */}
      <div className="my-4 border-t border-border" />

      {/* Сетка секций */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <SectionList icon="🎯" title="Действия клиента" items={stage.customerActions} />
        <SectionList icon="📍" title="Точки контакта"   items={stage.touchpoints} />
        <SectionList icon="⚡" title="Боли и барьеры"   items={stage.painPoints} />
        <SectionList icon="🚪" title="Причины ухода"    items={stage.churnReasons} />
        <SectionList
          icon="💡"
          title="Возможности"
          items={stage.opportunities}
          colSpan="md:col-span-2"
        />
      </div>
    </div>
  )
}
