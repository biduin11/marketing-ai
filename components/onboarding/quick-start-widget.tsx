"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Circle, Rocket, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { dismissOnboarding } from "@/lib/actions/user"
import type { QuickStartStep } from "@/lib/services/onboarding.service"

const CONFETTI_COLORS = ["#111111", "#16a34a", "#d97706", "#6b7280", "#dc2626"]

export function QuickStartWidget({ steps }: { steps: QuickStartStep[] }) {
  const doneCount = steps.filter((s) => s.done).length
  const total = steps.length
  const allDone = doneCount === total

  const [expanded, setExpanded] = useState(!allDone)
  const [hidden, setHidden] = useState(false)
  const [celebrating] = useState(allDone)

  useEffect(() => {
    if (!allDone) return
    const timer = setTimeout(() => setHidden(true), 2200)
    return () => clearTimeout(timer)
  }, [allDone])

  async function handleDismiss() {
    setHidden(true)
    await dismissOnboarding()
  }

  if (hidden) return null

  return (
    <div className="fixed bottom-6 right-24 z-40 flex flex-col items-end gap-2">
      {celebrating && <ConfettiBurst />}

      {expanded ? (
        <div className="w-72 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Rocket className="size-4 text-foreground" />
            <span className="text-sm font-semibold text-foreground">Быстрый старт</span>
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {doneCount}/{total}
            </span>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Закрыть"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <div className="divide-y divide-border">
            {steps.map((step) => (
              <Link
                key={step.id}
                href={step.href}
                onClick={() => setExpanded(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-muted transition-colors"
              >
                {step.done ? (
                  <CheckCircle2 className="size-4 shrink-0 text-success" />
                ) : (
                  <Circle className="size-4 shrink-0 text-muted-foreground/40" />
                )}
                <span
                  className={cn(
                    "text-sm",
                    step.done ? "text-muted-foreground line-through" : "text-foreground"
                  )}
                >
                  {step.label}
                </span>
              </Link>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="w-full border-t border-border px-4 py-2 text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Свернуть
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="relative flex size-12 items-center justify-center rounded-full bg-foreground text-background shadow-lg hover:opacity-90"
          aria-label="Быстрый старт"
        >
          <Rocket className="size-5" />
          <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-card text-[10px] font-semibold text-foreground ring-1 ring-border">
            {doneCount}/{total}
          </span>
        </button>
      )}
    </div>
  )
}

function ConfettiBurst() {
  const pieces = Array.from({ length: 18 })
  return (
    <div className="pointer-events-none absolute -top-4 right-4 h-0 w-0">
      {pieces.map((_, i) => {
        const angle = (i / pieces.length) * 360
        const distance = 60 + (i % 4) * 20
        const dx = Math.cos((angle * Math.PI) / 180) * distance
        const dy = Math.sin((angle * Math.PI) / 180) * distance - 40
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
        const style: React.CSSProperties & { "--dx": string; "--dy": string } = {
          backgroundColor: color,
          animation: `quick-start-confetti 900ms ease-out ${i * 15}ms forwards`,
          "--dx": `${dx}px`,
          "--dy": `${dy}px`,
        }
        return <span key={i} className="absolute size-1.5 rounded-sm" style={style} />
      })}
      <style>{`
        @keyframes quick-start-confetti {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0.4); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
