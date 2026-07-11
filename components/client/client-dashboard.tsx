import type { ClientDashboardData } from "@/lib/actions/clientAccess"

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function fmtNumber(value: number): string {
  return value.toLocaleString("ru-RU")
}

interface ClientDashboardProps {
  data: ClientDashboardData
}

export function ClientDashboard({ data }: ClientDashboardProps) {
  const metricRows = data.metrics
    ? [
        { label: "ROI", value: data.metrics.roi, suffix: "%" },
        { label: "CAC", value: data.metrics.cac, suffix: " ₽" },
        { label: "Лиды за месяц", value: data.metrics.leads, suffix: "" },
        { label: "Выручка", value: data.metrics.revenue, suffix: " ₽" },
      ]
    : []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-foreground">
              <span className="text-xs font-bold text-background">AI</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{data.project.name}</p>
              <p className="text-xs text-muted-foreground">Маркетинговый дашборд</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-success" />
            <span className="text-xs text-muted-foreground">
              Обновлено {fmtDate(data.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Контент */}
      <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        {/* Скоркарта */}
        {data.companyAnalysis && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-foreground">
              Общая оценка компании
            </h2>
            <div className="flex items-center gap-6">
              <div className="relative size-24 shrink-0">
                <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="var(--foreground)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - data.companyAnalysis.score / 100)}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-foreground">
                    {data.companyAnalysis.score}
                  </span>
                  <span className="text-xs text-muted-foreground">из 100</span>
                </div>
              </div>
              <div>
                <p className="mb-1 text-lg font-semibold text-foreground">
                  {data.companyAnalysis.level}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {data.companyAnalysis.summary}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Активная стратегия */}
        {data.strategy && data.strategy.kpi.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-foreground">
              Маркетинговая стратегия
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {data.strategy.kpi.slice(0, 4).map((kpi, i) => (
                <div key={i} className="rounded-xl border border-border bg-background p-3">
                  <p className="mb-1 text-xs text-muted-foreground">{kpi.name}</p>
                  <p className="text-base font-semibold text-foreground">{kpi.target}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ключевые метрики */}
        {data.metrics && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-foreground">Ключевые метрики</h2>
            <div className="grid grid-cols-2 gap-3">
              {metricRows.map((m) => (
                <div key={m.label} className="rounded-xl border border-border bg-background p-3">
                  <p className="mb-1 text-xs text-muted-foreground">{m.label}</p>
                  <p className="text-base font-semibold tabular-nums text-foreground">
                    {m.value != null ? `${fmtNumber(m.value)}${m.suffix}` : "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Рекомендации AI */}
        {data.recommendations.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-foreground">Рекомендации AI</h2>
            <div className="space-y-3">
              {data.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="flex gap-3 rounded-xl border border-border bg-background p-3"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{rec.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{rec.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!data.companyAnalysis &&
          !data.strategy &&
          !data.metrics &&
          data.recommendations.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <p className="text-sm text-muted-foreground">
                Данные по проекту пока не готовы. Загляните позже.
              </p>
            </div>
          )}

        {/* Footer */}
        <div className="py-4 text-center">
          <p className="text-xs text-muted-foreground">Подготовлено с помощью AI Marketing OS</p>
        </div>
      </div>
    </div>
  )
}
