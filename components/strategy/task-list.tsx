"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Calendar } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { toggleStrategyTask } from "@/lib/actions/strategy-tasks"
import { cn } from "@/lib/utils"

export interface TaskItem {
  taskKey: string
  task: string
  dueDate: string
  done: boolean
}

interface TaskListProps {
  artifactId: string
  tasks: TaskItem[]
}

export function TaskList({ artifactId, tasks }: TaskListProps) {
  const [state, setState] = useState<Record<string, boolean>>(
    Object.fromEntries(tasks.map((t) => [t.taskKey, t.done]))
  )
  const [, startTransition] = useTransition()

  function toggle(taskKey: string) {
    const next = !state[taskKey]
    setState((s) => ({ ...s, [taskKey]: next })) // optimistic
    startTransition(async () => {
      const result = await toggleStrategyTask({ artifactId, taskKey, done: next })
      if (!result.success) {
        setState((s) => ({ ...s, [taskKey]: !next })) // rollback
        toast.error(result.error)
      }
    })
  }

  if (tasks.length === 0)
    return <p className="text-sm text-muted-foreground">Нет задач</p>

  return (
    <ul className="divide-y divide-border">
      {tasks.map((t) => {
        const checked = state[t.taskKey] ?? false
        return (
          <li key={t.taskKey} className="flex items-start gap-3 py-3">
            <Checkbox
              checked={checked}
              onCheckedChange={() => toggle(t.taskKey)}
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm",
                  checked
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                )}
              >
                {t.task}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="size-3" />
                {t.dueDate}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
