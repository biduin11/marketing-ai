"use client"

import { useState, useTransition } from "react"
import {
  AlertTriangle,
  Bell,
  BotMessageSquare,
  CheckCheck,
  ChartLine,
  Crosshair,
  FlaskConical,
  LayoutList,
  Sparkles,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { markSignalRead, markAllSignalsRead } from "@/lib/actions/inbox"
import type { InboxSignalRow } from "@/lib/actions/inbox"
import type { SignalType, SignalPriority } from "@prisma/client"
import Link from "next/link"
import { useRouter } from "next/navigation"

const SIGNAL_META: Record<
  SignalType,
  { label: string; icon: React.ElementType; color: string }
> = {
  ANOMALY: { label: "Аномалия", icon: AlertTriangle, color: "text-amber-600 bg-amber-50" },
  MARKET: { label: "Рынок", icon: Crosshair, color: "text-blue-600 bg-blue-50" },
  STRATEGY: { label: "Стратегия", icon: ChartLine, color: "text-violet-600 bg-violet-50" },
  CONTENT: { label: "Контент", icon: LayoutList, color: "text-green-600 bg-green-50" },
  COMPETITOR: { label: "Конкурент", icon: Crosshair, color: "text-red-600 bg-red-50" },
  EXPERIMENT: { label: "Эксперимент", icon: FlaskConical, color: "text-indigo-600 bg-indigo-50" },
  SYSTEM: { label: "Система", icon: Zap, color: "text-gray-600 bg-gray-100" },
}

const PRIORITY_LABEL: Record<SignalPriority, string> = {
  HIGH: "Высокий",
  MEDIUM: "Средний",
  LOW: "Низкий",
}

const PRIORITY_COLOR: Record<SignalPriority, string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-neutral-100 text-neutral-600",
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface InboxViewProps {
  projectId: string | null
  signals: InboxSignalRow[]
}

export function InboxView({ projectId, signals: initialSignals }: InboxViewProps) {
  const router = useRouter()
  const [signals, setSignals] = useState(initialSignals)
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState<"all" | "unread">("unread")

  const unreadCount = signals.filter((s) => !s.read).length
  const visible = filter === "unread" ? signals.filter((s) => !s.read) : signals

  function handleRead(id: string) {
    setSignals((prev) =>
      prev.map((s) => (s.id === id ? { ...s, read: true } : s))
    )
    startTransition(async () => {
      await markSignalRead({ signalId: id })
      router.refresh()
    })
  }

  function handleReadAll() {
    if (!projectId) return
    setSignals((prev) => prev.map((s) => ({ ...s, read: true })))
    startTransition(async () => {
      await markAllSignalsRead(projectId)
      router.refresh()
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Bell className="size-5" />
            Входящие
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            AI-сигналы и рекомендации по проекту
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReadAll}
            disabled={isPending}
            className="gap-1.5"
          >
            <CheckCheck className="size-3.5" />
            Всё прочитано
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-xl border border-[#eaeaea] bg-neutral-50 p-1">
        {(["unread", "all"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              filter === tab
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "unread" ? `Непрочитанные${unreadCount > 0 ? ` (${unreadCount})` : ""}` : "Все"}
          </button>
        ))}
      </div>

      {/* Signals */}
      {!projectId ? (
        <EmptyState text="Выберите активный проект, чтобы видеть сигналы." />
      ) : visible.length === 0 ? (
        <EmptyState
          text={
            filter === "unread"
              ? "Нет непрочитанных сигналов. Хорошая работа!"
              : "Пока нет сигналов. AI начнёт их генерировать после анализа данных проекта."
          }
          icon={<Sparkles className="size-8 text-muted-foreground/40" />}
        />
      ) : (
        <ul className="space-y-2">
          {visible.map((signal) => {
            const meta = SIGNAL_META[signal.type]
            const Icon = meta.icon
            return (
              <li
                key={signal.id}
                className={cn(
                  "rounded-2xl border border-[#eaeaea] bg-white p-4 transition-all",
                  !signal.read && "border-l-4 border-l-[#111]"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-xl",
                      meta.color
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">
                        {signal.title}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                          PRIORITY_COLOR[signal.priority]
                        )}
                      >
                        {PRIORITY_LABEL[signal.priority]}
                      </span>
                      <span className="text-xs text-muted-foreground/60 ml-auto">
                        {formatDate(signal.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {signal.body}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      {signal.actionHref && signal.action && (
                        <Link
                          href={signal.actionHref}
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 text-xs")}
                        >
                          {signal.action}
                        </Link>
                      )}
                      {!signal.read && (
                        <button
                          onClick={() => handleRead(signal.id)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Отметить прочитанным
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* AI note */}
      <div className="flex items-start gap-2 rounded-xl border border-dashed border-[#eaeaea] p-3">
        <BotMessageSquare className="size-4 shrink-0 text-muted-foreground mt-0.5" />
        <p className="text-xs text-muted-foreground">
          AI анализирует ваши данные каждый день в 06:00 и создаёт новые сигналы. Сигналы появляются автоматически при обнаружении аномалий, изменений рынка и возможностей для роста.
        </p>
      </div>
    </div>
  )
}

function EmptyState({ text, icon }: { text: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#eaeaea] py-16 text-center">
      {icon ?? <Bell className="size-8 text-muted-foreground/40" />}
      <p className="text-sm text-muted-foreground max-w-xs">{text}</p>
    </div>
  )
}
