import { cn } from "@/lib/utils"

interface ScoreCardProps {
  score: number
  level: string
  className?: string
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-success"
  if (score >= 40) return "text-warning"
  return "text-danger"
}

export function ScoreCard({ score, level, className }: ScoreCardProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const circumference = 2 * Math.PI * 52
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-8",
        className
      )}
    >
      <div className="relative flex size-32 items-center justify-center">
        <svg className="size-32 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="var(--border)"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={scoreColor(clamped)}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-semibold text-foreground">
            {clamped}
          </span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-foreground">{level}</p>
      <p className="text-xs text-muted-foreground">Общая оценка</p>
    </div>
  )
}
