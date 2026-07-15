import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock3,
  DatabaseZap,
} from "lucide-react"
import { getActiveProjectId } from "@/lib/actions/active-project"
import { prisma } from "@/lib/prisma"
import {
  getAiContextDiagnostics,
  type AiArtifactFreshness,
} from "@/lib/services/ai-context.service"
import { EmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const STATE_VIEW: Record<
  AiArtifactFreshness,
  {
    label: string
    variant: "success" | "warning" | "muted" | "danger"
    icon: typeof CheckCircle2
    description: string
  }
> = {
  current: {
    label: "Актуально",
    variant: "success",
    icon: CheckCircle2,
    description: "Использует текущую анкету и последние связанные анализы.",
  },
  stale: {
    label: "Нужно обновить",
    variant: "warning",
    icon: AlertTriangle,
    description: "После создания изменились исходные данные или связанные анализы.",
  },
  legacy: {
    label: "Старый формат",
    variant: "muted",
    icon: Clock3,
    description: "Анализ существует, но был создан до учёта источников.",
  },
  missing: {
    label: "Не создано",
    variant: "danger",
    icon: CircleDashed,
    description: "В базе пока нет результата этого раздела.",
  },
}

export default async function AiContextPage() {
  const projectId = await getActiveProjectId()
  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={DatabaseZap}
          title="Нет активного проекта"
          description="Выберите проект, чтобы проверить его данные и связи между AI-разделами."
        />
      </div>
    )
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return null
  const diagnostics = await getAiContextDiagnostics(project)
  const currentCount = diagnostics.items.filter((item) => item.state === "current").length

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground">Данные AI</h2>
        <p className="text-sm text-muted-foreground">
          Что заполнено в проекте «{diagnostics.projectName}» и какие источники использует каждый анализ.
        </p>
      </div>

      {diagnostics.databaseEmpty && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-foreground">
          База проекта пока пуста: нет ни AI-анализов, ни маркетинговых метрик. Сначала заполните
          карточку компании и запустите анализ компании.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Карточка проекта</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end justify-between">
              <span className="text-2xl font-semibold">{diagnostics.profileCompleteness}%</span>
              <span className="text-xs text-muted-foreground">заполнено</span>
            </div>
            <Progress value={diagnostics.profileCompleteness} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI-анализы</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{diagnostics.availableArtifacts}</p>
            <p className="text-xs text-muted-foreground">
              {diagnostics.artifactVersions} версий сохранено, {currentCount} актуальных в основной цепочке
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Реальные метрики</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{diagnostics.metricsCount}</p>
            <p className="text-xs text-muted-foreground">записей за последние 90 дней</p>
          </CardContent>
        </Card>
      </div>

      {diagnostics.missingFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Что желательно заполнить</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {diagnostics.missingFields.map((field) => (
              <Badge key={field} variant="outline">{field}</Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Цепочка AI-анализов</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {diagnostics.items.map((item) => {
            const view = STATE_VIEW[item.state]
            const Icon = view.icon
            return (
              <div key={item.type} className="grid gap-3 px-4 py-4 md:grid-cols-[220px_1fr_auto] md:items-center">
                <div className="flex items-center gap-3">
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    {item.version && (
                      <p className="text-xs text-muted-foreground">
                        Версия {item.version}
                        {item.createdAt
                          ? ` · ${new Date(item.createdAt).toLocaleDateString("ru-RU")}`
                          : ""}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{view.description}</p>
                  {item.sourceLabels.length > 0 ? (
                    <p className="text-xs text-foreground">
                      Использует: {item.sourceLabels.join(", ")}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Использует карточку проекта.</p>
                  )}
                  {item.missingSourceLabels.length > 0 && (
                    <p className="text-xs text-warning">
                      Пока отсутствуют: {item.missingSourceLabels.join(", ")}
                    </p>
                  )}
                </div>

                <Badge variant={view.variant}>{view.label}</Badge>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
