import { Megaphone } from "lucide-react"
import { EmptyState } from "@/components/empty-state"

export default function CampaignsPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <EmptyState
        icon={Megaphone}
        title="Кампании"
        description="Управление рекламными кампаниями и их результатами. Доступно в следующих итерациях."
      />
    </div>
  )
}
