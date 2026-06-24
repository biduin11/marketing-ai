import { Users } from "lucide-react"
import { EmptyState } from "@/components/empty-state"

export default function AudiencePage() {
  return (
    <div className="flex h-full items-center justify-center">
      <EmptyState
        icon={Users}
        title="Аудитория"
        description="Сегменты целевой аудитории, персонажи и карта пути клиента. Доступно в следующих итерациях."
      />
    </div>
  )
}
