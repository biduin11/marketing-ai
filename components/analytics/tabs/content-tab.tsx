"use client"

import { useMemo, useState } from "react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { LayoutList, Camera, Send, Users, PlayCircle, FileText, Mail } from "lucide-react"
import type { ContentPlan } from "@/lib/ai/schemas/contentPlan"
import { EmptyState } from "@/components/empty-state"
import { cn } from "@/lib/utils"

interface ContentTabProps {
  contentPlan: ContentPlan | null
}

const PLATFORM_META: Record<string, { label: string; color: string; Icon: React.ComponentType<{ className?: string }> }> = {
  instagram: { label: "Instagram", color: "#e1306c", Icon: Camera },
  telegram: { label: "Telegram", color: "#0088cc", Icon: Send },
  vk: { label: "VK", color: "#0077ff", Icon: Users },
  youtube: { label: "YouTube", color: "#ff0000", Icon: PlayCircle },
  blog: { label: "Блог / SEO", color: "#16a34a", Icon: FileText },
  email: { label: "Email", color: "#f59e0b", Icon: Mail },
}

const CATEGORY_CFG = {
  educational: { label: "Образовательный", color: "#3b82f6", target: 70 },
  engagement: { label: "Вовлечение", color: "#f59e0b", target: 20 },
  sales: { label: "Продающий", color: "#16a34a", target: 10 },
} as const

const TYPE_CFG = {
  reels: { label: "Reels", color: "#8b5cf6" },
  post: { label: "Пост", color: "#3b82f6" },
  stories: { label: "Сторис", color: "#f97316" },
  email: { label: "Email", color: "#10b981" },
} as const

function inferPlatform(item: ContentPlan["calendar"][number]): string {
  const p = (item as { platform?: string }).platform
  if (p) return p
  if (item.type === "email") return "email"
  if (item.type === "reels" || item.type === "stories") return "instagram"
  return "instagram"
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-[#eaeaea] bg-white p-4 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

export function ContentTab({ contentPlan }: ContentTabProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)

  const stats = useMemo(() => {
    if (!contentPlan) return null
    const cal = contentPlan.calendar
    const total = cal.length

    // Platform counts
    const byPlatform: Record<string, number> = {}
    for (const item of cal) {
      const p = inferPlatform(item)
      byPlatform[p] = (byPlatform[p] ?? 0) + 1
    }

    // Category counts
    const byCategory: Record<string, number> = {}
    for (const item of cal) {
      byCategory[item.category] = (byCategory[item.category] ?? 0) + 1
    }

    // Type counts
    const byType: Record<string, number> = {}
    for (const item of cal) {
      byType[item.type] = (byType[item.type] ?? 0) + 1
    }

    // Published / draft counts
    const published = cal.filter((i) => (i as { status?: string }).status === "published").length
    const ready = cal.filter((i) => (i as { status?: string }).status === "ready").length
    const review = cal.filter((i) => (i as { status?: string }).status === "review").length
    const drafts = total - published - ready - review

    return { total, byPlatform, byCategory, byType, published, ready, review, drafts }
  }, [contentPlan])

  if (!contentPlan || !stats) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <EmptyState
          icon={LayoutList}
          title="Контент-план не создан"
          description="Перейдите в «Контент-план» и нажмите «Создать контент-план» — AI сгенерирует контент-стратегию."
        />
      </div>
    )
  }

  const platformData = Object.entries(stats.byPlatform).map(([id, count]) => ({
    id,
    label: PLATFORM_META[id]?.label ?? id,
    color: PLATFORM_META[id]?.color ?? "#6b7280",
    count,
    pct: ((count / stats.total) * 100).toFixed(1),
  })).sort((a, b) => b.count - a.count)

  const filteredItems = selectedPlatform
    ? contentPlan.calendar.filter((i) => inferPlatform(i) === selectedPlatform)
    : contentPlan.calendar

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <StatCard label="Всего публикаций" value={stats.total} sub="в плане" />
        <StatCard label="Платформ" value={Object.keys(stats.byPlatform).length} />
        <StatCard label="Черновики" value={stats.drafts} sub="на создание" />
        <StatCard label="Подготовлено" value={stats.ready} />
        <StatCard label="На согласовании" value={stats.review} />
        <StatCard label="Опубликовано" value={stats.published} />
      </div>

      {/* Platform + Categories */}
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        {/* Platform donut */}
        <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-medium text-foreground">Распределение по площадкам</p>
          <div className="flex items-center gap-5">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={platformData} cx="50%" cy="50%" innerRadius={32} outerRadius={55} dataKey="count" strokeWidth={0}>
                  {platformData.map((d, i) => (
                    <Cell key={i} fill={d.color} opacity={!selectedPlatform || selectedPlatform === d.id ? 1 : 0.3} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: unknown) => [`${v} публ.`]} contentStyle={{ border: "1px solid #eaeaea", borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {platformData.map((d) => {
                const Meta = PLATFORM_META[d.id]
                const Icon = Meta?.Icon
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedPlatform(selectedPlatform === d.id ? null : d.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left transition-colors",
                      selectedPlatform === d.id ? "bg-neutral-100" : "hover:bg-neutral-50"
                    )}
                  >
                    {Icon && <span style={{ color: d.color }} className="shrink-0 flex"><Icon className="size-3.5" /></span>}
                    <span className="flex-1 text-xs text-foreground">{d.label}</span>
                    <span className="text-xs font-medium text-foreground">{d.count}</span>
                    <span className="w-8 text-right text-xs text-muted-foreground">{d.pct}%</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Category split */}
        <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-medium text-foreground">Рубрики: сплит 70/20/10</p>
          <div className="space-y-4">
            {(Object.entries(CATEGORY_CFG) as [keyof typeof CATEGORY_CFG, typeof CATEGORY_CFG[keyof typeof CATEGORY_CFG]][]).map(([key, cfg]) => {
              const count = stats.byCategory[key] ?? 0
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
              const ok = Math.abs(pct - cfg.target) <= 5
              return (
                <div key={key}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                      <span className="text-sm text-foreground">{cfg.label}</span>
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", ok ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700")}>
                        цель {cfg.target}%
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-foreground">{count}</span>
                      <span className="ml-1.5 text-xs text-muted-foreground">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cfg.color }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Content type chips */}
          <div className="mt-5 flex flex-wrap gap-2 border-t border-[#eaeaea] pt-4">
            {(Object.entries(TYPE_CFG) as [keyof typeof TYPE_CFG, typeof TYPE_CFG[keyof typeof TYPE_CFG]][]).map(([key, cfg]) => {
              const count = stats.byType[key] ?? 0
              if (!count) return null
              return (
                <span key={key} className="flex items-center gap-1.5 rounded-lg border border-[#eaeaea] bg-neutral-50 px-2.5 py-1.5 text-xs font-medium">
                  <span className="size-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                  {cfg.label}
                  <span className="text-muted-foreground">({count})</span>
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* Calendar items list */}
      <div className="rounded-2xl border border-[#eaeaea] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#eaeaea] px-5 py-3">
          <p className="text-sm font-medium text-foreground">
            Публикации{selectedPlatform ? ` · ${PLATFORM_META[selectedPlatform]?.label ?? selectedPlatform}` : ""}
            <span className="ml-2 text-xs text-muted-foreground">({filteredItems.length})</span>
          </p>
          {selectedPlatform && (
            <button onClick={() => setSelectedPlatform(null)} className="text-xs text-muted-foreground hover:text-foreground">
              Все площадки
            </button>
          )}
        </div>
        <div className="divide-y divide-[#eaeaea]">
          {filteredItems.slice(0, 15).map((item, i) => {
            const platform = inferPlatform(item)
            const meta = PLATFORM_META[platform]
            const format = (item as { format?: string }).format ?? (item.type === "reels" ? "Reels" : item.type === "stories" ? "Сторис" : item.type === "email" ? "Email" : "Пост")
            return (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg text-white text-xs" style={{ backgroundColor: meta?.color ?? "#6b7280" }}>
                  {item.week}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{meta?.label ?? platform} · {format}</p>
                </div>
                <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", CATEGORY_CFG[item.category]?.color ? "" : "bg-neutral-100 text-muted-foreground")}
                  style={{ backgroundColor: `${CATEGORY_CFG[item.category]?.color ?? "#6b7280"}15`, color: CATEGORY_CFG[item.category]?.color ?? "#6b7280" }}>
                  {CATEGORY_CFG[item.category]?.label ?? item.category}
                </span>
              </div>
            )
          })}
          {filteredItems.length > 15 && (
            <div className="px-5 py-3 text-center text-xs text-muted-foreground">
              ещё {filteredItems.length - 15} публикаций
            </div>
          )}
        </div>
      </div>

      {/* Ideas bank summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm font-medium text-foreground">Идеи Reels <span className="text-muted-foreground">({contentPlan.ideas.reels.length})</span></p>
          <ul className="space-y-1.5">
            {contentPlan.ideas.reels.slice(0, 5).map((r, i) => (
              <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-violet-400" />
                <span className="line-clamp-1">{r.title}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm font-medium text-foreground">Идеи постов <span className="text-muted-foreground">({contentPlan.ideas.posts.length})</span></p>
          <ul className="space-y-1.5">
            {contentPlan.ideas.posts.slice(0, 5).map((p, i) => (
              <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-blue-400" />
                <span className="line-clamp-1">{p.title}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm font-medium text-foreground">Идеи Stories <span className="text-muted-foreground">({contentPlan.ideas.stories.length})</span></p>
          <ul className="space-y-1.5">
            {contentPlan.ideas.stories.slice(0, 5).map((s, i) => (
              <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-orange-400" />
                <span className="line-clamp-1">{s.title}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
