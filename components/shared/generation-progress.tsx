"use client"

import { useEffect, useRef, useState } from "react"
import { CheckCircle, Circle, Loader, XCircle } from "lucide-react"

export type StepStatus = "pending" | "active" | "done" | "error"

export interface ProgressStep {
  id: string
  label: string
}

interface StepState {
  status: StepStatus
}

interface GenerationProgressProps {
  steps: ProgressStep[]
  /** ms to spend on each step before auto-advancing (default 1800) */
  stepDuration?: number
  /** When true, marks the last active step as done and shows success */
  completed?: boolean
  /** When set, marks the last active step as error */
  error?: string | null
}

export function GenerationProgress({
  steps,
  stepDuration = 1800,
  completed = false,
  error = null,
}: GenerationProgressProps) {
  const [states, setStates] = useState<StepState[]>(
    steps.map((_, i) => ({ status: i === 0 ? "active" : "pending" }))
  )
  const currentRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-advance through steps until second-to-last (hold there until resolved)
  useEffect(() => {
    const advance = () => {
      const next = currentRef.current + 1
      if (next >= steps.length - 1) return // Hold on last step

      setStates((prev) =>
        prev.map((s, i) => {
          if (i === currentRef.current) return { status: "done" }
          if (i === next) return { status: "active" }
          return s
        })
      )
      currentRef.current = next
      timerRef.current = setTimeout(advance, stepDuration)
    }

    timerRef.current = setTimeout(advance, stepDuration)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When completed or error, resolve final step
  useEffect(() => {
    if (!completed && !error) return
    if (timerRef.current) clearTimeout(timerRef.current)

    setStates((prev) =>
      prev.map((s, i) => {
        if (i < steps.length - 1 && s.status !== "done") return { status: "done" }
        if (i === steps.length - 1) return { status: error ? "error" : "done" }
        return s
      })
    )
  }, [completed, error, steps.length])

  return (
    <div className="space-y-2.5 rounded-2xl border border-border bg-card p-5 shadow-sm">
      {steps.map((step, i) => {
        const { status } = states[i] ?? { status: "pending" }
        return (
          <div key={step.id} className="flex items-center gap-3">
            <StepIcon status={status} />
            <span
              className={
                status === "active"
                  ? "text-sm font-medium text-foreground"
                  : status === "done"
                    ? "text-sm text-muted-foreground line-through"
                    : status === "error"
                      ? "text-sm font-medium text-danger"
                      : "text-sm text-muted-foreground"
              }
            >
              {step.label}
            </span>
          </div>
        )
      })}
      {error && (
        <p className="mt-1 text-xs text-danger">{error}</p>
      )}
    </div>
  )
}

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "done")
    return <CheckCircle className="size-4 shrink-0 text-success" />
  if (status === "active")
    return <Loader className="size-4 shrink-0 animate-spin text-foreground" />
  if (status === "error")
    return <XCircle className="size-4 shrink-0 text-danger" />
  return <Circle className="size-4 shrink-0 text-neutral-300" />
}
