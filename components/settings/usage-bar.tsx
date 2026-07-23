import type { UsageInfo } from "@/lib/services/usage.service"
import { PLAN_LIMITS } from "@/lib/config/plans"
import { Progress } from "@/components/ui/progress"

interface UsageBarProps {
  usage: UsageInfo
  projectCount: number
  maxProjects: number
}

export function UsageBar({ usage, projectCount, maxProjects }: UsageBarProps) {
  const isUnlimitedProjects = PLAN_LIMITS[usage.planName].maxProjects === Infinity

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Использование плана
      </p>

      {/* Projects */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm text-foreground">Проекты</span>
          <span className="text-xs text-muted-foreground">
            {projectCount} / {isUnlimitedProjects ? "∞" : maxProjects}
          </span>
        </div>
        {!isUnlimitedProjects && <Progress value={projectCount} max={maxProjects} />}
        <p className="mt-1 text-xs text-muted-foreground">
          {isUnlimitedProjects ? "Без ограничений" : `Доступно проектов: ${maxProjects}`}
        </p>
      </div>

      {/* AI Generations */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm text-foreground">AI-генерации</span>
          <span className="text-xs text-muted-foreground">
            {usage.generationsUsed} / {usage.isUnlimited ? "∞" : usage.generationsLimit} в этом месяце
          </span>
        </div>
        {!usage.isUnlimited && <Progress value={usage.generationsUsed} max={usage.generationsLimit} />}
        <p className="mt-1 text-xs text-muted-foreground">
          {usage.isUnlimited ? "Без ограничений" : "Сбрасывается 1-го числа каждого месяца"}
        </p>
      </div>
    </div>
  )
}
