"use client"

import { useState, useTransition } from "react"
import { X, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addChannel, deleteChannel } from "@/lib/actions/channels"
import type { ChannelItem } from "@/lib/actions/channels"
import { cn } from "@/lib/utils"

interface ChannelsSectionProps {
  projectId: string
  initialChannels: ChannelItem[]
}

export function ChannelsSection({ projectId, initialChannels }: ChannelsSectionProps) {
  const [channels, setChannels] = useState<ChannelItem[]>(initialChannels)
  const [newName, setNewName] = useState("")
  const [, startTransition] = useTransition()

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    startTransition(async () => {
      const result = await addChannel({ projectId, name })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setChannels((prev) => [...prev, result.data])
      setNewName("")
    })
  }

  function handleDelete(item: ChannelItem) {
    if (item.isDefault) return
    startTransition(async () => {
      const result = await deleteChannel(item.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setChannels((prev) => prev.filter((c) => c.id !== item.id))
    })
  }

  return (
    <div className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-foreground">Каналы продвижения</h3>
      <p className="mb-4 text-sm text-[#6b7280]">
        Список каналов используется при вводе метрик. Серые — базовые (всегда доступны), тёмные —
        добавлены вами.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {channels.map((ch) => (
          <span
            key={ch.id}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium",
              ch.isDefault
                ? "border-[#eaeaea] bg-neutral-50 text-[#6b7280]"
                : "border-[#d1d5db] bg-[#111111]/5 text-[#111111]"
            )}
          >
            {ch.name}
            {!ch.isDefault && (
              <button
                type="button"
                onClick={() => handleDelete(ch)}
                className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-black/10"
                aria-label={`Удалить ${ch.name}`}
              >
                <X className="size-3" />
              </button>
            )}
          </span>
        ))}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          placeholder="Новый канал..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="max-w-xs"
        />
        <Button type="submit" size="sm" disabled={!newName.trim()}>
          <Plus className="size-3.5" />
          Добавить
        </Button>
      </form>
    </div>
  )
}
