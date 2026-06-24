"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DirectorCard } from "@/components/dashboard/director-card"
import { MetricsSummary } from "@/components/dashboard/metrics-summary"
import { TopChannels } from "@/components/dashboard/top-channels"
import { runDirectorAnalysis } from "@/lib/actions/ai"
import type { DirectorAnalysis } from "@/lib/ai/schemas/directorAnalysis"
import type { MetricSummary, ChannelMetrics } from "@/lib/services/analytics.service"

interface DashboardViewProps {
  projectId: string
  projectName: string
  analysis: DirectorAnalysis | null
  summary: MetricSummary | null
  channels: ChannelMetrics[]
}

export function DashboardView({
  projectId,
  projectName,
  analysis,
  summary,
  channels,
}: DashboardViewProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRefresh() {
    setLoading(true)
    try {
      const result = await runDirectorAnalysis(projectId, true)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success("Анализ обновлён")
      router.refresh()
    } catch {
      toast.error("Не удалось обновить анализ")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{projectName}</h2>
          <p className="text-sm text-muted-foreground">Дашборд проекта</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          Обновить
        </Button>
      </div>

      <DirectorCard analysis={analysis} />
      <MetricsSummary summary={summary} />
      <TopChannels channels={channels} />
    </div>
  )
}
