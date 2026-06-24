import { LayoutList } from "lucide-react"
import { EmptyState } from "@/components/empty-state"

export default function ContentPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <EmptyState
        icon={LayoutList}
        title="Контент-план"
        description="Генерация контент-плана, идеи постов и тем. Доступно в следующих итерациях."
      />
    </div>
  )
}
