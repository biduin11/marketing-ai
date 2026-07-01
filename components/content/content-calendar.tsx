"use client"

import React, { useState } from "react"
import { cn } from "@/lib/utils"
import {
  ChevronDown,
  Camera,
  Send,
  PlayCircle,
  FileText,
  Mail,
  Users,
  Sparkles,
} from "lucide-react"
import type { ContentPlan } from "@/lib/ai/schemas/contentPlan"
import { ContentWriteDialog } from "@/components/content/content-write-dialog"

type CalendarItem = ContentPlan["calendar"][number]

const PLATFORMS = [
  { id: "instagram", label: "Instagram", Icon: Camera },
  { id: "telegram", label: "Telegram", Icon: Send },
  { id: "vk", label: "VK", Icon: Users },
  { id: "youtube", label: "YouTube", Icon: PlayCircle },
  { id: "blog", label: "Блог / SEO", Icon: FileText },
  { id: "email", label: "Email рассылка", Icon: Mail },
] as const

type PlatformId = (typeof PLATFORMS)[number]["id"]

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
const WEEKS = [1, 2, 3, 4] as const
type Week = (typeof WEEKS)[number]

function inferPlatform(item: CalendarItem): PlatformId {
  const p = (item as { platform?: string }).platform as PlatformId | undefined
  if (p && PLATFORMS.some((pl) => pl.id === p)) return p
  switch (item.type) {
    case "reels":
      return "instagram"
    case "stories":
      return "instagram"
    case "email":
      return "email"
    default:
      return "instagram"
  }
}

function getFormat(item: CalendarItem): string {
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

function getTime(item: CalendarItem): string | undefined {
  return (item as { time?: string }).time
}

function getStatus(item: CalendarItem): string {
  return (item as { status?: string }).status ?? "draft"
}

const STATUS_CLS: Record<string, string> = {
  published: "bg-foreground",
  review: "bg-muted-foreground/60",
  ready: "border border-foreground bg-transparent",
  draft: "border border-muted-foreground/40 bg-transparent",
}

interface ContentCalendarProps {
  items: CalendarItem[]
  projectId: string
}

export function ContentCalendar({ items, projectId }: ContentCalendarProps) {
  const [view, setView] = useState<"week" | "month">("week")
  const [selectedWeek, setSelectedWeek] = useState<Week>(1)
  const [platformFilter, setPlatformFilter] = useState<PlatformId | "all">("all")
  const [writeItem, setWriteItem] = useState<CalendarItem | null>(null)

  const weekItems = items.filter((i) => i.week === selectedWeek)
  const visiblePlatforms: PlatformEntry[] =
    platformFilter === "all"
      ? [...PLATFORMS]
      : PLATFORMS.filter((p) => p.id === platformFilter)

  return (
    <div className="space-y-3">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Platform filter */}
        <div className="relative">
          <select
            value={platformFilter}
            onChange={(e) =>
              setPlatformFilter(e.target.value as PlatformId | "all")
            }
            className="appearance-none rounded-lg border border-[#eaeaea] bg-white py-1.5 pl-3 pr-7 text-sm text-foreground focus:outline-none"
          >
            <option value="all">Все площадки</option>
            {PLATFORMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Week tabs */}
          {view === "week" && (
            <div className="flex gap-1">
              {WEEKS.map((w) => (
                <button
                  key={w}
                  onClick={() => setSelectedWeek(w)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    selectedWeek === w
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-muted-foreground hover:bg-neutral-200"
                  )}
                >
                  {w} нед.
                </button>
              ))}
            </div>
          )}

          {/* View toggle */}
          <div className="flex overflow-hidden rounded-lg border border-[#eaeaea]">
            {(["week", "month"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1.5 text-sm transition-colors",
                  view === v
                    ? "bg-neutral-900 font-medium text-white"
                    : "bg-white text-muted-foreground hover:bg-neutral-50"
                )}
              >
                {v === "week" ? "Неделя" : "Месяц"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "week" ? (
        <WeekGrid
          items={weekItems}
          allItems={items}
          platforms={visiblePlatforms}
          week={selectedWeek}
          onWrite={setWriteItem}
        />
      ) : (
        <MonthGrid items={items} onWrite={setWriteItem} />
      )}

      {writeItem && (
        <ContentWriteDialog
          open={true}
          onClose={() => setWriteItem(null)}
          projectId={projectId}
          item={writeItem}
        />
      )}

      {/* Status legend */}
      <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Статусы публикаций:</span>
        {[
          { key: "draft", label: "Черновик" },
          { key: "ready", label: "Подготовлено" },
          { key: "review", label: "На согласовании" },
          { key: "published", label: "Опубликовано" },
        ].map(({ key, label }) => (
          <span key={key} className="flex items-center gap-1.5">
            <span
              className={cn(
                "size-2.5 shrink-0 rounded-full",
                STATUS_CLS[key]
              )}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

type PlatformEntry = {
  id: PlatformId
  label: string
  Icon: React.ComponentType<{ className?: string }>
}

function WeekGrid({
  items,
  allItems,
  platforms,
  week,
  onWrite,
}: {
  items: CalendarItem[]
  allItems: CalendarItem[]
  platforms: readonly PlatformEntry[]
  week: Week
  onWrite: (item: CalendarItem) => void
}) {
  const startDay = (week - 1) * 7 + 1
  const days = Array.from({ length: 7 }, (_, i) => startDay + i)

  // Build lookup: platformId-day → items
  const grid = new Map<string, CalendarItem[]>()
  for (const item of items) {
    const platform = inferPlatform(item)
    const key = `${platform}-${item.day}`
    const prev = grid.get(key) ?? []
    grid.set(key, [...prev, item])
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#eaeaea]">
      <div className="min-w-[720px]">
        {/* Day headers */}
        <div
          className="grid border-b border-[#eaeaea] bg-neutral-50"
          style={{ gridTemplateColumns: "168px repeat(7, 1fr)" }}
        >
          <div className="border-r border-[#eaeaea] p-3" />
          {days.map((day, i) => (
            <div
              key={day}
              className="border-r border-[#eaeaea] px-2 py-2 text-center last:border-r-0"
            >
              <p className="text-xs text-muted-foreground">{DAY_NAMES[i]}</p>
              <p className="text-xs font-semibold text-foreground">{day}</p>
            </div>
          ))}
        </div>

        {/* Platform rows */}
        {platforms.map(({ id, label, Icon }) => {
          const platformTotal = allItems.filter(
            (i) => inferPlatform(i) === id
          ).length
          return (
            <div
              key={id}
              className="grid border-b border-[#eaeaea] last:border-b-0"
              style={{ gridTemplateColumns: "168px repeat(7, 1fr)" }}
            >
              {/* Platform label */}
              <div className="flex flex-col justify-center border-r border-[#eaeaea] px-3 py-3">
                <div className="flex items-center gap-2">
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {label}
                  </span>
                </div>
                {platformTotal > 0 && (
                  <span className="mt-0.5 pl-6 text-xs text-muted-foreground">
                    {platformTotal} публ.
                  </span>
                )}
              </div>

              {/* Day cells */}
              {days.map((day) => {
                const cellItems = grid.get(`${id}-${day}`) ?? []
                return (
                  <div
                    key={day}
                    className="min-h-[80px] border-r border-[#eaeaea] p-1.5 last:border-r-0"
                  >
                    {cellItems.length === 0 ? (
                      <div className="flex h-full min-h-[64px] items-center justify-center">
                        <span className="text-xs text-muted-foreground/25">
                          —
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {cellItems.map((item, idx) => {
                          const time = getTime(item)
                          const format = getFormat(item)
                          const status = getStatus(item)
                          return (
                            <div
                              key={idx}
                              className="group rounded-lg border border-[#eaeaea] bg-white p-1.5 shadow-sm"
                            >
                              <div className="mb-0.5 flex items-center justify-between gap-1">
                                <span className="text-[10px] font-medium text-foreground">
                                  {time ?? ""}
                                </span>
                                <span
                                  className={cn(
                                    "size-2 shrink-0 rounded-full",
                                    STATUS_CLS[status] ?? STATUS_CLS.draft
                                  )}
                                />
                              </div>
                              <p className="line-clamp-2 text-[11px] font-medium leading-snug text-foreground">
                                {item.title}
                              </p>
                              <div className="mt-1 flex items-center justify-between gap-1">
                                <span className="inline-block rounded bg-neutral-100 px-1 py-0.5 text-[10px] text-muted-foreground">
                                  {format}
                                </span>
                                <button
                                  onClick={() => onWrite(item)}
                                  className="hidden group-hover:flex items-center gap-0.5 rounded bg-[#111] px-1.5 py-0.5 text-[10px] font-medium text-white"
                                >
                                  <Sparkles className="size-2.5" />
                                  Написать
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MonthGrid({ items, onWrite }: { items: CalendarItem[]; onWrite: (item: CalendarItem) => void }) {
  const byDay = new Map<number, CalendarItem[]>()
  for (const item of items) {
    if (item.day >= 1 && item.day <= 28) {
      const prev = byDay.get(item.day) ?? []
      byDay.set(item.day, [...prev, item])
    }
  }

  const weeks = [1, 2, 3, 4] as const

  const platformColor: Record<PlatformId, string> = {
    instagram: "bg-violet-100 text-violet-700",
    telegram: "bg-blue-100 text-blue-700",
    vk: "bg-sky-100 text-sky-700",
    youtube: "bg-red-100 text-red-700",
    blog: "bg-emerald-100 text-emerald-700",
    email: "bg-orange-100 text-orange-700",
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#eaeaea]">
      {/* Headers */}
      <div className="grid grid-cols-7 border-b border-[#eaeaea] bg-neutral-50">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="border-r border-[#eaeaea] py-2 text-center text-xs font-medium text-muted-foreground last:border-r-0"
          >
            {d}
          </div>
        ))}
      </div>

      {/* 4 weeks */}
      {weeks.map((week) => {
        const startDay = (week - 1) * 7 + 1
        const days = Array.from({ length: 7 }, (_, i) => startDay + i)
        return (
          <div
            key={week}
            className="grid grid-cols-7 border-b border-[#eaeaea] last:border-b-0"
          >
            {days.map((day) => {
              const dayItems = byDay.get(day) ?? []
              return (
                <div
                  key={day}
                  className="min-h-[72px] border-r border-[#eaeaea] p-1.5 last:border-r-0"
                >
                  <span className="mb-1 block text-xs text-muted-foreground">
                    {day}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {dayItems.slice(0, 3).map((item, i) => {
                      const platform = inferPlatform(item)
                      const cls =
                        platformColor[platform] ?? "bg-neutral-100 text-neutral-700"
                      return (
                        <button
                          key={i}
                          title={item.title}
                          onClick={() => onWrite(item)}
                          className={cn(
                            "truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight text-left hover:opacity-80 transition-opacity",
                            cls
                          )}
                        >
                          {getFormat(item)}
                        </button>
                      )
                    })}
                    {dayItems.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{dayItems.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}

      {/* Platform legend */}
      <div className="flex flex-wrap gap-2 border-t border-[#eaeaea] bg-neutral-50 px-3 py-2">
        {PLATFORMS.map(({ id, label }) => (
          <span
            key={id}
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              (platformColor as Record<string, string>)[id]
            )}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
