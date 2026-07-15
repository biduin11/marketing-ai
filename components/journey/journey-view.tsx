"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Sparkles,
  RefreshCw,
  Loader2,
  Route,
  Download,
  Calendar,
  ChevronDown,
  Map,
  Phone,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Target,
  Smile,
  Users,
  ArrowRight,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { runCjm } from "@/lib/actions/ai"
import type { Cjm } from "@/lib/ai/schemas/cjm"

interface JourneyViewProps {
  projectId: string
  cjm: Cjm | null
  version: number | null
  cjmCreatedAt: string | null
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function getEmotionScore(stage: Cjm["stages"][0]): number {
  if (stage.emotionScore != null) return stage.emotionScore
  return stage.emotion === "positive" ? 4 : stage.emotion === "neutral" ? 2.5 : 1.5
}

function getEmotionEmoji(score: number): string {
  if (score >= 4.5) return "😄"
  if (score >= 3.5) return "😊"
  if (score >= 2.5) return "😐"
  if (score >= 1.5) return "😕"
  return "😞"
}

function getEmotionLabel(stage: Cjm["stages"][0]): string {
  if (stage.emotionLabel) return stage.emotionLabel
  const score = getEmotionScore(stage)
  if (score >= 4.5) return "Восторг"
  if (score >= 3.5) return "Доволен"
  if (score >= 2.5) return "Нейтрально"
  if (score >= 1.5) return "Сомневается"
  return "Недоволен"
}

interface EmotionChartPoint {
  label: string
  score: number
  emoji: string
}

interface RechartsDotProps {
  cx?: number
  cy?: number
  payload?: EmotionChartPoint
}

function EmotionChart({
  stages,
  height = 80,
}: {
  stages: Cjm["stages"]
  height?: number
}) {
  const data: EmotionChartPoint[] = stages.map((s) => ({
    label: getEmotionLabel(s),
    score: getEmotionScore(s),
    emoji: getEmotionEmoji(getEmotionScore(s)),
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 22, right: 20, bottom: 4, left: 20 }}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          interval={0}
        />
        <YAxis domain={[1, 5]} hide />
        <Line
          type="monotone"
          dataKey="score"
          stroke="var(--foreground)"
          strokeWidth={1.5}
          activeDot={false}
          dot={(props: RechartsDotProps) => {
            const cx = props.cx ?? 0
            const cy = props.cy ?? 0
            const emoji = props.payload?.emoji ?? "😐"
            return (
              <text
                key={`dot-${cx}-${cy}`}
                x={cx}
                y={cy - 6}
                textAnchor="middle"
                dominantBaseline="auto"
                fontSize={16}
              >
                {emoji}
              </text>
            )
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function RowLabel({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-start gap-2 border-b border-r border-border bg-muted p-4">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <span className="text-xs font-medium leading-tight text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

const INSIGHT_ICONS = [Target, TrendingUp, Users, Lightbulb] as const

export function JourneyView({
  projectId,
  cjm,
  version,
  cjmCreatedAt,
}: JourneyViewProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("map")

  async function generate(force: boolean) {
    setLoading(true)
    try {
      const result = await runCjm(projectId, force)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(force ? "CJM обновлён" : "CJM готов")
      router.refresh()
    } catch {
      toast.error("Не удалось сгенерировать CJM")
    } finally {
      setLoading(false)
    }
  }

  const stages = cjm?.stages ?? []
  const n = stages.length

  const touchpointsCount = stages.reduce((s, st) => s + st.touchpoints.length, 0)
  const problemsCount = stages.reduce((s, st) => s + st.painPoints.length, 0)
  const opportunitiesCount = stages.reduce((s, st) => s + st.opportunities.length, 0)

  const insights =
    cjm?.keyInsights?.slice(0, 4) ?? cjm?.recommendations.slice(0, 4) ?? []

  const allPains = stages.flatMap((s) =>
    s.painPoints.map((p) => ({ text: p, stage: s.name }))
  )
  const allOpportunities = stages.flatMap((s) =>
    s.opportunities.map((o) => ({ text: o, stage: s.name }))
  )
  const allRecs = [
    ...stages.flatMap((s) =>
      s.recommendation ? [{ text: s.recommendation, stage: s.name }] : []
    ),
    ...(cjm?.recommendations.map((r) => ({ text: r, stage: null as string | null })) ?? []),
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-foreground">
          Карта пути клиента (CJM)
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted">
            <Download size={15} />
            Экспорт
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
            <Calendar size={15} />
            {fmtDate(cjmCreatedAt)}
            {version != null && <span>v{version}</span>}
            <ChevronDown size={14} />
          </button>
          {cjm ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => generate(true)}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              Регенерировать
            </Button>
          ) : (
            <Button size="sm" onClick={() => generate(false)} disabled={loading}>
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              Сгенерировать
            </Button>
          )}
        </div>
      </div>

      {!cjm ? (
        <div className="flex h-[50vh] items-center justify-center">
          <EmptyState
            icon={Route}
            title="CJM не создан"
            description="Нажмите «Сгенерировать», чтобы AI построил путь клиента с этапами, touchpoints и рисками потери."
          />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-auto flex-wrap gap-1">
            <TabsTrigger value="map">Карта пути</TabsTrigger>
            <TabsTrigger value="touchpoints">Точки контакта</TabsTrigger>
            <TabsTrigger value="problems">Проблемы и возможности</TabsTrigger>
            <TabsTrigger value="emotions">Эмоции</TabsTrigger>
            <TabsTrigger value="recommendations">Рекомендации</TabsTrigger>
          </TabsList>

          {/* ─── КАРТА ПУТИ ─── */}
          <TabsContent value="map" className="mt-6 space-y-6">
            {/* Секция 1 — Обзор */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_auto]">
                <div>
                  <h2 className="mb-3 text-base font-semibold text-foreground">
                    Обзор CJM
                  </h2>
                  <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                    {cjm.summary}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {(
                    [
                      {
                        label: "Этапов пути",
                        value: n,
                        sub: "ключевых этапов",
                        icon: <Map size={18} className="text-muted-foreground" />,
                      },
                      {
                        label: "Точек контакта",
                        value: touchpointsCount,
                        sub: "с клиентом",
                        icon: <Phone size={18} className="text-muted-foreground" />,
                      },
                      {
                        label: "Проблемных зон",
                        value: problemsCount,
                        sub: "требуют внимания",
                        icon: (
                          <AlertTriangle
                            size={18}
                            className="text-muted-foreground"
                          />
                        ),
                      },
                      {
                        label: "Возможностей",
                        value: opportunitiesCount,
                        sub: "для роста",
                        icon: (
                          <TrendingUp size={18} className="text-muted-foreground" />
                        ),
                      },
                      ...(cjm.cesScore != null
                        ? [
                            {
                              label: "Общий опыт (CES)",
                              value: `${cjm.cesScore}/10`,
                              sub: cjm.cesLevel ?? "",
                              icon: (
                                <Smile size={18} className="text-muted-foreground" />
                              ),
                            },
                          ]
                        : []),
                    ] as const
                  ).map((m) => (
                    <div
                      key={m.label}
                      className="min-w-[120px] rounded-xl border border-border p-4"
                    >
                      <p className="mb-2 text-xs leading-snug text-muted-foreground">
                        {m.label}
                      </p>
                      <div className="flex items-end justify-between gap-2">
                        <div>
                          <p className="tabular-nums text-2xl font-bold text-foreground">
                            {m.value}
                          </p>
                          {m.sub && (
                            <p className="text-xs text-muted-foreground">{m.sub}</p>
                          )}
                        </div>
                        {m.icon}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Секция 2 — Таблица этапов */}
            {n > 0 && (
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: `180px repeat(${n}, minmax(170px, 1fr))`,
                      minWidth: 180 + n * 170,
                    }}
                  >
                    {/* Stage headers */}
                    <div className="border-b border-r border-border bg-muted p-4">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Этапы
                      </span>
                    </div>
                    {stages.map((s, i) => (
                      <div
                        key={i}
                        className="border-b border-r border-border bg-muted p-4 last:border-r-0"
                      >
                        <p className="text-xs font-bold text-foreground">
                          {i + 1}. {s.name}
                        </p>
                        <p className="mt-1 text-xs leading-snug text-muted-foreground">
                          {s.description}
                        </p>
                      </div>
                    ))}

                    {/* Цели клиента */}
                    <RowLabel
                      icon={<Target size={13} />}
                      label="Цели клиента"
                    />
                    {stages.map((s, i) => (
                      <div
                        key={i}
                        className="border-b border-r border-border p-4 last:border-r-0"
                      >
                        <p className="text-xs leading-relaxed text-foreground">
                          {s.customerGoal ?? s.description}
                        </p>
                      </div>
                    ))}

                    {/* Действия клиента */}
                    <RowLabel
                      icon={<ArrowRight size={13} />}
                      label="Действия клиента"
                    />
                    {stages.map((s, i) => (
                      <div
                        key={i}
                        className="border-b border-r border-border p-4 last:border-r-0"
                      >
                        <ul className="space-y-1">
                          {s.customerActions.slice(0, 3).map((a, j) => (
                            <li
                              key={j}
                              className="flex items-start gap-1.5 text-xs text-foreground"
                            >
                              <span className="mt-0.5 shrink-0 text-muted-foreground">
                                •
                              </span>
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}

                    {/* Точки контакта */}
                    <RowLabel
                      icon={<Phone size={13} />}
                      label="Точки контакта"
                    />
                    {stages.map((s, i) => (
                      <div
                        key={i}
                        className="border-b border-r border-border p-4 last:border-r-0"
                      >
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {s.touchpoints.join(", ")}
                        </p>
                      </div>
                    ))}

                    {/* Эмоции — spanning all stage columns */}
                    <div className="flex items-start gap-2 border-b border-r border-border bg-muted p-4">
                      <Smile
                        size={13}
                        className="mt-0.5 shrink-0 text-muted-foreground"
                      />
                      <span className="text-xs font-medium leading-tight text-muted-foreground">
                        Эмоции клиента
                      </span>
                    </div>
                    <div
                      style={{ gridColumn: `2 / ${n + 2}` }}
                      className="border-b border-border px-2 py-1"
                    >
                      <EmotionChart stages={stages} height={80} />
                    </div>

                    {/* Проблемы */}
                    <RowLabel
                      icon={<AlertTriangle size={13} />}
                      label="Проблемы"
                    />
                    {stages.map((s, i) => (
                      <div
                        key={i}
                        className="border-b border-r border-border p-4 last:border-r-0"
                      >
                        {s.painPoints.slice(0, 2).map((p, j) => (
                          <div
                            key={j}
                            className="mb-1.5 flex items-start gap-1.5 last:mb-0"
                          >
                            <AlertTriangle
                              size={11}
                              className="mt-0.5 shrink-0 text-warning"
                            />
                            <p className="text-xs leading-snug text-foreground">
                              {p}
                            </p>
                          </div>
                        ))}
                      </div>
                    ))}

                    {/* Возможности */}
                    <RowLabel
                      icon={<Lightbulb size={13} />}
                      label="Возможности"
                    />
                    {stages.map((s, i) => (
                      <div
                        key={i}
                        className="border-b border-r border-border p-4 last:border-r-0"
                      >
                        {s.opportunities.slice(0, 2).map((o, j) => (
                          <div
                            key={j}
                            className="mb-1.5 flex items-start gap-1.5 last:mb-0"
                          >
                            <Lightbulb
                              size={11}
                              className="mt-0.5 shrink-0 text-muted-foreground"
                            />
                            <p className="text-xs leading-snug text-foreground">
                              {o}
                            </p>
                          </div>
                        ))}
                      </div>
                    ))}

                    {/* Рекомендации */}
                    <RowLabel
                      icon={<TrendingUp size={13} />}
                      label="Рекомендации"
                    />
                    {stages.map((s, i) => (
                      <div
                        key={i}
                        className="border-r border-border p-4 last:border-r-0"
                      >
                        {s.recommendation ? (
                          <div className="flex items-start gap-1.5">
                            <TrendingUp
                              size={11}
                              className="mt-0.5 shrink-0 text-muted-foreground"
                            />
                            <p className="text-xs leading-snug text-foreground">
                              {s.recommendation}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">—</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Секция 3 — Ключевые инсайты */}
            {insights.length > 0 && (
              <div>
                <h2 className="mb-4 text-base font-semibold text-foreground">
                  Ключевые инсайты
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {insights.map((insight, i) => {
                    const Icon = INSIGHT_ICONS[i % INSIGHT_ICONS.length]
                    return (
                      <div
                        key={i}
                        className="rounded-2xl border border-border bg-card p-5"
                      >
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                          <Icon size={16} className="text-muted-foreground" />
                        </div>
                        <p className="text-sm leading-relaxed text-foreground">
                          {insight}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ─── ТОЧКИ КОНТАКТА ─── */}
          <TabsContent value="touchpoints" className="mt-6 space-y-4">
            {stages.map((s, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  {i + 1}. {s.name}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {s.touchpoints.map((tp, j) => (
                    <span
                      key={j}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground"
                    >
                      {tp}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* ─── ПРОБЛЕМЫ И ВОЗМОЖНОСТИ ─── */}
          <TabsContent value="problems" className="mt-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="mb-4 text-base font-semibold text-foreground">
                  Проблемы и барьеры
                </h2>
                <div className="space-y-3">
                  {allPains.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-xl border border-border p-3"
                    >
                      <AlertTriangle
                        size={14}
                        className="mt-0.5 shrink-0 text-warning"
                      />
                      <div className="min-w-0">
                        <p className="text-sm text-foreground">{item.text}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.stage}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="mb-4 text-base font-semibold text-foreground">
                  Возможности для роста
                </h2>
                <div className="space-y-3">
                  {allOpportunities.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-xl border border-border p-3"
                    >
                      <Lightbulb
                        size={14}
                        className="mt-0.5 shrink-0 text-muted-foreground"
                      />
                      <div className="min-w-0">
                        <p className="text-sm text-foreground">{item.text}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.stage}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ─── ЭМОЦИИ ─── */}
          <TabsContent value="emotions" className="mt-6 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-6 text-base font-semibold text-foreground">
                Эмоциональный путь клиента
              </h2>
              <EmotionChart stages={stages} height={160} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stages.map((s, i) => {
                const score = getEmotionScore(s)
                const riskColor =
                  s.churnRisk === "high"
                    ? "text-danger"
                    : s.churnRisk === "medium"
                      ? "text-warning"
                      : "text-success"
                const riskLabel =
                  s.churnRisk === "high"
                    ? "Высокий риск"
                    : s.churnRisk === "medium"
                      ? "Средний риск"
                      : "Низкий риск"
                return (
                  <div
                    key={i}
                    className="rounded-2xl border border-border bg-card p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">
                        {i + 1}. {s.name}
                      </p>
                      <span className={`text-xs ${riskColor}`}>{riskLabel}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-2xl">{getEmotionEmoji(score)}</span>
                      <p className="text-sm text-muted-foreground">
                        {getEmotionLabel(s)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </TabsContent>

          {/* ─── РЕКОМЕНДАЦИИ ─── */}
          <TabsContent value="recommendations" className="mt-6">
            <div className="space-y-3">
              {allRecs.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed text-foreground">
                      {rec.text}
                    </p>
                    {rec.stage && (
                      <p className="mt-1 text-xs text-muted-foreground">{rec.stage}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
