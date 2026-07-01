"use client"

import { History } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ArtifactVersionSelectProps {
  versions: Array<{ id: string; version: number; createdAt: string }>
  selectedId: string
  onSelect: (id: string) => void
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function ArtifactVersionSelect({
  versions,
  selectedId,
  onSelect,
}: ArtifactVersionSelectProps) {
  if (versions.length <= 1) return null

  return (
    <div className="flex items-center gap-1.5">
      <History className="size-3.5 text-muted-foreground" />
      <Select value={selectedId} onValueChange={(v) => v && onSelect(v)}>
        <SelectTrigger className="h-7 w-auto gap-1 border-[#eaeaea] bg-white px-2 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {versions.map((v, idx) => (
            <SelectItem key={v.id} value={v.id} className="text-xs">
              v{v.version}
              {idx === 0 ? " (последняя)" : ""}
              {" · "}
              {fmtDate(v.createdAt)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
