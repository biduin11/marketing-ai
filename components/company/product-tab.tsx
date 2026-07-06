"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Sparkles,
  RefreshCw,
  Loader2,
  Package,
  Award,
  TrendingUp,
  Wallet,
  Star,
  HelpCircle,
  Coins,
  Frown,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import { StatCard, StatRow } from "@/components/shared/stat-card"
import { GenerationProgress } from "@/components/shared/generation-progress"
import { runProductAnalysis } from "@/lib/actions/ai"
import { TONE_CSS_VAR, TONE_CLASSES, type StatusTone } from "@/lib/status-variants"
import type { ProductAnalysis } from "@/lib/ai/schemas/product"
import { cn } from "@/lib/utils"

interface ProductTabProps {
  projectId: string
  analysis: ProductAnalysis | null
  version: number | null
  generatedAt: string | null
}

const GEN_STEPS = [
  { id: "portfolio", label: "Оцениваю силу продуктовой линейки" },
  { id: "products", label: "Анализирую каждый продукт" },
  { id: "bcg", label: "Строю BCG-матрицу и жизненный цикл" },
  { id: "abc", label: "Провожу ABC-анализ ассортимента" },
  { id: "save", label: "Формирую стратегию и сохраняю" },
]

const TAG_VARIANT: Record<ProductAnalysis["products"][number]["tagColor"], "success" | "warning" | "danger" | "neutral" | "muted"> = {
  success: "success",
  warning: "warning",
  danger: "danger",
  neutral: "neutral",
  muted: "muted",
}

const BCG_QUADRANTS: {
  key: keyof ProductAnalysis["bcg"]
  label: string
  icon: typeof Star
  tone: StatusTone
}[] = [
  { key: "questionMarks", label: "Вопросительные знаки", icon: HelpCircle, tone: "neutral" },
  { key: "stars", label: "Звёзды", icon: Star, tone: "success" },
  { key: "dogs", label: "Собаки", icon: Frown, tone: "muted" },
  { key: "cashCows", label: "Дойные коровы", icon: Coins, tone: "warning" },
]

const DOT_CLASS: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-foreground",
  muted: "bg-muted-foreground",
}

const LIFECYCLE_ITEMS: { key: keyof ProductAnalysis["lifecycle"]; label: string; tone: StatusTone }[] = [
  { key: "new", label: "Новинки", tone: "neutral" },
  { key: "growth", label: "Рост", tone: "success" },
  { key: "mature", label: "Зрелость", tone: "warning" },
  { key: "decline", label: "Спад", tone: "danger" },
]

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function ProductTab({ projectId, analysis, version, generatedAt }: ProductTabProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [genCompleted, setGenCompleted] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)

  async function generate(force: boolean) {
    setLoading(true)
    setGenCompleted(false)
    setGenError(null)
    try {
      const result = await runProductAnalysis(projectId, force)
      if (!result.success) {
        setGenError(result.error)
        toast.error(result.error)
        return
      }
      setGenCompleted(true)
      toast.success(force ? "Анализ продуктов обновлён" : "Анализ продуктов готов")
      setTimeout(() => router.refresh(), 600)
    } catch {
      const msg = "Не удалось сгенерировать анализ продуктов"
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
          : "BCG-матрица, ABC-анализ и продуктовая стратегия"}
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
        {analysis ? "Регенерировать" : "Сгенерировать анализ продуктов"}
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
            icon={Package}
            title="Анализ продуктов не создан"
            description="Нажмите «Сгенерировать анализ продуктов» — AI построит BCG-матрицу, ABC-анализ и продуктовую стратегию по данным анкеты."
          />
        </div>
      </div>
    )
  }

  const lifecycleData = LIFECYCLE_ITEMS.map((item) => ({
    name: item.label,
    value: analysis.lifecycle[item.key],
    color: TONE_CSS_VAR[item.tone],
  }))

  return (
    <div className="space-y-6">
      {header}

      {/* Строка 1 — метрики */}
      <StatRow cols={5}>
        <StatCard
          label="Сила продуктовой линейки"
          value={`${analysis.lineStrength.score.toLocaleString("ru-RU")} / ${analysis.lineStrength.maxScore}`}
          sub={analysis.lineStrength.level}
          icon={Package}
        />
        <StatCard
          label="Средняя маржинальность"
          value={`${analysis.avgMargin.value.toLocaleString("ru-RU")}%`}
          sub={analysis.avgMargin.description}
          icon={TrendingUp}
        />
        <StatCard
          label="Лидер продукта"
          value={analysis.topProduct.name}
          sub={analysis.topProduct.reason}
          icon={Award}
        />
        <StatCard
          label="Потенциал роста"
          value={analysis.growthPotential.level}
          sub={analysis.growthPotential.period}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Потенциал выручки"
          value={analysis.revenueUpside.value}
          sub={analysis.revenueUpside.period}
          icon={Wallet}
        />
      </StatRow>

      {/* Строка 2 — продукты / BCG / инсайт */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-foreground">Продукты и услуги</h3>
          <p className="mb-4 text-xs text-muted-foreground">Ключевые категории и их эффективность</p>
          {analysis.products.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет данных</p>
          ) : (
            <div className="space-y-3">
              {analysis.products.map((p, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Package className="size-4 text-muted-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                      {p.tag && (
                        <Badge variant={TAG_VARIANT[p.tagColor]} size="sm" className="shrink-0">
                          {p.tag}
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{p.demandLevel}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">Маржа</p>
                    <p className="text-sm font-semibold text-foreground">
                      {p.margin.toLocaleString("ru-RU")}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Матрица продуктового портфеля (BCG)
          </h3>
          <div className="mb-3 grid grid-cols-2 gap-2">
            {BCG_QUADRANTS.map((q) => {
              const items = analysis.bcg[q.key]
              const tone = TONE_CLASSES[q.tone]
              return (
                <div key={q.key} className={cn("rounded-xl border p-3", tone.border, tone.bg)}>
                  <div className="mb-2 flex items-center gap-1.5">
                    <q.icon className={cn("size-3.5", tone.text)} />
                    <p className="text-xs font-medium text-muted-foreground">{q.label}</p>
                  </div>
                  <div className="space-y-1">
                    {items.length > 0 ? (
                      items.map((item) => (
                        <div key={item} className="flex items-center gap-1.5">
                          <span className={cn("size-1.5 shrink-0 rounded-full", DOT_CLASS[q.tone])} />
                          <span className="text-xs text-foreground">{item}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>← Низкая доля продаж</span>
            <span>Высокая →</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-foreground">
              <Sparkles className="size-4 text-background" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              AI Insight
            </span>
          </div>
          <p className="mb-2 text-base font-semibold leading-snug text-foreground">
            {analysis.insight.headline}
          </p>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{analysis.insight.body}</p>
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

      {/* Строка 3 — жизненный цикл / возможности / сильные+слабые / ABC */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Жизненный цикл продуктов</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie
                  data={lifecycleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  dataKey="value"
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {lifecycleData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: unknown) => [`${v}%`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5">
              {lifecycleData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: item.color }}
                  />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                  <span className="ml-auto text-xs font-semibold text-foreground">
                    {item.value.toLocaleString("ru-RU")}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Распределение продуктов по стадии жизненного цикла
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Возможности развития</h3>
          <div className="space-y-2">
            {analysis.developmentOpportunities.slice(0, 5).map((o, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="min-w-0 flex-1 text-xs leading-snug text-foreground">{o.title}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <div className="h-1.5 w-16 rounded-full bg-muted">
                    <div className="h-1.5 rounded-full bg-success" style={{ width: `${o.score}%` }} />
                  </div>
                  <span className="w-6 text-xs font-semibold text-foreground">
                    {o.score.toLocaleString("ru-RU")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Сильные стороны продукта</h3>
          <ul className="mb-4 space-y-2">
            {analysis.productStrengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />
                {s}
              </li>
            ))}
          </ul>
          <div className="border-t border-border pt-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Зоны роста и проблемы</h3>
            <ul className="space-y-2">
              {analysis.growthZones.map((g, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Анализ ассортимента</h3>
          <div className="mb-4 grid grid-cols-4 gap-2">
            {[
              { label: "Всего SKU", value: analysis.abc.totalSku },
              { label: "Категорий", value: analysis.abc.categories },
              { label: "Хиты продаж", value: analysis.abc.topSellers },
              { label: "Неликвид", value: analysis.abc.nonLiquid },
            ].map((m) => (
              <div key={m.label} className="text-center">
                <p className="text-lg font-bold text-foreground">
                  {m.value != null ? m.value.toLocaleString("ru-RU") : "—"}
                </p>
                <p className="text-xs leading-tight text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
          <div className="mb-4 space-y-2">
            {[
              { label: "A", value: analysis.abc.aShare, cls: "bg-success" },
              { label: "B", value: analysis.abc.bShare, cls: "bg-foreground" },
              { label: "C", value: analysis.abc.cShare, cls: "bg-warning" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="w-4 text-xs font-semibold text-foreground">{item.label}</span>
                <div className="h-2 flex-1 rounded-full bg-muted">
                  <div className={cn("h-2 rounded-full", item.cls)} style={{ width: `${item.value}%` }} />
                </div>
                <span className="w-8 text-right text-xs text-muted-foreground">
                  {item.value.toLocaleString("ru-RU")}%
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              AI рекомендует
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {analysis.aiRecommendations.slice(0, 4).map((r, i) => (
                <div key={i} className="flex items-start gap-1.5 rounded-lg border border-border bg-muted/40 p-2">
                  <span className="mt-0.5 shrink-0 text-xs text-muted-foreground">→</span>
                  <span className="text-xs leading-snug text-foreground">{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Строка 4 — продуктовая стратегия */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Продуктовая стратегия AI</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {analysis.productStrategy.summary}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="mb-1 text-xs text-muted-foreground">Вероятность успеха стратегии</p>
            <div className="flex items-center gap-3">
              <div className="h-2 w-32 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-foreground"
                  style={{ width: `${analysis.productStrategy.successProbability}%` }}
                />
              </div>
              <span className="text-lg font-bold tabular-nums text-foreground">
                {analysis.productStrategy.successProbability.toLocaleString("ru-RU")}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
