"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Sparkles, RefreshCw, Loader2, Crosshair, Star, Globe,
  MessageSquare, TrendingUp, AlertCircle, AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
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
    <span className="flex items-center gap-1 rounded-md border border-[#eaeaea] bg-neutral-50 px-2 py-1 text-xs">
      <Star className="size-3 fill-[#d97706] text-[#d97706]" />
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
      ? "bg-neutral-100 text-foreground border-neutral-200"
      : "bg-white text-muted-foreground border-[#eaeaea] line-through",
    success: active
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-white text-muted-foreground border-[#eaeaea] line-through",
    warning: active
      ? "bg-orange-50 text-orange-700 border-orange-200"
      : "bg-white text-muted-foreground border-[#eaeaea] line-through",
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
    active: { label: "Активны", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    moderate: { label: "Умеренно", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    low: { label: "Редко", cls: "bg-orange-50 text-orange-700 border-orange-200" },
    none: { label: "Нет активности", cls: "bg-neutral-100 text-muted-foreground border-neutral-200" },
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
    high: { label: "Высокий", cls: "bg-red-50 text-[#dc2626] border-red-200" },
    medium: { label: "Средний", cls: "bg-orange-50 text-[#d97706] border-orange-200" },
    low: { label: "Низкий", cls: "bg-neutral-100 text-muted-foreground border-neutral-200" },
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
          {/* Summary */}
          <div className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">{analysis.summary}</p>
          </div>

          {/* Competitor cards */}
          {analysis.competitors.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Конкуренты</h3>
              {analysis.competitors.map((c, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm"
                >
                  {/* Low-confidence warning */}
                  {c.dataConfidence === "low" && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <AlertTriangle size={14} className="shrink-0 text-amber-600" />
                      <p className="text-xs text-amber-700">
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
                        <span className="flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          <TrendingUp className="size-3" />
                          Яндекс #{c.yandexPosition}
                        </span>
                      )}
                      {c.hasContextAds === true && (
                        <span className="rounded border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
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
                            <span className="rounded border border-[#eaeaea] bg-neutral-50 px-2 py-0.5 text-xs text-foreground">
                              Instagram
                            </span>
                          )}
                          {c.vk && (
                            <span className="rounded border border-[#eaeaea] bg-neutral-50 px-2 py-0.5 text-xs text-foreground">
                              ВКонтакте
                            </span>
                          )}
                          {c.telegram && (
                            <span className="rounded border border-[#eaeaea] bg-neutral-50 px-2 py-0.5 text-xs text-foreground">
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
                        <p className="mb-1.5 text-xs font-medium text-[#16a34a]">
                          Сильные стороны
                        </p>
                        <ul className="space-y-1">
                          {c.strengths.map((s, j) => (
                            <li
                              key={j}
                              className="flex items-start gap-1.5 text-sm text-foreground"
                            >
                              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#16a34a]" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {c.weaknesses.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-xs font-medium text-[#dc2626]">
                          Слабые стороны
                        </p>
                        <ul className="space-y-1">
                          {c.weaknesses.map((w, j) => (
                            <li
                              key={j}
                              className="flex items-start gap-1.5 text-sm text-foreground"
                            >
                              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#dc2626]" />
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
                    <div className="grid gap-3 rounded-xl border border-[#eaeaea] bg-neutral-50 p-3 sm:grid-cols-2">
                      {c.commonComplaints && c.commonComplaints.length > 0 && (
                        <div>
                          <p className="mb-1.5 flex items-center gap-1 text-xs font-medium text-[#d97706]">
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
                          <p className="mb-1.5 flex items-center gap-1 text-xs font-medium text-[#16a34a]">
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
                          className="rounded border border-[#eaeaea] bg-neutral-50 px-1.5 py-0.5 text-xs text-foreground"
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
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Возможности захвата рынка
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {analysis.opportunities.map((opp, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="shrink-0 rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-muted-foreground">
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
            <div className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Наши конкурентные преимущества
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.ourAdvantages.map((adv, i) => (
                  <span
                    key={i}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700"
                  >
                    {adv}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Our weaknesses */}
          {analysis.ourWeaknesses && analysis.ourWeaknesses.length > 0 && (
            <div className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Наши зоны роста
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.ourWeaknesses.map((w, i) => (
                  <span
                    key={i}
                    className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-sm text-orange-700"
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
