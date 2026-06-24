import { Settings } from "lucide-react"
import { EmptyState } from "@/components/empty-state"

export default function SettingsPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <EmptyState
        icon={Settings}
        title="Настройки"
        description="Настройки аккаунта, интеграции и параметры проекта. Доступно в следующих итерациях."
      />
    </div>
  )
}
