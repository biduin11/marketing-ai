"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  Plus,
  RefreshCw,
  Trash2,
  Copy,
  Sparkles,
  Loader2,
  MessageSquareX,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
  createObjection,
  generateResponses,
  deleteObjection,
  type ObjectionItem,
} from "@/lib/actions/objections"
import type { PsychotypeKey } from "@/lib/ai/schemas/objections"
import { TONE_CLASSES, type StatusTone } from "@/lib/status-variants"
import { cn } from "@/lib/utils"

const CATEGORIES = ["Цена", "Доверие", "Конкуренты", "Сроки", "Качество", "Другое"] as const

const PSYCHOTYPE_META: Record<
  PsychotypeKey,
  { label: string; emoji: string; tone: StatusTone }
> = {
  traditionalist: { label: "Традиционалист", emoji: "🐪", tone: "neutral" },
  independent: { label: "Независимый", emoji: "🐯", tone: "muted" },
  aesthete: { label: "Эстет", emoji: "🦚", tone: "success" },
  hedonist: { label: "Гедонист", emoji: "🐱", tone: "warning" },
}
const PSYCHOTYPE_ORDER: PsychotypeKey[] = [
  "traditionalist",
  "independent",
  "aesthete",
  "hedonist",
]

interface ObjectionsViewProps {
  projectId: string
  initialObjections: ObjectionItem[]
}

export function ObjectionsView({ projectId, initialObjections }: ObjectionsViewProps) {
  const [objections, setObjections] = useState<ObjectionItem[]>(initialObjections)
  const [filter, setFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [text, setText] = useState("")
  const [category, setCategory] = useState<string>(CATEGORIES[0])
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  function openAdd() {
    setText("")
    setCategory(CATEGORIES[0])
    setDialogOpen(true)
  }

  async function runGenerate(objectionId: string) {
    setGeneratingIds((prev) => new Set(prev).add(objectionId))
    const result = await generateResponses(objectionId)
    setGeneratingIds((prev) => {
      const next = new Set(prev)
      next.delete(objectionId)
      return next
    })
    if (!result.success) {
      toast.error(result.error)
      return
    }
    setObjections((prev) =>
      prev.map((o) => (o.id === result.data.id ? result.data : o))
    )
    toast.success("Ответы готовы")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return

    startTransition(async () => {
      const result = await createObjection({ projectId, text: trimmed, category })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setObjections((prev) => [result.data, ...prev])
      setDialogOpen(false)
      toast.success("Возражение добавлено")
      void runGenerate(result.data.id)
    })
  }

  function handleDelete(item: ObjectionItem) {
    if (!window.confirm(`Удалить возражение «${item.text}»?`)) return
    startTransition(async () => {
      const result = await deleteObjection(item.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setObjections((prev) => prev.filter((o) => o.id !== item.id))
      toast.success("Возражение удалено")
    })
  }

  function copyResponse(response: string) {
    navigator.clipboard.writeText(response)
    toast.success("Скопировано")
  }

  const filtered =
    filter === "all" ? objections : objections.filter((o) => o.category === filter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            База возражений
          </h2>
          <p className="text-sm text-muted-foreground">
            AI-ответы под каждый психотип покупателя
          </p>
        </div>
        {objections.length > 0 && (
          <Button size="sm" onClick={openAdd}>
            <Plus className="size-3.5" />
            Добавить возражение
          </Button>
        )}
      </div>

      {objections.length === 0 ? (
        <div className="flex h-[50vh] items-center justify-center">
          <EmptyState
            icon={MessageSquareX}
            title="Возражений пока нет"
            description="Добавьте первое возражение — AI подготовит ответы под каждый психотип ваших покупателей."
            action={
              <Button size="sm" onClick={openAdd}>
                <Plus className="size-3.5" />
                Добавить возражение
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Category filter */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                filter === "all"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              Все
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFilter(c)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  filter === c
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                )}
              >
                {c}
              </button>
            ))}
          </div>

          {/* List */}
          {filtered.map((objection) => {
            const generating = generatingIds.has(objection.id)
            return (
              <div
                key={objection.id}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    {objection.category && (
                      <Badge variant="outline" className="mb-2">
                        {objection.category}
                      </Badge>
                    )}
                    <h3 className="text-base font-semibold text-foreground">
                      «{objection.text}»
                    </h3>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runGenerate(objection.id)}
                      disabled={generating}
                    >
                      {generating ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="size-3.5" />
                      )}
                      Перегенерировать
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(objection)}
                      disabled={isPending}
                      className="text-danger hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {objection.responses.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {PSYCHOTYPE_ORDER.map((key) => {
                      const meta = PSYCHOTYPE_META[key]
                      const tone = TONE_CLASSES[meta.tone]
                      const resp = objection.responses.find((r) => r.psychotype === key)
                      return (
                        <div
                          key={key}
                          className={cn("rounded-xl border p-4", tone.bg, tone.border)}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-semibold text-foreground">
                              {meta.emoji} {meta.label}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyResponse(resp?.response ?? "")}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <Copy className="size-3" />
                              Копировать
                            </button>
                          </div>
                          <p className="text-sm leading-relaxed text-foreground">
                            {resp?.response ?? "—"}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <Button size="sm" onClick={() => runGenerate(objection.id)} disabled={generating}>
                      {generating ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="size-3.5" />
                      )}
                      Сгенерировать ответы
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Новое возражение</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="objection-text">Текст возражения</Label>
                <Textarea
                  id="objection-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="дорого / у других дешевле / нам не нужно"
                  rows={3}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Категория</Label>
                <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending || !text.trim()}>
                {isPending && <Loader2 className="size-3.5 animate-spin" />}
                Сохранить и сгенерировать ответы
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
