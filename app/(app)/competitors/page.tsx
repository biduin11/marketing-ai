import { Crosshair } from "lucide-react"
import { EmptyState } from "@/components/empty-state"

export default function CompetitorsPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <EmptyState
        icon={Crosshair}
        title="Конкуренты"
        description="Анализ конкурентов, их позиционирования и слабых мест. Доступно в следующих итерациях."
      />
    </div>
  )
}
