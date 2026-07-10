"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles, Copy, Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { writeContentText } from "@/lib/actions/content-write"
import { updateContentItemStatus } from "@/lib/actions/content"
import type { ContentPlan, ContentStatus } from "@/lib/ai/schemas/contentPlan"

type ContentItem = ContentPlan["calendar"][number]

interface ContentWriteDialogProps {
  open: boolean
  onClose: () => void
  projectId: string
  item: ContentItem
  itemIndex: number
}

const TYPE_LABELS: Record<string, string> = {
  reels: "Reels",
  post: "Пост",
  stories: "Stories",
  email: "Email",
}

const STATUS_OPTIONS: { value: ContentStatus; label: string; className: string }[] = [
  { value: "draft", label: "Черновик", className: "bg-muted text-muted-foreground" },
  { value: "ready", label: "Подготовлено", className: "bg-muted text-foreground" },
  { value: "review", label: "На согласовании", className: "bg-warning/10 text-warning" },
  { value: "published", label: "Опубликовано", className: "bg-success/10 text-success" },
]

export function ContentWriteDialog({
  open,
  onClose,
  projectId,
  item,
  itemIndex,
}: ContentWriteDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [status, setStatus] = useState<ContentStatus>(item.status ?? "draft")

  async function handleStatusChange(next: ContentStatus) {
    if (next === status) return
    const previous = status
    setStatus(next)
    const result = await updateContentItemStatus({
      projectId,
      itemIndex,
      status: next,
    })
    if (!result.success) {
      toast.error(result.error)
      setStatus(previous)
      return
    }
    router.refresh()
  }

  async function generate() {
    setLoading(true)
    setText(null)
    try {
      const result = await writeContentText({
        projectId,
        title: item.title,
        type: item.type,
        category: item.category,
        platform: (item as { platform?: string }).platform,
        hook: item.hook,
      })
      if (result.success) {
        setText(result.text)
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error("Ошибка генерации")
    } finally {
      setLoading(false)
    }
  }

  async function copyText() {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Скопировано")
    setTimeout(() => setCopied(false), 2000)
  }

  function handleOpenChange(v: boolean) {
    if (!v) {
      onClose()
      setText(null)
    }
  }

  const platform = (item as { platform?: string }).platform
  const time = (item as { time?: string }).time

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[580px]">
        <DialogHeader>
          <DialogTitle className="text-base">
            Написать {TYPE_LABELS[item.type] ?? item.type}
          </DialogTitle>
        </DialogHeader>

        {/* Content metadata */}
        <div className="rounded-xl bg-muted px-4 py-3 space-y-1">
          <p className="text-sm font-medium text-foreground">{item.title}</p>
          <p className="text-xs text-muted-foreground">
            {TYPE_LABELS[item.type] ?? item.type}
            {platform && ` · ${platform}`}
            {time && ` · ${time}`}
          </p>
          {item.hook && (
            <p className="text-xs text-muted-foreground italic">Hook: {item.hook}</p>
          )}
        </div>

        {/* Generated text */}
        {text && (
          <div className="relative rounded-xl border border-border bg-card">
            <div className="max-h-72 overflow-y-auto p-4">
              <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed font-sans">
                {text}
              </pre>
            </div>
            <div className="flex justify-end border-t border-border px-3 py-2">
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => void copyText()}>
                {copied ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
                {copied ? "Скопировано" : "Скопировать"}
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {text && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => void generate()}
              disabled={loading}
            >
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              Ещё вариант
            </Button>
          )}
          <Button
            className={text ? "flex-1" : "w-full"}
            onClick={() => void generate()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            {loading ? "Генерирую..." : text ? "Перегенерировать" : "Написать текст"}
          </Button>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
          <span className="text-xs text-muted-foreground">Статус:</span>
          <div className="flex gap-1">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => void handleStatusChange(s.value)}
                className={cn(
                  "text-xs px-2 py-1 rounded-full border border-transparent transition-all",
                  s.className,
                  status === s.value
                    ? "ring-2 ring-offset-1 ring-foreground font-semibold"
                    : "opacity-60 hover:opacity-100"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
