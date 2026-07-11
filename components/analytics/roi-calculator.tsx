"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"

export interface RoiChannelMetric {
  channel: string
  cpl: number
  conversion: number
}

interface RoiCalculatorProps {
  /** Средний CPL по всем каналам за последние 30 дней */
  avgCpl: number
  /** Конверсия лид → продажа, % (из анкеты проекта) */
  conversionRate: number
  /** Средний чек, ₽ (из анкеты проекта) */
  avgCheck: number
  /** CPL по каждому каналу за последние 30 дней */
  channelMetrics: RoiChannelMetric[]
  /** Есть ли реальные метрики за последние 30 дней */
  hasRealMetrics: boolean
}

function formatRub(value: number): string {
  return `${Math.round(value).toLocaleString("ru-RU")} ₽`
}

export function RoiCalculator({
  avgCpl,
  conversionRate,
  avgCheck,
  channelMetrics,
  hasRealMetrics,
}: RoiCalculatorProps) {
  const [budget, setBudget] = useState<number>(0)
  const [channel, setChannel] = useState<string>("")

  const selectedCpl = useMemo(() => {
    if (!channel) return avgCpl
    return channelMetrics.find((c) => c.channel === channel)?.cpl ?? avgCpl
  }, [channel, channelMetrics, avgCpl])

  const forecast = useMemo(() => {
    if (budget <= 0 || selectedCpl <= 0) return null
    const leads = budget / selectedCpl
    const sales = (leads * conversionRate) / 100
    const revenue = sales * avgCheck
    const roi = ((revenue - budget) / budget) * 100
    return { leads, sales, revenue, roi }
  }, [budget, selectedCpl, conversionRate, avgCheck])

  // Стоимость привлечения продажи (CPA) — сколько в среднем стоит одна продажа
  // при данном CPL и конверсии. Прибыльность не зависит от размера бюджета
  // (выручка растёт линейно), поэтому именно CPA vs. средний чек — это
  // реальная точка безубыточности юнит-экономики, а не «бюджет для выхода в 0».
  const cpa = conversionRate > 0 ? selectedCpl / (conversionRate / 100) : 0
  const isProfitable = cpa > 0 && avgCheck > 0 && cpa < avgCheck

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-1 text-base font-semibold text-foreground">
        Калькулятор окупаемости
      </h3>
      <p className="mb-6 text-xs text-muted-foreground">
        Введите планируемый бюджет — получите прогноз на основе ваших реальных
        метрик
      </p>

      {/* Выбор канала */}
      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Канал продвижения
        </label>
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none"
        >
          <option value="">Все каналы (средние метрики)</option>
          {channelMetrics.map((c) => (
            <option key={c.channel} value={c.channel}>
              {c.channel}
            </option>
          ))}
        </select>
      </div>

      {/* Ввод бюджета */}
      <div className="mb-6">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Планируемый бюджет
        </label>
        <div className="relative">
          <input
            type="number"
            min={0}
            value={budget || ""}
            onChange={(e) => setBudget(Number(e.target.value))}
            placeholder="100 000"
            className="w-full rounded-lg border border-border bg-card px-3 py-2 pr-8 text-sm text-foreground focus:outline-none"
          />
          <span className="absolute right-3 top-2 text-sm text-muted-foreground">
            ₽
          </span>
        </div>
      </div>

      {/* Результаты */}
      {forecast ? (
        <div className="space-y-3">
          {/* Использованные метрики */}
          <div className="mb-4 rounded-xl border border-border bg-muted p-3">
            <p className="mb-2 text-xs text-muted-foreground">
              На основе ваших реальных данных:
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">CPL</p>
                <p className="font-semibold text-foreground">
                  {formatRub(selectedCpl)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Конверсия</p>
                <p className="font-semibold text-foreground">
                  {conversionRate}%
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Средний чек</p>
                <p className="font-semibold text-foreground">
                  {formatRub(avgCheck)}
                </p>
              </div>
            </div>
          </div>

          {/* Прогноз */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border p-3">
              <p className="mb-1 text-xs text-muted-foreground">Прогноз лидов</p>
              <p className="text-lg font-bold tabular-nums text-foreground">
                {Math.round(forecast.leads)} лидов
              </p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="mb-1 text-xs text-muted-foreground">Прогноз продаж</p>
              <p className="text-lg font-bold tabular-nums text-foreground">
                {Math.round(forecast.sales)} продаж
              </p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="mb-1 text-xs text-muted-foreground">Прогноз выручки</p>
              <p className="text-lg font-bold tabular-nums text-success">
                {formatRub(forecast.revenue)}
              </p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="mb-1 text-xs text-muted-foreground">Прогноз ROI</p>
              <p
                className={cn(
                  "text-lg font-bold tabular-nums",
                  forecast.roi >= 0 ? "text-success" : "text-danger"
                )}
              >
                {Math.round(forecast.roi)}%
              </p>
            </div>
          </div>

          {/* Юнит-экономика: CPA vs средний чек */}
          {cpa > 0 && (
            <div className="rounded-xl border border-warning/20 bg-warning/10 p-3">
              <p className="text-xs text-warning">
                💡 Стоимость привлечения продажи (CPA):{" "}
                <span className="font-semibold">{formatRub(cpa)}</span> при
                среднем чеке {formatRub(avgCheck)} —{" "}
                {isProfitable ? "юнит-экономика прибыльна" : "юнит-экономика убыточна"}
              </p>
            </div>
          )}

          {/* Предупреждение если нет реальных данных */}
          {!hasRealMetrics && (
            <div className="rounded-xl border border-border bg-muted p-3">
              <p className="text-xs text-muted-foreground">
                ⚠️ Нет реальных метрик за последние 30 дней. Прогноз основан на
                данных анкеты.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {selectedCpl <= 0
            ? "Нет данных для расчёта CPL по этому каналу"
            : "Введите бюджет чтобы увидеть прогноз"}
        </div>
      )}
    </div>
  )
}
