import { BarChart3 } from "lucide-react"
import { EmptyState } from "@/components/empty-state"

export default function AnalyticsPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <EmptyState
        icon={BarChart3}
        title="Аналитика"
        description="Метрики, дашборды и визуализация данных. Доступно в следующих итерациях."
      />
    </div>
  )
}
