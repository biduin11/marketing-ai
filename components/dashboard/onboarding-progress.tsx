"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, CheckCircle2, Circle, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

export interface OnboardingStep {
  id: string
  label: string
  description: string
  href: string
  done: boolean
}

interface OnboardingProgressProps {
  steps: OnboardingStep[]
}

export function OnboardingProgress({ steps }: OnboardingProgressProps) {
  const [expanded, setExpanded] = useState(true)
  const doneCount = steps.filter((s) => s.done).length
  const total = steps.length
  const allDone = doneCount === total
  const percent = Math.round((doneCount / total) * 100)

  // Find next undone step
  const nextStep = steps.find((s) => !s.done)

  if (allDone) return null

  return (
    <div className="rounded-2xl border border-[#eaeaea] bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <button
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              Настройка проекта
            </span>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-muted-foreground">
              {doneCount}/{total}
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-[#111] transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {/* Steps */}
      {expanded && (
        <div className="border-t border-[#eaeaea] px-5 py-3 space-y-1">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                !step.done && step.id === nextStep?.id
                  ? "bg-neutral-50"
                  : "hover:bg-neutral-50/50"
              )}
            >
              {step.done ? (
                <CheckCircle2 className="size-4 shrink-0 text-green-600" />
              ) : (
                <Circle className="size-4 shrink-0 text-muted-foreground/40" />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium",
                    step.done ? "text-muted-foreground line-through" : "text-foreground"
                  )}
                >
                  {step.label}
                </p>
                {!step.done && (
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                )}
              </div>
              {!step.done && (
                <Link
                  href={step.href}
                  className="flex items-center gap-1 rounded-lg border border-[#eaeaea] bg-white px-2.5 py-1 text-xs font-medium text-foreground hover:bg-neutral-50 transition-colors shrink-0"
                >
                  {step.id === nextStep?.id ? "Начать" : "Открыть"}
                  <ArrowRight className="size-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
