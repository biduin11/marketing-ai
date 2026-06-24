"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Sparkles,
  RefreshCw,
  Loader2,
  LayoutList,
  Hash,
  Mail,
  Video,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { ContentCalendar } from "@/components/content/content-calendar"
import { runContentPlan } from "@/lib/actions/ai"
import type { ContentPlan } from "@/lib/ai/schemas/contentPlan"

interface ContentViewProps {
  projectId: string
  plan: ContentPlan | null
  version: number | null
}

type Tab = "calendar" | "ideas" | "reels" | "email"

const tabs: { id: Tab; label: string }[] = [
  { id: "calendar", label: "Календарь" },
  { id: "ideas", label: "Идеи" },
  { id: "reels", label: "Сценарии Reels" },
  { id: "email", label: "Email-цепочка" },
]

export function ContentView({ projectId, plan, version }: ContentViewProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>("calendar")

  async function generate(force: boolean) {
    setLoading(true)
    try {
      const result = await runContentPlan(projectId, force)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(force ? "Контент-план обновлён" : "Контент-план готов")
      router.refresh()
    } catch {
      toast.error("Не удалось сгенерировать контент-план")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Контент-план</h2>
          <p className="text-sm text-muted-foreground">
            Публикационный календарь, идеи, сценарии Reels и email-цепочка
            {version && <span className="ml-2 text-xs">· версия {version}</span>}
          </p>
        </div>
        {plan ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => generate(true)}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Регенерировать
          </Button>
        ) : (
          <Button size="sm" onClick={() => generate(false)} disabled={loading}>
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            Сгенерировать
          </Button>
        )}
      </div>

      {!plan ? (
        <div className="flex h-[50vh] items-center justify-center">
          <EmptyState
            icon={LayoutList}
            title="Контент-план не создан"
            description="Нажмите «Сгенерировать», чтобы AI составил публикационный календарь, идеи Reels, сценарии и email-цепочку."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{plan.summary}</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 rounded-xl bg-neutral-100 p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={
                  activeTab === t.id
                    ? "flex-1 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-foreground shadow-sm"
                    : "flex-1 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Calendar tab */}
          {activeTab === "calendar" && (
            <ContentCalendar items={plan.calendar} />
          )}

          {/* Ideas tab */}
          {activeTab === "ideas" && (
            <div className="space-y-6">
              {/* Reels ideas */}
              <IdeaSection
                title="Reels"
                count={plan.ideas.reels.length}
                icon={Video}
                color="violet"
              >
                {plan.ideas.reels.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-[#eaeaea] bg-white p-4 shadow-sm"
                  >
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="font-medium text-violet-600">Hook:</span> {item.hook}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <span className="font-medium">Угол:</span> {item.angle}
                    </p>
                  </div>
                ))}
              </IdeaSection>

              {/* Posts ideas */}
              <IdeaSection
                title="Посты"
                count={plan.ideas.posts.length}
                icon={Hash}
                color="blue"
              >
                {plan.ideas.posts.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-[#eaeaea] bg-white p-4 shadow-sm"
                  >
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="font-medium text-blue-600">Формат:</span> {item.format}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <span className="font-medium">Угол:</span> {item.angle}
                    </p>
                  </div>
                ))}
              </IdeaSection>

              {/* Stories ideas */}
              <IdeaSection
                title="Stories"
                count={plan.ideas.stories.length}
                icon={LayoutList}
                color="orange"
              >
                {plan.ideas.stories.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-[#eaeaea] bg-white p-4 shadow-sm"
                  >
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="font-medium text-orange-600">Формат:</span> {item.format}
                    </p>
                  </div>
                ))}
              </IdeaSection>
            </div>
          )}

          {/* Reels Scripts tab */}
          {activeTab === "reels" && (
            <div className="space-y-4">
              {plan.reelsScripts.map((script, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
                      {i + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-foreground">{script.title}</h3>
                  </div>

                  <div className="space-y-3">
                    <ScriptBlock label="Hook (первые 3 сек)" color="violet" text={script.hook} />
                    <ScriptBlock label="Основной контент" color="blue" text={script.body} />
                    <ScriptBlock label="CTA" color="green" text={script.cta} />
                  </div>

                  {script.hashtags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {script.hashtags.map((tag, j) => (
                        <span
                          key={j}
                          className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Email tab */}
          {activeTab === "email" && (
            <div className="relative space-y-0 pl-6">
              {/* Timeline line */}
              <div className="absolute left-2 top-0 h-full w-px bg-[#eaeaea]" />

              {plan.emailSequence.map((email, i) => (
                <div key={i} className="relative pb-5 last:pb-0">
                  {/* Dot */}
                  <span className="absolute -left-4 flex size-4 items-center justify-center rounded-full border-2 border-white bg-neutral-800 text-[9px] font-bold text-white">
                    {email.number}
                  </span>

                  <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{email.subject}</p>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 border border-emerald-200">
                        {email.sendDay}
                      </span>
                    </div>
                    <p className="mb-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Цель:</span> {email.goal}
                    </p>
                    <div className="rounded-lg bg-neutral-50 px-3 py-2">
                      <p className="text-xs text-muted-foreground italic">{email.preview}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function IdeaSection({
  title,
  count,
  icon: Icon,
  color,
  children,
}: {
  title: string
  count: number
  icon: React.ComponentType<{ className?: string }>
  color: "violet" | "blue" | "orange"
  children: React.ReactNode
}) {
  const colorMap = {
    violet: "text-violet-600 bg-violet-50",
    blue: "text-blue-600 bg-blue-50",
    orange: "text-orange-600 bg-orange-50",
  }
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className={`rounded-lg p-1.5 ${colorMap[color]}`}>
          <Icon className="size-4" />
        </span>
        <h3 className="text-sm font-medium text-foreground">
          {title}{" "}
          <span className="text-muted-foreground">({count})</span>
        </h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  )
}

function ScriptBlock({
  label,
  color,
  text,
}: {
  label: string
  color: "violet" | "blue" | "green"
  text: string
}) {
  const border = {
    violet: "border-l-violet-400",
    blue: "border-l-blue-400",
    green: "border-l-green-500",
  }[color]
  return (
    <div className={`border-l-2 pl-3 ${border}`}>
      <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm text-foreground">{text}</p>
    </div>
  )
}
