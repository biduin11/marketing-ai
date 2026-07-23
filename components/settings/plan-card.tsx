"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Zap, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createPayment, checkPaymentStatus } from "@/lib/actions/billing"
import { PLAN_LIMITS, PLAN_LABELS, type PlanName } from "@/lib/config/plans"

interface PlanCardProps {
  planName: PlanName
  planExpiresAt: Date | null
}

const TIER_ORDER: PlanName[] = ["FREE", "PRO", "MAX"]
const PAYABLE_TIERS: PlanName[] = ["PRO", "MAX"]

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
  return price === 0 ? "Бесплатно" : `${price.toLocaleString("ru-RU")} ₽ / 30 дней`
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

export function PlanCard({ planName, planExpiresAt }: PlanCardProps) {
  const [loadingTier, setLoadingTier] = useState<PlanName | null>(null)
  const router = useRouter()

  // planExpiresAt reflects the raw DB value, which can briefly lag behind the
  // effective plan (already downgraded to FREE by getEffectivePlan/gates.ts)
  // until the backup cron runs — only show the renewal banner while the paid
  // period is still genuinely active.
  const renewableTier =
    planName !== "FREE" && planExpiresAt && planExpiresAt > new Date() ? planName : null

  useEffect(() => {
    if (typeof window === "undefined") return
    if (new URLSearchParams(window.location.search).get("payment") !== "success") return

    checkPaymentStatus().then((result) => {
      if (result.success) {
        toast.success(`Тариф ${PLAN_LABELS[result.plan]} активирован на 30 дней`)
        router.refresh()
      } else {
        toast.error("Платёж пока не подтверждён — обновите страницу через минуту")
      }
    })

    router.replace("/settings")
  }, [router])

  async function handlePayment(tier: "PRO" | "MAX") {
    setLoadingTier(tier)
    try {
      const result = await createPayment(tier)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      window.location.href = result.confirmationUrl
    } catch {
      toast.error("Не удалось открыть страницу оплаты")
    } finally {
      setLoadingTier(null)
    }
  }

  function handlePaymentClick(event: React.MouseEvent<HTMLButtonElement>) {
    const tier = event.currentTarget.dataset.tier as "PRO" | "MAX"
    void handlePayment(tier)
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Тариф
      </p>

      {renewableTier && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
          <p className="text-sm text-foreground">
            Активен до {formatDate(planExpiresAt!)}
          </p>
          <Button
            size="sm"
            variant="outline"
            data-tier={renewableTier}
            onClick={handlePaymentClick}
            disabled={loadingTier !== null}
          >
            {loadingTier === renewableTier && <Loader2 className="size-3.5 animate-spin" />}
            Продлить
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {TIER_ORDER.map((tier) => {
          const isCurrent = planName === tier
          const isLoading = loadingTier === tier

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

              {!isCurrent && PAYABLE_TIERS.includes(tier) && (
                <Button
                  size="sm"
                  data-tier={tier}
                  onClick={handlePaymentClick}
                  disabled={loadingTier !== null}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Zap className="size-3.5" />
                  )}
                  Перейти на {PLAN_LABELS[tier]}
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {!renewableTier && (
        <p className="mt-4 text-xs text-muted-foreground">
          Оплата разовая, без автосписаний — тариф действует 30 дней и затем возвращается на Free,
          если не продлить.
        </p>
      )}
    </div>
  )
}
