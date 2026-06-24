"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Zap, Check, Loader2, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createCheckoutSession, createBillingPortalSession } from "@/lib/actions/billing"
import type { PlanName } from "@/lib/config/plans"

interface PlanCardProps {
  planName: PlanName
}

const PRO_FEATURES = [
  "Неограниченное число проектов",
  "Неограниченные AI-генерации",
  "Все модули: CJM, Контент, Отчёты",
  "AI Директор — ежедневный анализ",
  "Экспорт PDF в Vercel Blob",
  "Приоритетная поддержка",
]

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

  const isPro = planName === "PRO"

  return (
    <div className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Ваш план
        </p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isPro
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-foreground"
          }`}
        >
          {isPro ? "Pro" : "Free"}
        </span>
      </div>

      {isPro ? (
        <div className="space-y-3">
          <p className="text-sm text-foreground">
            Активная подписка Pro. Все функции разблокированы.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManage}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CreditCard className="size-3.5" />
            )}
            Управление подпиской
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <ul className="space-y-2">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                <Check className="size-3.5 shrink-0 text-[#16a34a]" />
                {f}
              </li>
            ))}
          </ul>
          <Button size="sm" onClick={handleUpgrade} disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Zap className="size-3.5" />
            )}
            Перейти на Pro
          </Button>
        </div>
      )}
    </div>
  )
}
