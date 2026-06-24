import { Building2 } from "lucide-react"
import { EmptyState } from "@/components/empty-state"

export default function CompanyPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <EmptyState
        icon={Building2}
        title="Анализ компании"
        description="Профиль бизнеса, позиционирование, УТП и стратегический анализ. Доступно в следующих итерациях."
      />
    </div>
  )
}
