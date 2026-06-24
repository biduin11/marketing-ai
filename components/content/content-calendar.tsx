"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { ContentPlan, ContentType, ContentCategory } from "@/lib/ai/schemas/contentPlan"

type CalendarItem = ContentPlan["calendar"][number]

interface ContentCalendarProps {
  items: CalendarItem[]
}

const typeConfig: Record<ContentType, { label: string; cls: string }> = {
  reels: { label: "Reels", cls: "bg-violet-100 text-violet-700" },
  post: { label: "Пост", cls: "bg-blue-100 text-blue-700" },
  stories: { label: "Stories", cls: "bg-orange-100 text-orange-700" },
  email: { label: "Email", cls: "bg-emerald-100 text-emerald-700" },
}

const categoryBorder: Record<ContentCategory, string> = {
  educational: "border-l-blue-500",
  engagement: "border-l-orange-500",
  sales: "border-l-green-500",
}

const categoryLabel: Record<ContentCategory, string> = {
  educational: "Образов.",
  engagement: "Вовлеч.",
  sales: "Продажи",
}

const DAYS_PER_WEEK = 7
const WEEKS = [1, 2, 3, 4] as const
type Week = (typeof WEEKS)[number]

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]

export function ContentCalendar({ items }: ContentCalendarProps) {
  const [view, setView] = useState<"month" | "week">("month")
  const [selectedWeek, setSelectedWeek] = useState<Week>(1)

  const byDay = new Map<number, CalendarItem[]>()
  for (const item of items) {
    const d = item.day
    if (d >= 1 && d <= 28) {
      const existing = byDay.get(d) ?? []
      byDay.set(d, [...existing, item])
    }
  }

  const weekItems = items.filter((i) => i.week === selectedWeek)

  return (
    <div className="space-y-4">
      {/* View switcher */}
      <div className="flex items-center gap-2">
        {(["month", "week"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              view === v
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-muted-foreground hover:bg-neutral-200"
            )}
          >
            {v === "month" ? "Месяц" : "Неделя"}
          </button>
        ))}

        {view === "week" && (
          <div className="ml-2 flex gap-1">
            {WEEKS.map((w) => (
              <button
                key={w}
                onClick={() => setSelectedWeek(w)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  selectedWeek === w
                    ? "bg-neutral-800 text-white"
                    : "bg-neutral-100 text-muted-foreground hover:bg-neutral-200"
                )}
              >
                {w}
              </button>
            ))}
          </div>
        )}
      </div>

      {view === "month" ? (
        <MonthView byDay={byDay} />
      ) : (
        <WeekView items={weekItems} week={selectedWeek} />
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-1">
        {(Object.entries(typeConfig) as [ContentType, { label: string; cls: string }][]).map(
          ([type, cfg]) => (
            <span key={type} className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", cfg.cls)}>
              {cfg.label}
            </span>
          )
        )}
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="inline-block h-3 w-1 rounded-sm bg-blue-500" />
          Образов.
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="inline-block h-3 w-1 rounded-sm bg-orange-500" />
          Вовлеч.
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="inline-block h-3 w-1 rounded-sm bg-green-500" />
          Продажи
        </span>
      </div>
    </div>
  )
}

function MonthView({ byDay }: { byDay: Map<number, CalendarItem[]> }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#eaeaea]">
      {/* Day name headers */}
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

      {/* 4 weeks × 7 days */}
      {WEEKS.map((week) => {
        const startDay = (week - 1) * DAYS_PER_WEEK + 1
        const days = Array.from({ length: DAYS_PER_WEEK }, (_, i) => startDay + i)
        return (
          <div key={week} className="grid grid-cols-7 border-b border-[#eaeaea] last:border-b-0">
            {days.map((day) => {
              const dayItems = byDay.get(day) ?? []
              return (
                <div
                  key={day}
                  className="min-h-[72px] border-r border-[#eaeaea] p-1.5 last:border-r-0"
                >
                  <span className="mb-1 block text-xs text-muted-foreground">{day}</span>
                  <div className="flex flex-col gap-0.5">
                    {dayItems.map((item, i) => {
                      const t = typeConfig[item.type]
                      return (
                        <span
                          key={i}
                          title={item.title}
                          className={cn(
                            "truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight",
                            t.cls
                          )}
                        >
                          {t.label}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

function WeekView({ items, week }: { items: CalendarItem[]; week: Week }) {
  const startDay = (week - 1) * DAYS_PER_WEEK + 1
  const days = Array.from({ length: DAYS_PER_WEEK }, (_, i) => startDay + i)

  const byDay = new Map<number, CalendarItem[]>()
  for (const item of items) {
    const existing = byDay.get(item.day) ?? []
    byDay.set(item.day, [...existing, item])
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day, i) => {
        const dayItems = byDay.get(day) ?? []
        return (
          <div key={day} className="min-h-[120px]">
            <div className="mb-2 text-center">
              <p className="text-xs text-muted-foreground">{DAY_NAMES[i]}</p>
              <p className="text-sm font-semibold text-foreground">{day}</p>
            </div>
            <div className="space-y-1.5">
              {dayItems.length === 0 ? (
                <div className="flex h-10 items-center justify-center rounded-lg border border-dashed border-[#eaeaea]">
                  <span className="text-[10px] text-muted-foreground/50">—</span>
                </div>
              ) : (
                dayItems.map((item, idx) => {
                  const t = typeConfig[item.type]
                  const border = categoryBorder[item.category]
                  const catLabel = categoryLabel[item.category]
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "rounded-lg border-l-2 bg-white p-2 shadow-sm border border-[#eaeaea]",
                        border
                      )}
                    >
                      <span className={cn("mb-1 rounded px-1 py-0.5 text-[10px] font-medium", t.cls)}>
                        {t.label}
                      </span>
                      <p className="mt-1 line-clamp-2 text-[11px] font-medium text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{catLabel}</p>
                      {item.hook && (
                        <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground italic">
                          {item.hook}
                        </p>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
