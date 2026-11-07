"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Star,
  RefreshCw,
  Loader2,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Copy,
  AlertTriangle,
  ExternalLink,
} from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { GenerationProgress } from "@/components/shared/generation-progress"
import { StatCard, StatRow } from "@/components/shared/stat-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { TONE_CLASSES, type StatusTone } from "@/lib/status-variants"
import { runReputationAnalysis } from "@/lib/actions/ai"
import { MAX_REVIEW_TEXT_LENGTH, type Reputation, type ReputationInput, type ReputationRecommendation } from "@/lib/ai/schemas/reputation"
import { cn } from "@/lib/utils"

interface ReputationViewProps {
  projectId: string
  reputation: Reputation | null
  searchedAt: string | null
}

const GEN_STEPS = [
  { id: "yandex", label: "Ищу отзывы на Яндекс.Картах" },
  { id: "twogis", label: "Ищу отзывы на 2ГИС" },
  { id: "other", label: "Ищу отзывы на других площадках" },
  { id: "analyze", label: "Анализирую тональность и паттерны" },
  { id: "save", label: "Сохраняю результат" },
]

const MANUAL_STEPS = GEN_STEPS.slice(-2)

const URGENCY_TONE: Record<ReputationRecommendation["urgency"], StatusTone> = {
  high: "danger",
  medium: "warning",
  low: "muted",
}

const URGENCY_LABEL: Record<ReputationRecommendation["urgency"], string> = {
  high: "Срочно",
  medium: "Средне",
  low: "Не срочно",
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function Stars({ rating }: { rating: number | null }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={
            rating != null && s <= Math.round(rating)
              ? "text-warning"
              : "text-muted-foreground/30"
          }
        >
          ★
        </span>
      ))}
    </div>
  )
}

export function ReputationView({
  projectId,
  reputation,
  searchedAt,
}: ReputationViewProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [genCompleted, setGenCompleted] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [mode, setMode] = useState<ReputationInput["mode"]>(reputation?.reviewMode ?? "web")
  const [reviewText, setReviewText] = useState("")
  const [readingFile, setReadingFile] = useState(false)

  const allReviews = useMemo(() => {
    if (!reputation) return []
    return reputation.sources
      .flatMap((source) =>
        source.recentReviews.map((review) => ({ ...review, platform: source.platform }))
      )
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
  }, [reputation])

  const highUrgencyCount =
    reputation?.recommendations.filter((r) => r.urgency === "high").length ?? 0

  async function generate() {
    if (loading || readingFile) return
    setLoading(true)
    setGenCompleted(false)
    setGenError(null)
    try {
      const input: ReputationInput = mode === "manual" ? { mode, text: reviewText } : { mode }
      const result = await runReputationAnalysis(projectId, input)
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

  async function loadReviewFile(file: File) {
    if (file.size > MAX_REVIEW_TEXT_LENGTH * 4) {
      toast.error("Файл слишком большой. Максимум 30 000 символов.")
      return
    }
    setReadingFile(true)
    try {
      const text = (await file.text()).trim()
      if (!text || text.length > MAX_REVIEW_TEXT_LENGTH || text.includes("\uFFFD") || text.includes("\0")) {
        toast.error("Выберите непустой TXT-файл в UTF-8 объёмом до 30 000 символов.")
        return
      }
      setReviewText(text)
    } catch {
      toast.error("Не удалось прочитать файл.")
    } finally {
      setReadingFile(false)
    }
  }

  function copyTemplate(text: string) {
    navigator.clipboard.writeText(text)
    toast.success("Шаблон скопирован")
  }

  const header = (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-h2 text-foreground">Репутация</h1>
        <p className="text-sm text-muted-foreground">
          {searchedAt
            ? `Последний анализ: ${fmtDate(searchedAt)}${reputation?.reviewMode === "manual" ? " · ручная подборка" : ""}`
            : "Проанализируйте отзывы и найдите точки роста для проекта."}
        </p>
      </div>
      <div role="group" aria-label="Источник отзывов" className="flex flex-wrap gap-2">
        <Button size="sm" variant={mode === "web" ? "default" : "outline"} aria-pressed={mode === "web"} disabled={loading || readingFile} onClick={() => setMode("web")}>
          Найти в интернете
        </Button>
        <Button size="sm" variant={mode === "manual" ? "default" : "outline"} aria-pressed={mode === "manual"} disabled={loading || readingFile} onClick={() => setMode("manual")}>
          Добавить вручную
        </Button>
      </div>
      {mode === "manual" && (
        <div className="space-y-2">
          <label htmlFor="review-text" className="text-sm font-medium">Отзывы о компании, конкурентах или нише</label>
          <Textarea
            id="review-text"
            rows={6}
            maxLength={MAX_REVIEW_TEXT_LENGTH}
            placeholder="Вставьте отзывы, разделяя их пустой строкой."
            value={reviewText}
            disabled={loading || readingFile}
            onChange={(event) => setReviewText(event.target.value)}
          />
          <label className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            Загрузить TXT (UTF-8)
            <input
              type="file"
              accept=".txt,text/plain"
              disabled={loading || readingFile}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0]
                event.currentTarget.value = ""
                if (file) void loadReviewFile(file)
              }}
            />
          </label>
        </div>
      )}
      <Button size="sm" onClick={generate} disabled={loading || readingFile || (mode === "manual" && !reviewText.trim())}>
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <RefreshCw className="size-3.5" />
        )}
        {mode === "web" ? "Найти и проанализировать" : "Проанализировать отзывы"}
      </Button>
      {!loading && genError && <p role="alert" className="text-sm text-danger">{genError}</p>}
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        {header}
        <GenerationProgress steps={mode === "manual" ? MANUAL_STEPS : GEN_STEPS} completed={genCompleted} error={genError} />
      </div>
    )
  }

  if (!reputation) {
    return (
      <div className="space-y-6">
        {header}
        <div className="flex min-h-[50vh] items-center justify-center">
          <EmptyState
            icon={Star}
            title="Анализ ещё не запускался"
            description="Запустите веб-поиск отзывов о компании или добавьте свою подборку."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {header}

      {reputation.dataConfidence === "low" && (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning/10 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
          <p className="text-sm text-warning">
            {reputation.reviewMode === "manual"
              ? "В подборке мало данных для уверенных выводов. Добавьте больше отзывов."
              : "Мало данных найдено. Проверьте название компании и город в анкете проекта или добавьте отзывы вручную."}
          </p>
        </div>
      )}

      <section className="space-y-3" aria-labelledby="growth-points-heading">
        <h2 id="growth-points-heading" className="text-base font-semibold text-foreground">Точки роста по отзывам</h2>
        {reputation.growthPoints.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th scope="col" className="p-3">Негативный отзыв</th>
                  <th scope="col" className="p-3">Что расстроило клиента</th>
                  <th scope="col" className="p-3">Действие для бизнеса</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reputation.growthPoints.map((point, index) => (
                  <tr key={index} className="align-top">
                    <td className="w-2/5 p-3 text-muted-foreground">
                      <p>«{point.quote}»</p>
                      {point.url && (
                        <a href={point.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs underline">
                          Источник отзыва
                        </a>
                      )}
                    </td>
                    <td className="w-1/4 p-3">{point.issue}</td>
                    <td className="p-3">{point.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {reputation.reviewMode
              ? "В этих материалах не удалось подтвердить точки роста. Попробуйте добавить отзывы с конкретными жалобами."
              : "Запустите анализ ещё раз, чтобы получить таблицу точек роста."}
          </p>
        )}
      </section>

      {/* БЛОК 1 — сводка */}
      <StatRow cols={4}>
        <StatCard
          label="Средний рейтинг"
          value={reputation.summary.avgRating != null ? reputation.summary.avgRating.toFixed(1) : "—"}
          sub={reputation.summary.avgRating != null ? "из 5" : undefined}
          icon={Star}
        />
        <StatCard
          label="Найдено отзывов"
          value={reputation.summary.totalReviewsFound}
          icon={MessageSquare}
        />
        <StatCard
          label="Позитивная тональность"
          value={`${reputation.summary.sentiment.positive}%`}
          icon={ThumbsUp}
          tone={reputation.summary.sentiment.positive >= 60 ? "success" : "default"}
        />
        <StatCard
          label="Требуют ответа"
          value={highUrgencyCount}
          icon={AlertTriangle}
          tone={highUrgencyCount > 0 ? "danger" : "default"}
        />
      </StatRow>

      {/* БЛОК 2 — источники */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Источники</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reputation.sources.map((source) => (
            <div
              key={source.platform}
              className={cn(
                "rounded-2xl border p-4",
                source.found ? "border-border bg-card" : "border-dashed border-border bg-muted/40"
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{source.platform}</p>
                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`Открыть ${source.platform}`}
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
              </div>
              {source.found ? (
                <>
                  <div className="mb-1 flex items-center gap-2">
                    <Stars rating={source.rating} />
                    {source.rating != null && (
                      <span className="text-sm font-medium text-foreground">{source.rating}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {source.reviewsCount != null ? `${source.reviewsCount} отзывов` : "количество неизвестно"}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Не найдено</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* БЛОК 3 — лента отзывов */}
      {allReviews.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Последние отзывы</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {allReviews.map((review, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral" size="sm">{review.platform}</Badge>
                    <Stars rating={review.rating} />
                  </div>
                  {review.date && (
                    <span className="shrink-0 text-xs text-muted-foreground">{review.date}</span>
                  )}
                </div>
                <p className="mb-1 text-sm font-medium text-foreground">
                  {review.author ?? "Аноним"}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* БЛОК 4 — хвалят / жалуются */}
      {(reputation.topPraises.length > 0 || reputation.topComplaints.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-success/10">
                <ThumbsUp className="size-4 text-success" />
              </span>
              <p className="text-sm font-semibold text-foreground">Хвалят</p>
            </div>
            <ul className="space-y-1.5">
              {reputation.topPraises.map((p, i) => (
                <li key={i} className="flex gap-2 text-sm text-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-success" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-danger/10">
                <ThumbsDown className="size-4 text-danger" />
              </span>
              <p className="text-sm font-semibold text-foreground">Жалуются</p>
            </div>
            <ul className="space-y-1.5">
              {reputation.topComplaints.map((c, i) => (
                <li key={i} className="flex gap-2 text-sm text-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-danger" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* БЛОК 5 — рекомендации */}
      {reputation.recommendations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Рекомендации</h2>
          <div className="space-y-2">
            {reputation.recommendations.map((rec, i) => {
              const tone = TONE_CLASSES[URGENCY_TONE[rec.urgency]]
              return (
                <div
                  key={i}
                  className={cn("flex gap-3 rounded-xl border p-3", tone.border, tone.bg)}
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{rec.title}</p>
                      <Badge variant={rec.urgency === "high" ? "danger" : rec.urgency === "medium" ? "warning" : "muted"} size="sm">
                        {URGENCY_LABEL[rec.urgency]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{rec.platform}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{rec.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* БЛОК 6 — шаблоны ответов */}
      {reputation.replyTemplates.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Шаблоны ответов</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {reputation.replyTemplates.map((t, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Badge
                    variant={
                      t.forType === "negative" ? "danger" : t.forType === "positive" ? "success" : "neutral"
                    }
                    size="sm"
                  >
                    {t.forType === "negative" ? "Негативный" : t.forType === "positive" ? "Позитивный" : "Нейтральный"}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => copyTemplate(t.template)}
                    className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Copy className="size-3" />
                    Копировать
                  </button>
                </div>
                <p className="text-sm text-foreground">{t.template}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
