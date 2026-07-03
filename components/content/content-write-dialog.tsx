"use client"

import { useState } from "react"
import { Loader2, Sparkles, Copy, Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { writeContentText } from "@/lib/actions/content-write"
import type { ContentPlan } from "@/lib/ai/schemas/contentPlan"

type ContentItem = ContentPlan["calendar"][number]

interface ContentWriteDialogProps {
  open: boolean
  onClose: () => void
  projectId: string
  item: ContentItem
}

const TYPE_LABELS: Record<string, string> = {
  reels: "Reels",
  post: "Пост",
  stories: "Stories",
  email: "Email",
}

export function ContentWriteDialog({
  open,
  onClose,
  projectId,
  item,
}: ContentWriteDialogProps) {
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

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
      </DialogContent>
    </Dialog>
  )
}
