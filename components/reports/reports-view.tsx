"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Sparkles,
  RefreshCw,
  Loader2,
  FileText,
  Download,
  Trophy,
  ShieldAlert,
  Lightbulb,
  Flag,
  CheckCircle2,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import { StatCard, StatRow } from "@/components/shared/stat-card"
import { runReport } from "@/lib/actions/ai"
import { uploadReportPdf } from "@/lib/actions/blob"
import type { ExecutiveReport } from "@/lib/ai/schemas/executiveReport"
import { cn } from "@/lib/utils"

type SectionTone = "success" | "danger" | "warning" | "neutral"

const SECTION_TONE: Record<
  SectionTone,
  { chip: string; icon: string; marker: string }
> = {
  success: { chip: "bg-success/10 text-success", icon: "text-success", marker: "bg-success" },
  danger: { chip: "bg-danger/10 text-danger", icon: "text-danger", marker: "bg-danger" },
  warning: { chip: "bg-warning/10 text-warning", icon: "text-warning", marker: "bg-warning" },
  neutral: { chip: "bg-muted text-foreground", icon: "text-foreground", marker: "bg-foreground" },
}

/** Карточка секции с иконкой-в-чипе, заголовком и счётчиком (паттерн эталона #3). */
function SectionCard({
  title,
  icon: Icon,
  tone,
  count,
  children,
}: {
  title: string
  icon: LucideIcon
  tone: SectionTone
  count?: number
  children: React.ReactNode
}) {
  const t = SECTION_TONE[tone]
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className={cn("flex size-8 items-center justify-center rounded-lg", t.chip)}>
          <Icon className="size-4" />
        </span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {count != null && (
          <Badge variant="muted" className="ml-auto">
            {count}
          </Badge>
        )}
      </div>
      {children}
    </div>
  )
}

/** Список с семантическими маркерами-точками вместо голых буллетов. */
function MarkerList({ items, tone }: { items: string[]; tone: SectionTone }) {
  const t = SECTION_TONE[tone]
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
          <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", t.marker)} />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  )
}

type ReportTab = "weekly" | "monthly" | "quarterly"
type ArtifactType = "REPORT_WEEKLY" | "REPORT_MONTHLY" | "REPORT_QUARTERLY"

interface ReportEntry {
  report: ExecutiveReport
  id: string
  version: number
}

interface ReportsViewProps {
  projectId: string
  weekly: ReportEntry | null
  monthly: ReportEntry | null
  quarterly: ReportEntry | null
}

const TABS: { id: ReportTab; label: string; artifactType: ArtifactType; defaultDays: number }[] = [
  { id: "weekly", label: "Неделя", artifactType: "REPORT_WEEKLY", defaultDays: 7 },
  { id: "monthly", label: "Месяц", artifactType: "REPORT_MONTHLY", defaultDays: 30 },
  { id: "quarterly", label: "Квартал", artifactType: "REPORT_QUARTERLY", defaultDays: 90 },
]

function getDefaultRange(days: number): { from: string; to: string } {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - days + 1)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

function formatPeriod(from: string, to: string): string {
  const f = new Date(from).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
  const t = new Date(to).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
  return `${f} — ${t}`
}

export function ReportsView({ projectId, weekly, monthly, quarterly }: ReportsViewProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ReportTab>("monthly")
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const defaultRange = getDefaultRange(
    TABS.find((t) => t.id === activeTab)!.defaultDays
  )
  const [from, setFrom] = useState(defaultRange.from)
  const [to, setTo] = useState(defaultRange.to)

  function handleTabChange(tab: ReportTab) {
    setActiveTab(tab)
    const { defaultDays } = TABS.find((t) => t.id === tab)!
    const range = getDefaultRange(defaultDays)
    setFrom(range.from)
    setTo(range.to)
  }

  const currentEntry = { weekly, monthly, quarterly }[activeTab]
  const artifactType = TABS.find((t) => t.id === activeTab)!.artifactType

  async function generate(force: boolean) {
    if (from > to) {
      toast.error("Дата начала не может быть позже даты окончания")
      return
    }
    setLoading(true)
    try {
      const result = await runReport(projectId, {
        type: artifactType,
        from,
        to,
        period: formatPeriod(from, to),
      }, force)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(force ? "Отчёт обновлён" : "Отчёт готов")
      router.refresh()
    } catch {
      toast.error("Не удалось сгенерировать отчёт")
    } finally {
      setLoading(false)
    }
  }

  async function downloadPdf() {
    if (!currentEntry) return
    setPdfLoading(true)
    try {
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
      const report = currentEntry.report
      const period = formatPeriod(from, to)

      let y = 20
      const margin = 20
      const width = 170

      doc.setFont("helvetica", "bold")
      doc.setFontSize(18)
      doc.text("Executive Report", margin, y)
      y += 8

      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.setTextColor(107, 114, 128)
      doc.text(period, margin, y)
      y += 12

      doc.setFont("helvetica", "bold")
      doc.setFontSize(14)
      doc.setTextColor(17, 17, 17)
      const headlineLines = doc.splitTextToSize(report.headline, width) as string[]
      doc.text(headlineLines, margin, y)
      y += headlineLines.length * 7 + 6

      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.setTextColor(55, 65, 81)
      const summaryLines = doc.splitTextToSize(report.summary, width) as string[]
      doc.text(summaryLines, margin, y)
      y += summaryLines.length * 5 + 10

      function addSection(title: string, items: string[]) {
        if (y > 260) { doc.addPage(); y = 20 }
        doc.setFont("helvetica", "bold")
        doc.setFontSize(11)
        doc.setTextColor(17, 17, 17)
        doc.text(title, margin, y)
        y += 6
        doc.setFont("helvetica", "normal")
        doc.setFontSize(10)
        doc.setTextColor(55, 65, 81)
        for (const item of items) {
          const lines = doc.splitTextToSize(`• ${item}`, width) as string[]
          if (y + lines.length * 5 > 270) { doc.addPage(); y = 20 }
          doc.text(lines, margin, y)
          y += lines.length * 5 + 2
        }
        y += 4
      }

      addSection("Достижения", report.wins)
      addSection("Риски", report.risks)
      addSection("Рекомендации", report.recommendations)
      addSection("Фокус следующего периода", report.nextPeriodFocus)

      doc.setFontSize(8)
      doc.setTextColor(156, 163, 175)
      doc.text(`AI Marketing OS · ${new Date().toLocaleDateString("ru-RU")}`, margin, 287)

      const dataUri = doc.output("datauristring")
      const uploadResult = await uploadReportPdf(projectId, currentEntry.id, dataUri)

      if (!uploadResult.success) {
        doc.save(`report-${activeTab}-${from}.pdf`)
        toast.success("PDF скачан (Vercel Blob недоступен)")
        return
      }

      window.open(uploadResult.url, "_blank")
      toast.success("PDF готов")
    } catch {
      toast.error("Не удалось создать PDF")
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">Отчёты</h2>
          <p className="text-sm text-muted-foreground">
            AI-резюме для руководителя с экспортом в PDF
          </p>
        </div>
        {currentEntry && (
          <Button
            variant="outline"
            size="sm"
            onClick={downloadPdf}
            disabled={pdfLoading}
          >
            {pdfLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            Скачать PDF
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={
              activeTab === t.id
                ? "flex-1 rounded-lg bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-sm"
                : "flex-1 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Period picker */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label className="mb-1 block text-xs text-muted-foreground">Начало периода</Label>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-40"
          />
        </div>
        <div>
          <Label className="mb-1 block text-xs text-muted-foreground">Конец периода</Label>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-40"
          />
        </div>
        {currentEntry ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => generate(true)}
            disabled={loading}
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            Обновить отчёт
          </Button>
        ) : (
          <Button size="sm" onClick={() => generate(false)} disabled={loading}>
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            Сгенерировать отчёт
          </Button>
        )}
      </div>

      {/* Report display */}
      {!currentEntry ? (
        <div className="flex h-[40vh] items-center justify-center">
          <EmptyState
            icon={FileText}
            title="Отчёт не создан"
            description="Выберите период и нажмите «Сгенерировать отчёт» — AI составит резюме для руководителя."
          />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Headline — акцентный вывод с иконкой-в-чипе */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
                <Sparkles className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Главный вывод
                  </p>
                  <Badge variant="outline" size="sm">
                    версия {currentEntry.version}
                  </Badge>
                </div>
                <p className="text-lg font-semibold leading-snug text-foreground">
                  {currentEntry.report.headline}
                </p>
              </div>
            </div>
          </div>

          {/* Метрик-строка — фирменный приём эталона (#1) */}
          <StatRow cols={4}>
            <StatCard
              label="Достижения"
              value={currentEntry.report.wins.length}
              sub="за период"
              icon={Trophy}
              tone="success"
            />
            <StatCard
              label="Риски"
              value={currentEntry.report.risks.length}
              sub="требуют внимания"
              icon={ShieldAlert}
              tone="danger"
            />
            <StatCard
              label="Рекомендации"
              value={currentEntry.report.recommendations.length}
              sub="к внедрению"
              icon={Lightbulb}
            />
            <StatCard
              label="Фокусы"
              value={currentEntry.report.nextPeriodFocus.length}
              sub="след. период"
              icon={Flag}
              tone="warning"
            />
          </StatRow>

          {/* Summary */}
          <SectionCard title="Исполнительное резюме" icon={FileText} tone="neutral">
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {currentEntry.report.summary}
            </p>
          </SectionCard>

          {/* Wins / Risks */}
          <div className="grid gap-5 sm:grid-cols-2">
            <SectionCard
              title="Достижения"
              icon={CheckCircle2}
              tone="success"
              count={currentEntry.report.wins.length}
            >
              <MarkerList items={currentEntry.report.wins} tone="success" />
            </SectionCard>
            <SectionCard
              title="Риски"
              icon={AlertTriangle}
              tone="danger"
              count={currentEntry.report.risks.length}
            >
              <MarkerList items={currentEntry.report.risks} tone="danger" />
            </SectionCard>
          </div>

          {/* Recommendations — нумерованные кружки (#4) */}
          <SectionCard
            title="Рекомендации"
            icon={Lightbulb}
            tone="neutral"
            count={currentEntry.report.recommendations.length}
          >
            <ol className="space-y-3">
              {currentEntry.report.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-foreground">{rec}</p>
                </li>
              ))}
            </ol>
          </SectionCard>

          {/* Next period focus — мини-карточки с флагом вместо буллетов */}
          <SectionCard
            title="Фокус следующего периода"
            icon={Flag}
            tone="warning"
            count={currentEntry.report.nextPeriodFocus.length}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {currentEntry.report.nextPeriodFocus.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 p-3"
                >
                  <Flag className="mt-0.5 size-3.5 shrink-0 text-warning" />
                  <p className="text-sm leading-snug text-foreground">{item}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  )
}
