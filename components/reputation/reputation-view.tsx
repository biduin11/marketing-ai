"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Star, RefreshCw, Loader2, MessageSquare } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { EmptyState } from "@/components/empty-state"
import { buttonVariants } from "@/components/ui/button"
import { GenerationProgress } from "@/components/shared/generation-progress"
import { platformLabel, platformIcon } from "@/lib/config/platforms"
import { runReputationAnalysis } from "@/lib/actions/ai"
import type { ReputationAnalysis } from "@/lib/ai/schemas/reputation"
import type { Platform } from "@prisma/client"
import { cn } from "@/lib/utils"

interface ReviewItem {
  id: string
  platform: Platform
  author: string | null
  rating: number | null
  text: string | null
  reply: string | null
  sentiment: string | null
  publishedAt: string
}

interface SocialStatItem {
  platform: Platform
  date: string
  followers: number
  reach: number
  engagement: number
  views: number
  clicks: number
}

interface ReputationViewProps {
  projectId: string
  hasIntegrations: boolean
  reviews: ReviewItem[]
  socialStats: SocialStatItem[]
  analysis: ReputationAnalysis | null
  analysisVersion: number | null
}

const REVIEW_PLATFORMS: Platform[] = ["YANDEX_MAPS", "TWOGIS"]
const SOCIAL_PLATFORMS: Platform[] = ["VK", "TELEGRAM", "AVITO"]

type ReviewFilter = "all" | "positive" | "negative" | "unanswered"

const GEN_STEPS = [
  { id: "collect", label: "Собираю отзывы и статистику" },
  { id: "sentiment", label: "Анализирую тональность" },
  { id: "patterns", label: "Ищу паттерны жалоб и похвал" },
  { id: "actions", label: "Формирую план действий" },
  { id: "save", label: "Сохраняю результат" },
]

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function sentimentLabel(s: string | null): string {
  if (s === "positive") return "Позитивный"
  if (s === "negative") return "Негативный"
  return "Нейтральный"
}

export function ReputationView({
  projectId,
  hasIntegrations,
  reviews,
  socialStats,
  analysis,
  analysisVersion,
}: ReputationViewProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<ReviewFilter>("all")
  const [loading, setLoading] = useState(false)
  const [genCompleted, setGenCompleted] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)

  const platformReviews = useMemo(
    () => reviews.filter((r) => REVIEW_PLATFORMS.includes(r.platform)),
    [reviews]
  )

  // ── Block 1: summary metrics ──
  const rated = platformReviews.filter((r) => r.rating != null)
  const avgRating =
    rated.length > 0
      ? (rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length).toFixed(1)
      : "—"
  const totalReviews = platformReviews.length
  const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const newReviews = platformReviews.filter(
    (r) => new Date(r.publishedAt).getTime() >= monthAgo
  ).length
  const unanswered = platformReviews.filter((r) => !r.reply).length

  const summaryCards = [
    { label: "Средний рейтинг", value: avgRating, suffix: "/5", icon: "⭐", alert: false },
    { label: "Отзывов всего", value: totalReviews, icon: "💬", alert: false },
    { label: "Новых за месяц", value: newReviews, icon: "🆕", alert: false },
    { label: "Требуют ответа", value: unanswered, icon: "⚠️", alert: unanswered > 0 },
  ]

  // ── Block 2: filtered feed ──
  const filteredReviews = useMemo(() => {
    switch (filter) {
      case "positive":
        return platformReviews.filter((r) => r.sentiment === "positive")
      case "negative":
        return platformReviews.filter((r) => r.sentiment === "negative")
      case "unanswered":
        return platformReviews.filter((r) => !r.reply)
      default:
        return platformReviews
    }
  }, [platformReviews, filter])

  // ── Block 3: social stats grouped by platform ──
  const socialByPlatform = useMemo(() => {
    return SOCIAL_PLATFORMS.map((p) => ({
      platform: p,
      series: socialStats.filter((s) => s.platform === p),
    })).filter((g) => g.series.length > 0)
  }, [socialStats])

  async function generate() {
    setLoading(true)
    setGenCompleted(false)
    setGenError(null)
    try {
      const result = await runReputationAnalysis(projectId, true)
      if (!result.success) {
        setGenError(result.error)
        toast.error(result.error)
        return
      }
      setGenCompleted(true)
      toast.success("Анализ репутации готов")
      setTimeout(() => router.refresh(), 600)
    } catch {
      const msg = "Не удалось проанализировать репутацию"
      setGenError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!hasIntegrations) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#111]">Репутация и соцсети</h1>
          <p className="text-sm text-[#6b7280]">
            Отзывы и статистика соцсетей в одном месте
          </p>
        </div>
        <div className="flex h-[50vh] items-center justify-center">
          <EmptyState
            icon={Star}
            title="Нет подключённых площадок"
            description="Подключите Яндекс.Карты, 2ГИС, ВКонтакте, Telegram или Авито, чтобы собирать отзывы и статистику."
            action={
              <Link href="/settings" className={cn(buttonVariants({ size: "sm" }))}>
                Подключить
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#111]">Репутация и соцсети</h1>
        <p className="text-sm text-[#6b7280]">
          Отзывы и статистика соцсетей в одном месте
        </p>
      </div>

      {/* ── БЛОК 1: Сводка ── */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((m) => (
          <div
            key={m.label}
            className={cn(
              "rounded-2xl border p-4",
              m.alert ? "border-warning/20 bg-warning/10" : "border-border bg-card"
            )}
          >
            <p className="mb-1 text-xs text-[#6b7280]">{m.label}</p>
            <p className="text-2xl font-bold text-[#111]">
              {m.icon} {m.value}
              {m.suffix ?? ""}
            </p>
          </div>
        ))}
      </div>

      {/* ── БЛОК 2: Лента отзывов ── */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-[#111]">Отзывы</h2>
          <div className="flex flex-wrap gap-1">
            {(
              [
                ["all", "Все"],
                ["positive", "Позитивные"],
                ["negative", "Негативные"],
                ["unanswered", "Без ответа"],
              ] as [ReviewFilter, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                  filter === key
                    ? "border-[#111] bg-foreground text-background"
                    : "border-border text-[#6b7280] hover:bg-[#fafafa]"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filteredReviews.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Отзывов пока нет"
            description="После синхронизации здесь появятся отзывы с Яндекс.Карт и 2ГИС."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredReviews.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-border bg-[#fafafa] px-2 py-0.5 text-xs">
                      {platformLabel(review.platform)}
                    </span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span
                          key={s}
                          className={
                            review.rating != null && s <= review.rating
                              ? "text-amber-400"
                              : "text-[#eaeaea]"
                          }
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-[#6b7280]">
                    {fmtDate(review.publishedAt)}
                  </span>
                </div>

                <p className="mb-1 text-sm font-medium text-[#111]">
                  {review.author ?? "Аноним"}
                </p>
                <p className="mb-3 text-sm leading-relaxed text-[#6b7280]">
                  {review.text ?? "(без текста)"}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-xs",
                      review.sentiment === "positive"
                        ? "border-success/20 bg-success/10 text-success"
                        : review.sentiment === "negative"
                          ? "border-danger/20 bg-danger/10 text-danger"
                          : "border-gray-200 bg-gray-50 text-gray-600"
                    )}
                  >
                    {sentimentLabel(review.sentiment)}
                  </span>
                  {review.reply && (
                    <span className="rounded-full border border-border bg-[#fafafa] px-2 py-0.5 text-xs text-[#6b7280]">
                      Есть ответ
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── БЛОК 3: Статистика соцсетей ── */}
      {socialByPlatform.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[#111]">Соцсети</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {socialByPlatform.map(({ platform, series }) => {
              const latest = series[series.length - 1]
              return (
                <div
                  key={platform}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-lg">{platformIcon(platform)}</span>
                    <p className="text-sm font-medium text-[#111]">
                      {platformLabel(platform)}
                    </p>
                  </div>

                  <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                    <SocialMetric label="Подписчики" value={latest.followers} />
                    {platform === "TELEGRAM" ? (
                      <SocialMetric label="Просмотры" value={latest.views} />
                    ) : platform === "AVITO" ? (
                      <SocialMetric label="Звонки" value={latest.clicks} />
                    ) : (
                      <SocialMetric label="Охват" value={latest.reach} />
                    )}
                    <SocialMetric label="Вовлечённость" value={latest.engagement} />
                    <SocialMetric label="Просмотры" value={latest.views} />
                  </div>

                  {series.length > 1 && (
                    <ResponsiveContainer width="100%" height={80}>
                      <LineChart data={series}>
                        <XAxis dataKey="date" hide />
                        <YAxis hide />
                        <Tooltip
                          labelFormatter={(v) => fmtDate(String(v))}
                          formatter={(v) => [String(v), "Подписчики"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="followers"
                          stroke="var(--foreground)"
                          strokeWidth={1.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── БЛОК 4: AI-анализ репутации ── */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#111]">AI-анализ репутации</h3>
            {analysisVersion !== null && (
              <p className="text-xs text-[#6b7280]">версия {analysisVersion}</p>
            )}
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-[#fafafa] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Обновить
          </button>
        </div>

        {loading ? (
          <GenerationProgress steps={GEN_STEPS} completed={genCompleted} error={genError} />
        ) : !analysis ? (
          <EmptyState
            icon={Star}
            title="Анализ ещё не готов"
            description="Нажмите «Обновить», чтобы AI разобрал отзывы и статистику и дал план действий."
          />
        ) : (
          <div className="space-y-6">
            <p className="text-sm text-[#6b7280]">{analysis.summary}</p>

            {analysis.topComplaints.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    Чаще всего критикуют
                  </p>
                  <ul className="space-y-1.5">
                    {analysis.topComplaints.map((c, i) => (
                      <li key={i} className="flex gap-2 text-sm text-[#111]">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-400" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    Чаще всего хвалят (УТП)
                  </p>
                  <ul className="space-y-1.5">
                    {analysis.topPraises.map((c, i) => (
                      <li key={i} className="flex gap-2 text-sm text-[#111]">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-green-400" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Что делать */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-[#111]">Что делать</p>
              {analysis.actions.map((action, i) => (
                <div
                  key={i}
                  className="flex gap-3 rounded-xl border border-border bg-[#fafafa] p-3"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#111]">{action.title}</p>
                    <p className="mt-0.5 text-xs text-[#6b7280]">{action.description}</p>
                    {action.urgency === "high" && (
                      <span className="mt-1 block text-xs text-danger">⚡ Срочно</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Шаблоны ответов */}
            {analysis.reviewReplyTemplates.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#111]">Шаблоны ответов</p>
                {analysis.reviewReplyTemplates.map((t, i) => (
                  <div key={i} className="rounded-xl border border-border p-3">
                    <p className="mb-1 text-xs font-medium text-[#6b7280]">
                      Для отзыва: {t.forSentiment === "negative" ? "негативного" : "нейтрального"}
                    </p>
                    <p className="text-sm text-[#111]">{t.template}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SocialMetric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[#6b7280]">{label}</p>
      <p className="text-sm font-semibold text-[#111]">{value.toLocaleString("ru-RU")}</p>
    </div>
  )
}
