"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Sparkles, RefreshCw, Loader2, Crosshair, Star, Globe,
  MessageSquare, TrendingUp, AlertCircle, AlertTriangle,
  Users, Target, Award,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { StatCard, StatRow } from "@/components/shared/stat-card"
import { runCompetitorAnalysis } from "@/lib/actions/ai"
import type { CompetitorAnalysis } from "@/lib/ai/schemas/competitorAnalysis"

interface CompetitorViewProps {
  projectId: string
  analysis: CompetitorAnalysis | null
  version: number | null
}

function RatingBadge({
  label,
  rating,
  count,
}: {
  label: string
  rating?: number | null
  count?: number | null
}) {
  if (rating == null) return null
  return (
    <span className="flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-xs">
      <Star className="size-3 fill-warning text-warning" />
      <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
      {count != null && (
        <span className="text-muted-foreground">({count})</span>
      )}
      <span className="text-muted-foreground">{label}</span>
    </span>
  )
}

function PresenceBadge({
  label,
  active,
  variant = "neutral",
}: {
  label: string
  active?: boolean | null
  variant?: "neutral" | "success" | "warning"
}) {
  if (active == null) return null
  const colors = {
    neutral: active
      ? "bg-muted text-foreground border-border"
      : "bg-card text-muted-foreground border-border line-through",
    success: active
      ? "bg-success/10 text-success border-success/20"
      : "bg-card text-muted-foreground border-border line-through",
    warning: active
      ? "bg-warning/10 text-warning border-warning/20"
      : "bg-card text-muted-foreground border-border line-through",
  }
  return (
    <span
      className={`rounded border px-2 py-0.5 text-xs font-medium ${colors[variant]}`}
    >
      {label}
    </span>
  )
}

function SocialActivityBadge({ activity }: { activity?: string | null }) {
  if (!activity) return null
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "Активны", cls: "bg-success/10 text-success border-success/20" },
    moderate: { label: "Умеренно", cls: "bg-muted text-foreground border-border" },
    low: { label: "Редко", cls: "bg-warning/10 text-warning border-warning/20" },
    none: { label: "Нет активности", cls: "bg-muted text-muted-foreground border-border" },
  }
  const item = map[activity]
  if (!item) return null
  return (
    <span className={`rounded border px-2 py-0.5 text-xs font-medium ${item.cls}`}>
      {item.label}
    </span>
  )
}

function PriorityBadge({ priority }: { priority?: string }) {
  if (!priority) return null
  const map: Record<string, { label: string; cls: string }> = {
    high: { label: "Высокий", cls: "bg-danger/10 text-danger border-danger/20" },
    medium: { label: "Средний", cls: "bg-warning/10 text-warning border-warning/20" },
    low: { label: "Низкий", cls: "bg-muted text-muted-foreground border-border" },
  }
  const item = map[priority]
  if (!item) return null
  return (
    <span className={`rounded border px-1.5 py-0.5 text-xs font-medium ${item.cls}`}>
      {item.label}
    </span>
  )
}

export function CompetitorView({
  projectId,
  analysis,
  version,
}: CompetitorViewProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function generate(force: boolean) {
    setLoading(true)
    try {
      const result = await runCompetitorAnalysis(projectId, force)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(force ? "Анализ конкурентов обновлён" : "Анализ конкурентов готов")
      router.refresh()
    } catch {
      toast.error("Не удалось сгенерировать анализ")
    } finally {
      setLoading(false)
    }
  }

  const ratings =
    analysis?.competitors.flatMap((c) =>
      [c.yandexRating, c.gisRating].filter((r): r is number => r != null)
    ) ?? []
  const avgRating = ratings.length
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : "—"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">Конкуренты</h2>
          <p className="text-sm text-muted-foreground">
            Анализ на основе живых данных из интернета
            {version && <span className="ml-2 text-xs">· версия {version}</span>}
          </p>
        </div>
        {analysis ? (
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

      {!analysis ? (
        <div className="flex h-[50vh] items-center justify-center">
          <EmptyState
            icon={Crosshair}
            title="Анализ конкурентов не создан"
            description="Нажмите «Сгенерировать» — AI найдёт конкурентов в интернете, проверит отзывы, позиции и онлайн-присутствие."
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Метрик-строка — фирменный приём эталона (#1) */}
          <StatRow cols={4}>
            <StatCard
              label="Конкурентов"
              value={analysis.competitors.length}
              sub="проанализировано"
              icon={Users}
            />
            <StatCard
              label="Средний рейтинг"
              value={avgRating}
              sub="по отзывам"
              icon={Star}
              tone="warning"
            />
            <StatCard
              label="Возможностей"
              value={analysis.opportunities.length}
              sub="захвата рынка"
              icon={Target}
              tone="success"
            />
            <StatCard
              label="Наших преимуществ"
              value={analysis.ourAdvantages.length}
              sub="перед рынком"
              icon={Award}
            />
          </StatRow>

          {/* Summary — с иконкой-в-чипе (#3) */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Crosshair className="size-4 text-muted-foreground" />
              </span>
              <p className="text-sm leading-relaxed text-muted-foreground">{analysis.summary}</p>
            </div>
          </div>

          {/* Competitor cards */}
          {analysis.competitors.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-muted">
                  <Users className="size-4 text-muted-foreground" />
                </span>
                <h3 className="text-sm font-semibold text-foreground">Конкуренты</h3>
              </div>
              {analysis.competitors.map((c, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                >
                  {/* Low-confidence warning */}
                  {c.dataConfidence === "low" && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl border border-warning/20 bg-warning/10 p-3">
                      <AlertTriangle size={14} className="shrink-0 text-warning" />
                      <p className="text-xs text-warning">
                        Мало данных о конкуренте. Результаты могут быть неточными.
                        Рекомендуем добавить данные вручную в анкете.
                      </p>
                    </div>
                  )}

                  {/* Card header: name + ratings */}
                  <div className="mb-3 flex flex-wrap items-start gap-2">
                    <span className="text-base font-semibold text-foreground">
                      {c.name}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {c.yandexRating != null ? (
                        <RatingBadge
                          label="Яндекс"
                          rating={c.yandexRating}
                          count={c.yandexReviewsCount}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Яндекс: нет данных
                        </span>
                      )}
                      <RatingBadge
                        label="2ГИС"
                        rating={c.gisRating}
                        count={c.gisReviewsCount}
                      />
                    </div>
                  </div>

                  {/* Positioning */}
                  <p className="mb-3 text-sm text-muted-foreground">{c.positioning}</p>

                  {/* Search & ads presence */}
                  {(c.yandexPosition != null || c.hasContextAds != null) && (
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                      {c.yandexPosition != null && (
                        <span className="flex items-center gap-1 rounded border border-border bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                          <TrendingUp className="size-3" />
                          Яндекс #{c.yandexPosition}
                        </span>
                      )}
                      {c.hasContextAds === true && (
                        <span className="rounded border border-warning/20 bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                          Директ
                        </span>
                      )}
                    </div>
                  )}

                  {/* Online presence */}
                  {(c.hasSite != null ||
                    c.hasPrices != null ||
                    c.hasCalculator != null ||
                    c.hasOnlineForm != null) && (
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                      {c.hasSite != null && (
                        <PresenceBadge label="Сайт" active={c.hasSite} variant="neutral" />
                      )}
                      {c.siteUrl && c.hasSite && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Globe className="size-3" />
                          {c.siteUrl.replace(/^https?:\/\//, "").split("/")[0]}
                        </span>
                      )}
                      {c.hasPrices != null && (
                        <PresenceBadge label="Цены" active={c.hasPrices} variant="success" />
                      )}
                      {c.hasCalculator != null && (
                        <PresenceBadge
                          label="Калькулятор"
                          active={c.hasCalculator}
                          variant="success"
                        />
                      )}
                      {c.hasOnlineForm != null && (
                        <PresenceBadge label="Форма заявки" active={c.hasOnlineForm} variant="success" />
                      )}
                    </div>
                  )}
                  {c.siteNote && (
                    <p className="mb-2 text-xs text-muted-foreground">{c.siteNote}</p>
                  )}

                  {/* Social presence */}
                  {(() => {
                    const hasSocial = !!(c.instagram || c.vk || c.telegram)
                    if (hasSocial || c.socialActivity != null) {
                      return (
                        <div className="mb-3 flex flex-wrap items-center gap-1.5">
                          {c.instagram && (
                            <span className="rounded border border-border bg-muted px-2 py-0.5 text-xs text-foreground">
                              Instagram
                            </span>
                          )}
                          {c.vk && (
                            <span className="rounded border border-border bg-muted px-2 py-0.5 text-xs text-foreground">
                              ВКонтакте
                            </span>
                          )}
                          {c.telegram && (
                            <span className="rounded border border-border bg-muted px-2 py-0.5 text-xs text-foreground">
                              Telegram
                            </span>
                          )}
                          <SocialActivityBadge activity={c.socialActivity} />
                          {c.socialNote && (
                            <span className="text-xs text-muted-foreground">{c.socialNote}</span>
                          )}
                        </div>
                      )
                    }
                    return (
                      <p className="mb-3 text-xs text-muted-foreground">
                        {c.socialNote ?? "Соцсети не найдены"}
                      </p>
                    )
                  })()}

                  {/* Strengths & weaknesses */}
                  <div className="mb-3 grid gap-3 sm:grid-cols-2">
                    {c.strengths.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-xs font-medium text-success">
                          Сильные стороны
                        </p>
                        <ul className="space-y-1">
                          {c.strengths.map((s, j) => (
                            <li
                              key={j}
                              className="flex items-start gap-1.5 text-sm text-foreground"
                            >
                              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-success" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {c.weaknesses.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-xs font-medium text-danger">
                          Слабые стороны
                        </p>
                        <ul className="space-y-1">
                          {c.weaknesses.map((w, j) => (
                            <li
                              key={j}
                              className="flex items-start gap-1.5 text-sm text-foreground"
                            >
                              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-danger" />
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Complaints & praise from reviews */}
                  {((c.commonComplaints && c.commonComplaints.length > 0) ||
                    (c.commonPraise && c.commonPraise.length > 0)) && (
                    <div className="grid gap-3 rounded-xl border border-border bg-muted p-3 sm:grid-cols-2">
                      {c.commonComplaints && c.commonComplaints.length > 0 && (
                        <div>
                          <p className="mb-1.5 flex items-center gap-1 text-xs font-medium text-warning">
                            <AlertCircle className="size-3" />
                            Жалобы клиентов
                          </p>
                          <ul className="space-y-1">
                            {c.commonComplaints.map((complaint, j) => (
                              <li key={j} className="text-xs text-muted-foreground">
                                · {complaint}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {c.commonPraise && c.commonPraise.length > 0 && (
                        <div>
                          <p className="mb-1.5 flex items-center gap-1 text-xs font-medium text-success">
                            <MessageSquare className="size-3" />
                            Хвалят
                          </p>
                          <ul className="space-y-1">
                            {c.commonPraise.map((praise, j) => (
                              <li key={j} className="text-xs text-muted-foreground">
                                · {praise}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Marketing channels */}
                  {c.channels.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {c.channels.map((ch, j) => (
                        <span
                          key={j}
                          className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-foreground"
                        >
                          {ch}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Capture opportunities */}
          {analysis.opportunities.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-success/10">
                  <Target className="size-4 text-success" />
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  Возможности захвата рынка
                </h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {analysis.opportunities.map((opp, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {opp.competitor}
                      </span>
                      <PriorityBadge priority={opp.priority} />
                    </div>
                    <p className="mb-1 text-sm font-medium text-foreground">{opp.title}</p>
                    <p className="text-sm text-muted-foreground">{opp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Our advantages */}
          {analysis.ourAdvantages.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Наши конкурентные преимущества
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.ourAdvantages.map((adv, i) => (
                  <span
                    key={i}
                    className="rounded-lg border border-success/20 bg-success/10 px-3 py-1.5 text-sm text-success"
                  >
                    {adv}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Our weaknesses */}
          {analysis.ourWeaknesses && analysis.ourWeaknesses.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Наши зоны роста
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.ourWeaknesses.map((w, i) => (
                  <span
                    key={i}
                    className="rounded-lg border border-warning/20 bg-warning/10 px-3 py-1.5 text-sm text-warning"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
