"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Zap, Check, Loader2, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createCheckoutSession, createBillingPortalSession } from "@/lib/actions/billing"
import { PLAN_LIMITS, PLAN_LABELS, type PlanName } from "@/lib/config/plans"

interface PlanCardProps {
  planName: PlanName
}

const TIER_ORDER: PlanName[] = ["FREE", "PRO", "MAX"]

const TIER_FEATURES: Record<PlanName, string[]> = {
  FREE: ["15 генераций в месяц", "1 проект", "Базовые AI-модули"],
  PRO: [
    "100 генераций в месяц",
    "10 проектов",
    "Анализ конкурентов, рынка и репутации",
    "Все модули: CJM, Контент, Отчёты",
  ],
  MAX: [
    "Безлимитные генерации",
    "Безлимитные проекты",
    "Анализ конкурентов, рынка и репутации",
    "Приоритетная поддержка",
  ],
}

function formatPrice(price: number): string {
  return price === 0 ? "Бесплатно" : `${price.toLocaleString("ru-RU")} ₽/мес`
}

export function PlanCard({ planName }: PlanCardProps) {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const result = await createCheckoutSession()
      if (!result.success) {
        toast.error(result.error)
        return
      }
      window.location.href = result.url
    } catch {
      toast.error("Не удалось открыть страницу оплаты")
    } finally {
      setLoading(false)
    }
  }

  async function handleManage() {
    setLoading(true)
    try {
      const result = await createBillingPortalSession()
      if (!result.success) {
        toast.error(result.error)
        return
      }
      window.location.href = result.url
    } catch {
      toast.error("Не удалось открыть портал управления")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Тариф
        </p>
        {planName !== "FREE" && (
          <Button variant="outline" size="sm" onClick={handleManage} disabled={loading}>
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CreditCard className="size-3.5" />
            )}
            Управление подпиской
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {TIER_ORDER.map((tier) => {
          const isCurrent = planName === tier

          return (
            <div
              key={tier}
              className={`rounded-2xl border p-5 ${
                isCurrent ? "border-foreground bg-foreground text-background" : "border-border"
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-semibold">{PLAN_LABELS[tier]}</p>
                {isCurrent && (
                  <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-foreground">
                    Текущий
                  </span>
                )}
              </div>

              <p className="mb-4 text-xl font-bold">{formatPrice(PLAN_LIMITS[tier].price)}</p>

              <ul className="mb-4 space-y-2">
                {TIER_FEATURES[tier].map((f) => (
                  <li
                    key={f}
                    className={`flex gap-2 text-xs ${
                      isCurrent ? "text-background/80" : "text-muted-foreground"
                    }`}
                  >
                    <Check
                      className={`size-3.5 shrink-0 ${isCurrent ? "text-background" : "text-success"}`}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              {!isCurrent && tier === "PRO" && (
                <Button size="sm" onClick={handleUpgrade} disabled={loading} className="w-full">
                  {loading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Zap className="size-3.5" />
                  )}
                  Перейти на Pro
                </Button>
              )}

              {!isCurrent && tier === "MAX" && (
                <p className="text-xs text-muted-foreground">Подключается вручную — напишите нам</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
