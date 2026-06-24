import { BotMessageSquare } from "lucide-react"
import { EmptyState } from "@/components/empty-state"

export default function DirectorPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <EmptyState
        icon={BotMessageSquare}
        title="AI Директор"
        description="Персональный AI-маркетолог, который анализирует данные и даёт стратегические рекомендации. Доступно в следующих итерациях."
      />
    </div>
  )
}
