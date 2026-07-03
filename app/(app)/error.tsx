"use client"

import { AlertTriangle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center">
      <div className="flex max-w-sm flex-col items-center rounded-2xl border border-dashed border-border bg-card p-12 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-danger/10">
          <AlertTriangle className="size-6 text-danger" />
        </div>
        <h3 className="text-sm font-medium text-foreground">
          Не удалось загрузить раздел
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Что-то пошло не так при загрузке данных. Ваши данные не потеряны —
          попробуйте обновить.
        </p>
        <Button variant="outline" size="sm" onClick={reset} className="mt-6">
          <RotateCcw className="size-3.5" />
          Попробовать снова
        </Button>
      </div>
    </div>
  )
}
