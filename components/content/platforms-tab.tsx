"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Camera,
  Send,
  Users,
  PlayCircle,
  FileText,
  Mail,
  LayoutList,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/empty-state"
import {
  addContentPlatform,
  updateContentPlatform,
  deleteContentPlatform,
  type ContentPlatformItem,
} from "@/lib/actions/content-platforms"
import type { ContentPlan } from "@/lib/ai/schemas/contentPlan"

const NAME_SUGGESTIONS = [
  "Instagram",
  "ВКонтакте",
  "Telegram",
  "YouTube",
  "Блог / SEO",
  "Email рассылка",
  "Авито",
  "TikTok",
  "WhatsApp",
] as const

type PlatformKey =
  | "instagram"
  | "telegram"
  | "vk"
  | "youtube"
  | "blog"
  | "email"

const KEY_ALIASES: Record<PlatformKey, string[]> = {
  instagram: ["instagram", "инстаграм", "инста"],
  telegram: ["telegram", "телеграм", "тг"],
  vk: ["vk", "вконтакте", "вк"],
  youtube: ["youtube", "ютуб"],
  blog: ["blog", "блог", "seo"],
  email: ["email", "почта", "рассылка"],
}

const KEY_ICON: Record<PlatformKey, React.ComponentType<{ className?: string }>> = {
  instagram: Camera,
  telegram: Send,
  vk: Users,
  youtube: PlayCircle,
  blog: FileText,
  email: Mail,
}

function normalizeKey(name: string): PlatformKey | null {
  const n = name.toLowerCase()
  for (const [key, aliases] of Object.entries(KEY_ALIASES) as [
    PlatformKey,
    string[],
  ][]) {
    if (aliases.some((a) => n.includes(a))) return key
  }
  return null
}

function inferItemKey(item: ContentPlan["calendar"][number]): PlatformKey {
  const p = (item as { platform?: PlatformKey }).platform
  if (p) return p
  switch (item.type) {
    case "email":
      return "email"
    default:
      return "instagram"
  }
}

function getFormat(item: ContentPlan["calendar"][number]): string {
  const f = (item as { format?: string }).format
  if (f) return f
  switch (item.type) {
    case "reels":
      return "Reels"
    case "stories":
      return "Сторис"
    case "email":
      return "Email"
    default:
      return "Пост"
  }
}

interface PlatformsTabProps {
  projectId: string
  initialPlatforms: ContentPlatformItem[]
  plan: ContentPlan | null
}

export function PlatformsTab({
  projectId,
  initialPlatforms,
  plan,
}: PlatformsTabProps) {
  const [platforms, setPlatforms] =
    useState<ContentPlatformItem[]>(initialPlatforms)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ContentPlatformItem | null>(null)
  const [name, setName] = useState("")
  const [share, setShare] = useState("")
  const [isPending, startTransition] = useTransition()

  function openAdd() {
    setEditing(null)
    setName("")
    setShare("")
    setDialogOpen(true)
  }

  function openEdit(item: ContentPlatformItem) {
    setEditing(item)
    setName(item.name)
    setShare(item.share != null ? String(item.share) : "")
    setDialogOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    const shareValue = share.trim() === "" ? null : Number(share)
    if (
      shareValue != null &&
      (!Number.isInteger(shareValue) || shareValue < 0 || shareValue > 100)
    ) {
      toast.error("Доля — целое число от 0 до 100")
      return
    }

    startTransition(async () => {
      if (editing) {
        const result = await updateContentPlatform({
          id: editing.id,
          name: trimmed,
          share: shareValue,
        })
        if (!result.success) {
          toast.error(result.error)
          return
        }
        setPlatforms((prev) =>
          prev.map((p) => (p.id === result.data.id ? result.data : p))
        )
        toast.success("Площадка обновлена")
      } else {
        const result = await addContentPlatform({
          projectId,
          name: trimmed,
          share: shareValue,
        })
        if (!result.success) {
          toast.error(result.error)
          return
        }
        setPlatforms((prev) => [...prev, result.data])
        toast.success("Площадка добавлена")
      }
      setDialogOpen(false)
    })
  }

  function handleDelete(item: ContentPlatformItem) {
    if (!window.confirm(`Удалить площадку «${item.name}»?`)) return
    startTransition(async () => {
      const result = await deleteContentPlatform(item.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setPlatforms((prev) => prev.filter((p) => p.id !== item.id))
      toast.success("Площадка удалена")
    })
  }

  const calendar = plan?.calendar ?? []

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Площадки, которые AI учитывает при планировании контента
        </p>
        {platforms.length > 0 && (
          <Button size="sm" onClick={openAdd}>
            <Plus className="size-3.5" />
            Добавить площадку
          </Button>
        )}
      </div>

      {platforms.length === 0 ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <EmptyState
            icon={LayoutList}
            title="Площадки не добавлены"
            description="Добавьте первую площадку, чтобы AI учитывал её при планировании контента."
            action={
              <Button size="sm" onClick={openAdd}>
                <Plus className="size-3.5" />
                Добавить площадку
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {platforms.map((platform) => {
            const key = normalizeKey(platform.name)
            const Icon = key ? KEY_ICON[key] : LayoutList
            const items = key
              ? calendar.filter((i) => inferItemKey(i) === key)
              : []
            const formats = Array.from(new Set(items.map(getFormat)))
            return (
              <div
                key={platform.id}
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="mb-3 flex items-start gap-2">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-4 text-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {platform.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {items.length > 0
                        ? `${items.length} публ. в плане`
                        : "нет публикаций в плане"}
                    </p>
                  </div>
                  {/* Edit / delete — появляются на hover */}
                  <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => openEdit(platform)}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label={`Редактировать ${platform.name}`}
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(platform)}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                      aria-label={`Удалить ${platform.name}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {platform.share != null && (
                  <Badge variant="neutral" size="sm" className="mb-3">
                    Доля {platform.share}%
                  </Badge>
                )}

                {formats.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {formats.map((f) => (
                      <span
                        key={f}
                        className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-foreground"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}

                {items.length > 0 && (
                  <ul className="space-y-1">
                    {items.slice(0, 3).map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-1.5 text-xs text-muted-foreground"
                      >
                        <span className="mt-1 size-1 shrink-0 rounded-full bg-neutral-300" />
                        <span className="line-clamp-1">{item.title}</span>
                      </li>
                    ))}
                    {items.length > 3 && (
                      <li className="text-xs text-muted-foreground">
                        ещё {items.length - 3} публикаций
                      </li>
                    )}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Редактировать площадку" : "Добавить площадку"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="platform-name" className="mb-1.5 block text-sm">
                Название площадки
              </Label>
              <Input
                id="platform-name"
                list="platform-suggestions"
                placeholder="Instagram, VK, Telegram, Авито…"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <datalist id="platform-suggestions">
                {NAME_SUGGESTIONS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div>
              <Label htmlFor="platform-share" className="mb-1.5 block text-sm">
                Доля публикаций, %{" "}
                <span className="text-muted-foreground">(опционально)</span>
              </Label>
              <Input
                id="platform-share"
                type="number"
                min={0}
                max={100}
                placeholder="напр. 40"
                value={share}
                onChange={(e) => setShare(e.target.value)}
                className="max-w-[140px]"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
              >
                Отмена
              </Button>
              <Button type="submit" size="sm" disabled={isPending || !name.trim()}>
                {isPending && <Loader2 className="size-3.5 animate-spin" />}
                {editing ? "Сохранить" : "Добавить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
