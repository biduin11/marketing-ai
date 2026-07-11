"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus, Copy, Trash2, Loader2, ClipboardList, Sparkles } from "lucide-react"
import type { BriefType } from "@prisma/client"
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
  generateBrief,
  deleteBrief,
  type BriefItem,
} from "@/lib/actions/briefs"
import type { PsychotypeKey } from "@/lib/ai/schemas/objections"
import { cn } from "@/lib/utils"

const BRIEF_TYPES: {
  value: BriefType
  label: string
  emoji: string
  sub: string
}[] = [
  { value: "VIDEO", label: "Видео / Reels", emoji: "🎬", sub: "Сценарий и техзадание" },
  { value: "DESIGN_POST", label: "Дизайн поста", emoji: "🎨", sub: "Макет для соцсетей" },
  { value: "DESIGN_STORY", label: "Stories", emoji: "📱", sub: "Вертикальный формат" },
  { value: "LANDING", label: "Лендинг", emoji: "🌐", sub: "Структура страницы" },
  { value: "PHOTO", label: "Фотосессия", emoji: "📸", sub: "ТЗ для фотографа" },
  { value: "COPYWRITING", label: "Копирайтинг", emoji: "✍️", sub: "Текст и статья" },
]
const BRIEF_TYPE_LABEL: Record<BriefType, string> = Object.fromEntries(
  BRIEF_TYPES.map((t) => [t.value, t.label])
) as Record<BriefType, string>

const PSYCHOTYPES: { value: PsychotypeKey; label: string }[] = [
  { value: "traditionalist", label: "Традиционалист" },
  { value: "independent", label: "Независимый" },
  { value: "aesthete", label: "Эстет" },
  { value: "hedonist", label: "Гедонист" },
]

const FIELD_LABEL: Record<string, string> = {
  objective: "Цель",
  platform: "Площадка и формат",
  targetAudience: "Целевая аудитория",
  hook: "Хук (первые 3 секунды)",
  structure: "Структура",
  visualStyle: "Визуальный стиль",
  voiceover: "Закадровый голос",
  music: "Музыка",
  references: "Референсы",
  dontDo: "Чего избегать",
  deadline: "Дедлайн",
  deliverables: "Что сдаёт подрядчик",
  message: "Главная мысль",
  text: "Текст на макете",
  colorPalette: "Цветовая палитра",
  typography: "Типографика",
  imagery: "Изображения",
  mood: "Настроение",
  format: "Формат",
  trafficSource: "Источник трафика",
  sections: "Структура разделов",
  mustHave: "Обязательные элементы",
  location: "Локация",
  shots: "Список кадров",
  lighting: "Освещение",
  props: "Реквизит",
  keyMessage: "Ключевое сообщение",
  tone: "Тон коммуникации",
  mustInclude: "Обязательные тезисы",
  keywords: "Ключевые слова",
  length: "Объём",
  examples: "Примеры",
}
function fieldLabel(key: string): string {
  return FIELD_LABEL[key] ?? key
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function itemToLine(item: unknown): string {
  if (typeof item === "object" && item !== null) {
    const obj = item as Record<string, unknown>
    const label = obj.timing ?? obj.name ?? obj.type ?? ""
    const body = obj.action ?? obj.content ?? obj.description ?? ""
    return [label, body].filter(Boolean).join(": ")
  }
  return String(item)
}

function briefToText(brief: BriefItem): string {
  const lines = [brief.title]
  for (const [key, value] of Object.entries(brief.content)) {
    if (key === "title") continue
    lines.push("")
    lines.push(fieldLabel(key) + ":")
    if (Array.isArray(value)) {
      value.forEach((item) => lines.push("• " + itemToLine(item)))
    } else {
      lines.push(String(value))
    }
  }
  return lines.join("\n")
}

interface BriefsViewProps {
  projectId: string
  initialBriefs: BriefItem[]
}

export function BriefsView({ projectId, initialBriefs }: BriefsViewProps) {
  const [briefs, setBriefs] = useState<BriefItem[]>(initialBriefs)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedType, setSelectedType] = useState<BriefType | null>(null)
  const [task, setTask] = useState("")
  const [psychotype, setPsychotype] = useState<PsychotypeKey>("traditionalist")
  const [generating, setGenerating] = useState(false)
  const [isPending, startTransition] = useTransition()

  function openCreate() {
    setStep(1)
    setSelectedType(null)
    setTask("")
    setPsychotype("traditionalist")
    setDialogOpen(true)
  }

  function selectType(type: BriefType) {
    setSelectedType(type)
    setStep(2)
  }

  async function handleGenerate() {
    if (!selectedType || !task.trim()) return
    setGenerating(true)
    try {
      const result = await generateBrief(projectId, selectedType, task.trim(), psychotype)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setBriefs((prev) => [result.data, ...prev])
      setDialogOpen(false)
      toast.success("Бриф готов")
    } catch {
      toast.error("Не удалось сгенерировать бриф")
    } finally {
      setGenerating(false)
    }
  }

  function handleDelete(item: BriefItem) {
    if (!window.confirm(`Удалить бриф «${item.title}»?`)) return
    startTransition(async () => {
      const result = await deleteBrief(item.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setBriefs((prev) => prev.filter((b) => b.id !== item.id))
      toast.success("Бриф удалён")
    })
  }

  function copyBrief(brief: BriefItem) {
    navigator.clipboard.writeText(briefToText(brief))
    toast.success("Скопировано")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Брифы для подрядчиков
          </h2>
          <p className="text-sm text-muted-foreground">
            AI заполняет бриф данными вашего проекта — подрядчик получает всё
            необходимое без уточнений
          </p>
        </div>
        {briefs.length > 0 && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-3.5" />
            Создать бриф
          </Button>
        )}
      </div>

      {briefs.length === 0 ? (
        <div className="flex h-[50vh] items-center justify-center">
          <EmptyState
            icon={ClipboardList}
            title="Брифов пока нет"
            description="Создайте первый бриф — AI заполнит его данными вашего проекта."
            action={
              <Button size="sm" onClick={openCreate}>
                <Plus className="size-3.5" />
                Создать бриф
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {briefs.map((brief) => (
            <div
              key={brief.id}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                  <Badge variant="outline">{BRIEF_TYPE_LABEL[brief.type]}</Badge>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">
                    {brief.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {fmtDate(brief.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyBrief(brief)}>
                    <Copy className="size-3.5" />
                    Копировать
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(brief)}
                    disabled={isPending}
                    className="text-danger hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(brief.content).map(([key, value]) => {
                  if (key === "title") return null
                  return (
                    <div
                      key={key}
                      className="border-b border-border pb-4 last:border-0 last:pb-0"
                    >
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {fieldLabel(key)}
                      </p>
                      {Array.isArray(value) ? (
                        <ul className="space-y-1">
                          {value.map((item, i) => (
                            <li
                              key={i}
                              className="flex gap-2 text-sm text-foreground"
                            >
                              {typeof item === "object" && item !== null ? (
                                <span>{itemToLine(item)}</span>
                              ) : (
                                <>
                                  <span className="shrink-0 text-muted-foreground">•</span>
                                  <span>{String(item)}</span>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm leading-relaxed text-foreground">
                          {String(value)}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {step === 1 ? "Выберите тип брифа" : "Задача и аудитория"}
            </DialogTitle>
          </DialogHeader>

          {step === 1 ? (
            <div className="grid grid-cols-2 gap-3 py-2">
              {BRIEF_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => selectType(t.value)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-colors",
                    selectedType === t.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:bg-muted"
                  )}
                >
                  <span className="mb-1 block text-2xl">{t.emoji}</span>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      selectedType === t.value ? "text-background" : "text-foreground"
                    )}
                  >
                    {t.label}
                  </p>
                  <p
                    className={cn(
                      "text-xs",
                      selectedType === t.value
                        ? "text-background/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {t.sub}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="brief-task">Опишите задачу</Label>
                <Textarea
                  id="brief-task"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  placeholder="Например: Reels про преимущества металлочерепицы перед профнастилом для частных застройщиков"
                  rows={4}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Психотип аудитории</Label>
                <Select
                  value={psychotype}
                  onValueChange={(v) => v && setPsychotype(v as PsychotypeKey)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PSYCHOTYPES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                Назад
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generating || !task.trim()}
              >
                {generating ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                Сгенерировать бриф
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
