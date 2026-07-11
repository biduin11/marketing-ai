"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { FlaskConical, Plus, Trash2, Loader2, Play, Archive, RotateCcw, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmptyState } from "@/components/empty-state"
import {
  createHypothesis,
  updateHypothesisStatus,
  completeHypothesis,
  deleteHypothesis,
  type HypothesisItem,
} from "@/lib/actions/hypotheses"
import type { HypothesisStatus, HypothesisResult } from "@prisma/client"
import { TONE_CLASSES, type StatusTone } from "@/lib/status-variants"
import { cn } from "@/lib/utils"

interface HypothesesViewProps {
  projectId: string
  initialHypotheses: HypothesisItem[]
  channels: string[]
}

const STATUS_META: Record<HypothesisStatus, { label: string; tone: StatusTone }> = {
  DRAFT: { label: "Черновик", tone: "muted" },
  RUNNING: { label: "Идёт тест", tone: "warning" },
  COMPLETED: { label: "Завершена", tone: "success" },
  ARCHIVED: { label: "Архив", tone: "neutral" },
}

const CONCLUSION_META: Record<HypothesisResult, { label: string; tone: StatusTone }> = {
  CONFIRMED: { label: "Подтверждена", tone: "success" },
  REJECTED: { label: "Отклонена", tone: "danger" },
  INCONCLUSIVE: { label: "Неоднозначно", tone: "muted" },
}

const FILTERS: { value: HypothesisStatus | "all"; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "DRAFT", label: "Черновик" },
  { value: "RUNNING", label: "Идёт тест" },
  { value: "COMPLETED", label: "Завершено" },
  { value: "ARCHIVED", label: "Архив" },
]

const emptyForm = () => ({
  title: "",
  description: "",
  channel: "",
  budget: "",
  startDate: "",
  endDate: "",
  tags: "",
})

const emptyCompleteForm = () => ({
  result: "",
  roi: "",
  conclusion: "CONFIRMED" as HypothesisResult,
})

export function HypothesesView({ projectId, initialHypotheses, channels }: HypothesesViewProps) {
  const [hypotheses, setHypotheses] = useState<HypothesisItem[]>(initialHypotheses)
  const [filter, setFilter] = useState<HypothesisStatus | "all">("all")
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [completeForm, setCompleteForm] = useState(emptyCompleteForm())
  const [isPending, startTransition] = useTransition()

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function openAdd() {
    setForm(emptyForm())
    setAddOpen(true)
  }

  function openComplete(id: string) {
    setCompleteForm(emptyCompleteForm())
    setCompletingId(id)
  }

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault()
    const title = form.title.trim()
    const channel = form.channel.trim()
    if (!title || !channel) return

    startTransition(async () => {
      const result = await createHypothesis({
        projectId,
        title,
        description: form.description.trim() || undefined,
        channel,
        budget: form.budget ? parseInt(form.budget, 10) : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setHypotheses((prev) => [result.data, ...prev])
      setAddOpen(false)
      toast.success("Гипотеза добавлена")
    })
  }

  function handleCompleteSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!completingId) return
    const result = completeForm.result.trim()
    if (!result) return

    startTransition(async () => {
      const res = await completeHypothesis(completingId, {
        result,
        roi: completeForm.roi ? parseFloat(completeForm.roi) : undefined,
        conclusion: completeForm.conclusion,
      })
      if (!res.success) {
        toast.error(res.error)
        return
      }
      setHypotheses((prev) => prev.map((h) => (h.id === res.data.id ? res.data : h)))
      setCompletingId(null)
      toast.success("Гипотеза завершена")
    })
  }

  function handleStatusChange(id: string, status: HypothesisStatus) {
    startTransition(async () => {
      const result = await updateHypothesisStatus(id, status)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setHypotheses((prev) => prev.map((h) => (h.id === result.data.id ? result.data : h)))
    })
  }

  function handleDelete(item: HypothesisItem) {
    if (!window.confirm(`Удалить гипотезу «${item.title}»?`)) return
    startTransition(async () => {
      const result = await deleteHypothesis(item.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setHypotheses((prev) => prev.filter((h) => h.id !== item.id))
      toast.success("Гипотеза удалена")
    })
  }

  const filtered =
    filter === "all" ? hypotheses : hypotheses.filter((h) => h.status === filter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">Гипотезы</h2>
          <p className="text-sm text-muted-foreground">
            Ведите эксперименты и фиксируйте их результаты
          </p>
        </div>
        {hypotheses.length > 0 && (
          <Button size="sm" onClick={openAdd}>
            <Plus className="size-3.5" />
            Добавить гипотезу
          </Button>
        )}
      </div>

      {hypotheses.length === 0 ? (
        <div className="flex h-[50vh] items-center justify-center">
          <EmptyState
            icon={FlaskConical}
            title="Гипотез пока нет"
            description="Добавьте первую гипотезу — опишите, что тестируете, канал и бюджет, а затем зафиксируйте результат."
            action={
              <Button size="sm" onClick={openAdd}>
                <Plus className="size-3.5" />
                Добавить гипотезу
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Status filter */}
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  filter === f.value
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="space-y-4">
            {filtered.map((h) => {
              const statusMeta = STATUS_META[h.status]
              const statusTone = TONE_CLASSES[statusMeta.tone]
              const conclusionMeta = h.conclusion ? CONCLUSION_META[h.conclusion] : null

              return (
                <div
                  key={h.id}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{h.channel}</Badge>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium",
                            statusTone.bg,
                            statusTone.text
                          )}
                        >
                          {statusMeta.label}
                        </span>
                        {conclusionMeta && (
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-medium",
                              TONE_CLASSES[conclusionMeta.tone].bg,
                              TONE_CLASSES[conclusionMeta.tone].text
                            )}
                          >
                            {conclusionMeta.label}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-foreground">{h.title}</h3>
                      {h.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{h.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {h.budget != null && <span>Бюджет: {h.budget.toLocaleString("ru-RU")} ₽</span>}
                        {(h.startDate || h.endDate) && (
                          <span>
                            {h.startDate ?? "?"} — {h.endDate ?? "?"}
                          </span>
                        )}
                      </div>
                      {h.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {h.tags.map((tag) => (
                            <Badge key={tag} variant="muted" size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {h.status === "DRAFT" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(h.id, "RUNNING")}
                          disabled={isPending}
                        >
                          <Play className="size-3.5" />
                          Запустить
                        </Button>
                      )}
                      {h.status === "RUNNING" && (
                        <Button size="sm" onClick={() => openComplete(h.id)} disabled={isPending}>
                          <CheckCircle2 className="size-3.5" />
                          Завершить
                        </Button>
                      )}
                      {(h.status === "DRAFT" || h.status === "RUNNING" || h.status === "COMPLETED") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(h.id, "ARCHIVED")}
                          disabled={isPending}
                        >
                          <Archive className="size-3.5" />
                        </Button>
                      )}
                      {h.status === "ARCHIVED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(h.id, "DRAFT")}
                          disabled={isPending}
                        >
                          <RotateCcw className="size-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(h)}
                        disabled={isPending}
                        className="text-danger hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {h.status === "COMPLETED" && h.result && (
                    <div className="mt-3 rounded-xl border border-border bg-muted/50 p-4">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">Результат</span>
                        {h.roi != null && (
                          <span className="text-xs font-medium text-foreground">ROI: {h.roi}%</span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed text-foreground">{h.result}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle>Новая гипотеза</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="hyp-title">Название</Label>
                <Input
                  id="hyp-title"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Лид-магнит в Instagram снизит CPL"
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hyp-description">Описание</Label>
                <Textarea
                  id="hyp-description"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Что тестируем и почему"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="hyp-channel">Канал</Label>
                  <Input
                    id="hyp-channel"
                    list="hyp-channels-list"
                    value={form.channel}
                    onChange={(e) => set("channel", e.target.value)}
                    placeholder="Instagram"
                    required
                  />
                  <datalist id="hyp-channels-list">
                    {channels.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hyp-budget">Бюджет (₽)</Label>
                  <Input
                    id="hyp-budget"
                    type="number"
                    min="0"
                    value={form.budget}
                    onChange={(e) => set("budget", e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="hyp-start">Начало</Label>
                  <Input
                    id="hyp-start"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => set("startDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hyp-end">Конец</Label>
                  <Input
                    id="hyp-end"
                    type="date"
                    value={form.endDate}
                    onChange={(e) => set("endDate", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hyp-tags">Теги (через запятую)</Label>
                <Input
                  id="hyp-tags"
                  value={form.tags}
                  onChange={(e) => set("tags", e.target.value)}
                  placeholder="лид-магнит, ретаргетинг"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending || !form.title.trim() || !form.channel.trim()}>
                {isPending && <Loader2 className="size-3.5 animate-spin" />}
                Сохранить
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Complete dialog */}
      <Dialog open={!!completingId} onOpenChange={(open) => !open && setCompletingId(null)}>
        <DialogContent>
          <form onSubmit={handleCompleteSubmit}>
            <DialogHeader>
              <DialogTitle>Завершить гипотезу</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="hyp-result">Результат</Label>
                <Textarea
                  id="hyp-result"
                  value={completeForm.result}
                  onChange={(e) =>
                    setCompleteForm((prev) => ({ ...prev, result: e.target.value }))
                  }
                  placeholder="Что получилось по факту"
                  rows={3}
                  autoFocus
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="hyp-roi">ROI (%)</Label>
                  <Input
                    id="hyp-roi"
                    type="number"
                    step="0.1"
                    value={completeForm.roi}
                    onChange={(e) =>
                      setCompleteForm((prev) => ({ ...prev, roi: e.target.value }))
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Вывод</Label>
                  <Select
                    value={completeForm.conclusion}
                    onValueChange={(v) =>
                      v &&
                      setCompleteForm((prev) => ({ ...prev, conclusion: v as HypothesisResult }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(CONCLUSION_META) as HypothesisResult[]).map((key) => (
                        <SelectItem key={key} value={key}>
                          {CONCLUSION_META[key].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending || !completeForm.result.trim()}>
                {isPending && <Loader2 className="size-3.5 animate-spin" />}
                Сохранить результат
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
