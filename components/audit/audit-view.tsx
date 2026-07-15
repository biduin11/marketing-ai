"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Loader2, Sparkles, Target, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { runExpressAudit, type AuditItem } from "@/lib/actions/audit"
import { AUDIT_QUESTIONS, categoryLabel } from "@/lib/audit-questions"
import { TONE_CLASSES, type StatusTone } from "@/lib/status-variants"
import { cn } from "@/lib/utils"

interface AuditViewProps {
  projectId: string
  initialAudits: AuditItem[]
}

const IMPACT_TONE: Record<string, StatusTone> = {
  "высокий": "danger",
  "средний": "warning",
  "низкий": "muted",
}

function scoreTone(score: number): StatusTone {
  if (score >= 67) return "success"
  if (score >= 34) return "warning"
  return "danger"
}

const SCORE_BAR_CLASS: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-foreground",
  muted: "bg-muted-foreground",
}

const DATE_FORMAT = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
})

function ScoreRing({ score }: { score: number }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  return (
    <div className="relative size-32 shrink-0">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="var(--color-foreground)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground">из 100</span>
      </div>
    </div>
  )
}

function AuditResult({
  audit,
  onRestart,
}: {
  audit: AuditItem
  onRestart: () => void
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Результат аудита</h2>
            <p className="text-sm text-muted-foreground">
              {DATE_FORMAT.format(new Date(audit.createdAt))}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onRestart}>
            Пройти заново
          </Button>
        </div>

        <div className="mb-6 flex items-center gap-8">
          <ScoreRing score={audit.score} />
          <div>
            <p className="mb-1 text-xl font-semibold text-foreground">{audit.level}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{audit.summary}</p>
          </div>
        </div>

        <div className="space-y-2">
          {Object.entries(audit.categoryScores).map(([key, score]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="w-40 shrink-0 text-xs text-muted-foreground">
                {categoryLabel(key)}
              </span>
              <div className="h-1.5 flex-1 rounded-full bg-muted">
                <div
                  className={cn("h-1.5 rounded-full", SCORE_BAR_CLASS[scoreTone(score)])}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-xs font-medium text-foreground">
                {score}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
          <Target className="size-4" />
          Топ-3 точки роста
        </h3>
        <div className="space-y-4">
          {audit.growthPoints.map((gp, i) => {
            const tone = TONE_CLASSES[IMPACT_TONE[gp.impact] ?? "muted"]
            return (
              <div key={i} className="flex gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
                  {i + 1}
                </span>
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{gp.title}</p>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", tone.bg, tone.text)}>
                      {gp.impact} импакт
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{gp.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
          <Zap className="size-4" />
          Быстрые победы (до 2 недель)
        </h3>
        <div className="space-y-3">
          {audit.quickWins.map((qw, i) => (
            <div key={i} className="flex gap-3 rounded-xl border border-border bg-muted/30 p-3">
              <span className="shrink-0 text-lg">✓</span>
              <div>
                <div className="mb-0.5 flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{qw.title}</p>
                  <span className="rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
                    {qw.timeframe}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{qw.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  )
}

export function AuditView({ projectId, initialAudits }: AuditViewProps) {
  const [audits, setAudits] = useState<AuditItem[]>(initialAudits)
  const [mode, setMode] = useState<"form" | "result">(initialAudits.length > 0 ? "result" : "form")
  const [activeAuditId, setActiveAuditId] = useState<string | null>(initialAudits[0]?.id ?? null)
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)

  const activeAudit = useMemo(
    () => audits.find((a) => a.id === activeAuditId) ?? null,
    [audits, activeAuditId]
  )

  function startForm() {
    setCurrentQ(0)
    setAnswers({})
    setMode("form")
  }

  function handleAnswer(value: number) {
    const question = AUDIT_QUESTIONS[currentQ]!
    setAnswers((prev) => ({ ...prev, [question.id]: value }))
    if (currentQ < AUDIT_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQ((q) => q + 1), 300)
    }
  }

  async function handleSubmit() {
    setLoading(true)
    const result = await runExpressAudit(projectId, answers)
    setLoading(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    setAudits((prev) => [result.data, ...prev])
    setActiveAuditId(result.data.id)
    setMode("result")
    toast.success("Аудит готов")
  }

  if (mode === "result" && activeAudit) {
    return (
      <div>
        <AuditResult audit={activeAudit} onRestart={startForm} />
        {audits.length > 1 && (
          <div className="mx-auto mt-6 max-w-5xl">
            <h3 className="mb-3 text-sm font-semibold text-foreground">История аудитов</h3>
            <div className="space-y-2">
              {audits.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setActiveAuditId(a.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors",
                    a.id === activeAuditId
                      ? "border-foreground bg-muted"
                      : "border-border bg-card hover:bg-muted/50"
                  )}
                >
                  <span className="text-sm text-foreground">{DATE_FORMAT.format(new Date(a.createdAt))}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">{a.score}/100</span>
                    <span className="text-xs text-muted-foreground">{a.level}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const question = AUDIT_QUESTIONS[currentQ]!
  const isLast = currentQ === AUDIT_QUESTIONS.length - 1
  const answeredCount = Object.keys(answers).length
  const progress = Math.round((currentQ / AUDIT_QUESTIONS.length) * 100)

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-2xl font-semibold text-foreground">Экспресс-аудит маркетинга</h1>
        <p className="text-sm text-muted-foreground">10 вопросов · 60 секунд · Скоркарта и точки роста</p>
      </div>

      <div className="mb-8">
        <div className="mb-2 flex justify-between text-xs text-muted-foreground">
          <span>
            Вопрос {currentQ + 1} из {AUDIT_QUESTIONS.length}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted">
          <div
            className="h-1.5 rounded-full bg-foreground transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {question.category}
        </p>
        <h2 className="mb-6 text-lg font-semibold text-foreground">{question.question}</h2>

        <div className="space-y-3">
          {question.options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleAnswer(opt.value)}
              className={cn(
                "w-full rounded-xl border p-4 text-left text-sm transition-all",
                answers[question.id] === opt.value
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-foreground hover:border-foreground/40"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
          disabled={currentQ === 0}
        >
          ← Назад
        </Button>

        {!isLast ? (
          <Button
            size="sm"
            onClick={() => setCurrentQ((q) => q + 1)}
            disabled={answers[question.id] === undefined}
          >
            Далее →
          </Button>
        ) : (
          <Button size="sm" onClick={handleSubmit} disabled={answeredCount < AUDIT_QUESTIONS.length || loading}>
            {loading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Анализирую...
              </>
            ) : (
              <>
                <Sparkles className="size-3.5" />
                Получить результат
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
