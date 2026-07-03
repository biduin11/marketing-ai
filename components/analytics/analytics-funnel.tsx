import type { FunnelStep } from "@/lib/services/analytics.service"

interface AnalyticsFunnelProps {
  steps: FunnelStep[]
  conversionRate: string
  avgCheck: string
}

function fmtVal(v: number, isCurrency?: boolean): string {
  if (isCurrency) {
    return `${v.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽`
  }
  return v.toLocaleString("ru-RU")
}

export function AnalyticsFunnel({
  steps,
  conversionRate,
  avgCheck,
}: AnalyticsFunnelProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-medium text-foreground">
        Воронка продаж по всем каналам
      </h3>

      {/* Steps */}
      <div className="overflow-x-auto">
        <div className="flex min-w-max items-stretch gap-0">
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1
            return (
              <div key={step.label} className="flex items-stretch">
                {/* Step card */}
                <div className="flex min-w-[110px] flex-col items-center rounded-lg border border-border bg-muted px-3 py-3 text-center">
                  <p className="text-[11px] text-muted-foreground">{step.label}</p>
                  <p className="mt-1 text-base font-semibold text-foreground">
                    {fmtVal(step.value, step.isCurrency)}
                  </p>
                  {step.rate && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {step.isCurrency ? `ср. чек ${step.rate}` : step.rate}
                    </p>
                  )}
                </div>

                {/* Arrow connector */}
                {!isLast && (
                  <div className="flex items-center">
                    <svg
                      width="28"
                      height="32"
                      viewBox="0 0 28 32"
                      fill="none"
                      className="shrink-0"
                    >
                      <path
                        d="M0 16 L18 16 M14 10 L20 16 L14 22"
                        stroke="#d1d5db"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">
          Конверсия в продажи:{" "}
          <span className="font-medium text-foreground">{conversionRate}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Средний чек:{" "}
          <span className="font-medium text-foreground">{avgCheck}</span>
        </p>
      </div>
    </div>
  )
}
