"use client"

import { useState, useCallback } from "react"

type ActionResult = { success: true } | { success: false; error: string }

export interface UseGenerationReturn {
  running: boolean
  completed: boolean
  error: string | null
  trigger: (...args: never[]) => Promise<ActionResult>
  reset: () => void
}

export function useGeneration(
  action: (...args: never[]) => Promise<ActionResult>
): UseGenerationReturn {
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trigger = useCallback(
    async (...args: never[]): Promise<ActionResult> => {
      setRunning(true)
      setCompleted(false)
      setError(null)
      try {
        const result = await action(...args)
        if (result.success) {
          setCompleted(true)
        } else {
          setError(result.error)
        }
        return result
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Неизвестная ошибка"
        setError(msg)
        return { success: false, error: msg }
      } finally {
        setRunning(false)
      }
    },
    [action]
  )

  const reset = useCallback(() => {
    setRunning(false)
    setCompleted(false)
    setError(null)
  }, [])

  return { running, completed, error, trigger, reset }
}
