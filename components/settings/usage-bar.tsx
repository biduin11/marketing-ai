import type { UsageInfo } from "@/lib/services/usage.service"

interface UsageBarProps {
  usage: UsageInfo
  projectCount: number
  maxProjects: number
}

export function UsageBar({ usage, projectCount, maxProjects }: UsageBarProps) {
  const isProPlan = usage.planName === "PRO"

  return (
    <div className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Использование плана
      </p>

      {/* Projects */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm text-foreground">Проекты</span>
          <span className="text-xs text-muted-foreground">
            {projectCount} / {isProPlan ? "∞" : maxProjects}
          </span>
        </div>
        {!isProPlan && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-[#111] transition-all"
              style={{ width: `${Math.min((projectCount / maxProjects) * 100, 100)}%` }}
            />
          </div>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {isProPlan ? "Без ограничений" : "На Free — 1 проект с безлимитными генерациями"}
        </p>
      </div>

      {/* AI Generations */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm text-foreground">AI-генерации</span>
          <span className="text-xs text-muted-foreground">
            {usage.generationsUsed} в этом месяце
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {isProPlan ? "Без ограничений (Pro)" : "Без ограничений в рамках вашего проекта"}
        </p>
      </div>
    </div>
  )
}
