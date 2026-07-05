"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Sparkles,
  RefreshCw,
  Loader2,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Wallet,
  Target,
  Star,
  MapPin,
  ShieldAlert,
  Lightbulb,
  CheckCircle2,
  FileText,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import { StatCard, StatRow } from "@/components/shared/stat-card"
import { GenerationProgress } from "@/components/shared/generation-progress"
import { runMarketAnalysis } from "@/lib/actions/ai"
import type { MarketAnalysis } from "@/lib/ai/schemas/market"
import { cn } from "@/lib/utils"

interface MarketTabProps {
  projectId: string
  analysis: MarketAnalysis | null
  version: number | null
  generatedAt: string | null
}

const GEN_STEPS = [
  { id: "size", label: "Ищу размер и рост рынка" },
  { id: "competitors", label: "Оцениваю конкурентов в регионе" },
  { id: "threats", label: "Анализирую угрозы и возможности" },
  { id: "dynamics", label: "Строю динамику спроса и цен" },
  { id: "save", label: "Формирую инсайты и сохраняю" },
]

const THREAT_TONE: Record<string, string> = {
  critical: "bg-danger",
  high: "bg-danger/70",
  medium: "bg-warning",
  low: "bg-muted-foreground",
}

const THREAT_BADGE: Record<string, "danger" | "warning"> = {
  critical: "danger",
  high: "danger",
  medium: "warning",
  low: "warning",
}

const THREAT_LABEL: Record<string, string> = {
  critical: "Критично",
  high: "Высоко",
  medium: "Средне",
  low: "Низко",
}

const IMPACT_BADGE: Record<string, "danger" | "warning" | "muted"> = {
  high: "danger",
  medium: "warning",
  low: "muted",
}

const IMPACT_LABEL: Record<string, string> = {
  high: "Высоко",
  medium: "Средне",
  low: "Низко",
}

const PRIORITY_BADGE: Record<string, "success" | "muted"> = {
  high: "success",
  medium: "muted",
  low: "muted",
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function MiniLineChart({ data }: { data: { month: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--foreground)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function TrendIcon({ trend }: { trend: "up" | "down" | "neutral" }) {
  if (trend === "up") return <TrendingUp className="mt-0.5 size-4 shrink-0 text-success" />
  if (trend === "down") return <TrendingDown className="mt-0.5 size-4 shrink-0 text-danger" />
  return <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
}

export function MarketTab({ projectId, analysis, version, generatedAt }: MarketTabProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [genCompleted, setGenCompleted] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)

  async function generate(force: boolean) {
    setLoading(true)
    setGenCompleted(false)
    setGenError(null)
    try {
      const result = await runMarketAnalysis(projectId, force)
      if (!result.success) {
        setGenError(result.error)
        toast.error(result.error)
        return
      }
      setGenCompleted(true)
      toast.success(force ? "Анализ рынка обновлён" : "Анализ рынка готов")
      setTimeout(() => router.refresh(), 600)
    } catch {
      const msg = "Не удалось сгенерировать анализ рынка"
      setGenError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        {generatedAt
          ? `Обновлено ${fmtDate(generatedAt)}${version ? ` · версия ${version}` : ""}`
          : "Анализ рынка по данным веб-поиска"}
      </p>
      <Button
        variant={analysis ? "outline" : "default"}
        size="sm"
        onClick={() => generate(!!analysis)}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : analysis ? (
          <RefreshCw className="size-3.5" />
        ) : (
          <Sparkles className="size-3.5" />
        )}
        {analysis ? "Регенерировать" : "Сгенерировать анализ рынка"}
      </Button>
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        {header}
        <GenerationProgress steps={GEN_STEPS} completed={genCompleted} error={genError} />
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="space-y-6">
        {header}
        <div className="flex min-h-[50vh] items-center justify-center">
          <EmptyState
            icon={BarChart3}
            title="Анализ рынка не создан"
            description="Нажмите «Сгенерировать анализ рынка» — AI оценит размер рынка, конкурентов, угрозы и сезонность на основе веб-поиска."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {header}

      {/* Строка 1 — метрики */}
      <StatRow cols={6}>
        <StatCard
          label="Размер рынка"
          value={analysis.marketSize.value}
          sub={`${analysis.marketSize.region} · ${analysis.marketSize.period}`}
          icon={BarChart3}
        />
        <StatCard
          label="Рост рынка"
          value={analysis.marketGrowth.value}
          sub={analysis.marketGrowth.period}
          icon={analysis.marketGrowth.trend === "down" ? TrendingDown : TrendingUp}
          tone={
            analysis.marketGrowth.trend === "up"
              ? "success"
              : analysis.marketGrowth.trend === "down"
                ? "danger"
                : "default"
          }
        />
        <StatCard
          label="Конкурентов"
          value={analysis.competitorsCount.value.toLocaleString("ru-RU")}
          sub={analysis.competitorsCount.description}
          icon={Users}
        />
        <StatCard
          label="Средний чек"
          value={analysis.avgCheck.value}
          sub={analysis.avgCheck.description}
          icon={Wallet}
        />
        <StatCard
          label="Маржинальность"
          value={analysis.avgMargin.value}
          sub={analysis.avgMargin.description}
          icon={Target}
        />
        <StatCard
          label="Привлекательность"
          value={`${analysis.attractiveness.score.toLocaleString("ru-RU")}/100`}
          sub={analysis.attractiveness.level}
          icon={Star}
          tone="warning"
        />
      </StatRow>

      {/* Строка 2 — регионы / угрозы+возможности / инсайт */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Регионы */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Регионы</h3>
          {analysis.regions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет данных</p>
          ) : (
            <div className="space-y-3">
              {analysis.regions.map((r, i) => (
                <div key={i} className="rounded-xl border border-border p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{r.name}</span>
                    <Badge
                      variant={PRIORITY_BADGE[r.priority]}
                      size="sm"
                      className="ml-auto"
                    >
                      {r.type}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                    <span>Население: {r.population}</span>
                    <span>Ёмкость: {r.marketCapacity}</span>
                  </div>
                  {r.notes && (
                    <div className="mt-2 flex items-start gap-1.5">
                      <Star className="mt-0.5 size-3 shrink-0 fill-warning text-warning" />
                      <span className="text-xs text-warning">{r.notes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Угрозы + Возможности */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-danger/10">
                <ShieldAlert className="size-4 text-danger" />
              </span>
              <h3 className="text-sm font-semibold text-foreground">Угрозы рынка</h3>
            </div>
            <div className="space-y-2">
              {analysis.threats.slice(0, 5).map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate text-xs text-muted-foreground">
                    {t.title}
                  </span>
                  <div className="h-2 flex-1 rounded-full bg-muted">
                    <div
                      className={cn("h-2 rounded-full", THREAT_TONE[t.level])}
                      style={{ width: `${t.score}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-sm font-medium tabular-nums text-foreground">
                    {t.score.toLocaleString("ru-RU")}
                  </span>
                  <Badge variant={THREAT_BADGE[t.level]} size="sm" className="w-16 shrink-0 justify-center">
                    {THREAT_LABEL[t.level]}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-success/10">
                <Lightbulb className="size-4 text-success" />
              </span>
              <h3 className="text-sm font-semibold text-foreground">Возможности рынка</h3>
            </div>
            <div className="space-y-2">
              {analysis.opportunities.slice(0, 5).map((o, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate text-xs text-muted-foreground">
                    {o.title}
                  </span>
                  <div className="h-2 flex-1 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-success" style={{ width: `${o.score}%` }} />
                  </div>
                  <span className="w-8 shrink-0 text-right text-sm font-medium tabular-nums text-foreground">
                    {o.score.toLocaleString("ru-RU")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insight */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-foreground">
              <Sparkles className="size-4 text-background" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              AI Insight
            </span>
          </div>

          <p className="mb-2 text-base font-semibold text-foreground">{analysis.insight.headline}</p>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{analysis.insight.body}</p>

          <div className="mb-4">
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted-foreground">Вероятность роста рынка</span>
              <span className="font-semibold text-foreground">
                {analysis.insight.growthProbability.toLocaleString("ru-RU")}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-foreground"
                style={{ width: `${analysis.insight.growthProbability}%` }}
              />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Рекомендации AI
            </p>
            <ul className="space-y-1.5">
              {analysis.insight.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Строка 3 — спрос / цены / события */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Динамика спроса</h3>
            <span className="text-xs text-muted-foreground">За последний год</span>
          </div>
          <MiniLineChart data={analysis.demandDynamics} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Ценовая динамика</h3>
            <span className="text-xs text-muted-foreground">Индекс, база 100</span>
          </div>
          <MiniLineChart data={analysis.priceDynamics} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-foreground">Последние изменения рынка</h3>
          {analysis.recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет данных</p>
          ) : (
            <div>
              {analysis.recentEvents.map((e, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 border-b border-border py-2 last:border-0"
                >
                  <TrendIcon trend={e.trend} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{e.date}</p>
                    <p className="text-sm leading-snug text-foreground">{e.title}</p>
                  </div>
                  <Badge variant={IMPACT_BADGE[e.impact]} size="sm" className="shrink-0">
                    {IMPACT_LABEL[e.impact]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
