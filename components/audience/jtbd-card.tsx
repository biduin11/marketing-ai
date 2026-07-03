import type { Jtbd } from "@/lib/ai/schemas/audience"

type Job = Jtbd["jobs"][number]

interface JtbdCardProps {
  job: Job
  index: number
}

export function JtbdCard({ job, index }: JtbdCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
          {index + 1}
        </div>
        <h3 className="text-sm font-semibold text-foreground">{job.job}</h3>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">{job.context}</p>

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs text-foreground">
          <span className="font-medium">Функция: </span>
          {job.functional}
        </span>
        <span className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs text-foreground">
          <span className="font-medium">Эмоции: </span>
          {job.emotional}
        </span>
        <span className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs text-foreground">
          <span className="font-medium">Социум: </span>
          {job.social}
        </span>
      </div>

      <div className="rounded-lg bg-muted px-3 py-2">
        <p className="text-xs font-medium text-muted-foreground">Результат</p>
        <p className="mt-0.5 text-sm text-foreground">{job.outcome}</p>
      </div>
    </div>
  )
}
