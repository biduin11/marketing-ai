import { FileText } from "lucide-react"
import { EmptyState } from "@/components/empty-state"

export default function ReportsPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <EmptyState
        icon={FileText}
        title="Отчёты"
        description="Автоматические маркетинговые отчёты и их экспорт. Доступно в следующих итерациях."
      />
    </div>
  )
}
