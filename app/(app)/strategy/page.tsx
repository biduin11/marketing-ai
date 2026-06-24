import { ChartLine } from "lucide-react"
import { EmptyState } from "@/components/empty-state"

export default function StrategyPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <EmptyState
        icon={ChartLine}
        title="Стратегия"
        description="Маркетинговая стратегия, каналы продвижения и KPI. Доступно в следующих итерациях."
      />
    </div>
  )
}
