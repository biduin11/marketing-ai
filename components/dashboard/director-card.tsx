import Link from "next/link"
import { BotMessageSquare, AlertCircle, TrendingUp, ShieldAlert, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DirectorAnalysis } from "@/lib/ai/schemas/directorAnalysis"

interface DirectorCardProps {
  analysis: DirectorAnalysis | null
}

export function DirectorCard({ analysis }: DirectorCardProps) {
  if (!analysis) {
    return (
      <div className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BotMessageSquare className="size-4" />
          <span className="text-sm font-medium">AI Директор</span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Анализ ещё не запущен. Нажмите «Обновить» для генерации.
        </p>
      </div>
    )
  }

  const counts = [
    { label: "проблем", count: analysis.problems.length, Icon: AlertCircle, color: "text-[#dc2626]" },
    { label: "возможностей", count: analysis.opportunities.length, Icon: TrendingUp, color: "text-[#16a34a]" },
    { label: "рисков", count: analysis.risks.length, Icon: ShieldAlert, color: "text-[#d97706]" },
  ]

  const topPriority = analysis.priorities
    .sort((a, b) => a.order - b.order)[0]

  return (
    <div className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BotMessageSquare className="size-4 text-foreground" />
          <span className="text-sm font-semibold text-foreground">AI Директор</span>
        </div>
        <Link href="/director">
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
            Смотреть рекомендации
            <ChevronRight className="size-3" />
          </Button>
        </Link>
      </div>

      <div className="mt-4 flex gap-4">
        {counts.map(({ label, count, Icon, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <Icon className={`size-3.5 ${color}`} />
            <span className="text-sm font-semibold text-foreground">{count}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {topPriority && (
        <div className="mt-4 rounded-lg bg-neutral-50 px-3 py-2.5">
          <p className="text-xs font-medium text-muted-foreground">Приоритет #1</p>
          <p className="mt-0.5 text-sm text-foreground">{topPriority.action}</p>
        </div>
      )}
    </div>
  )
}
