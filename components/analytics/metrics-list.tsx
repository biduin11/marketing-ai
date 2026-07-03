"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Pencil, Trash2, Loader2 } from "lucide-react"
import type { Metric } from "@prisma/client"
import { deleteMetric } from "@/lib/actions/metrics"
import { Button } from "@/components/ui/button"

interface MetricsListProps {
  metrics: Metric[]
  onEdit: (metric: Metric) => void
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function fmt(v: number): string {
  return v.toLocaleString("ru-RU")
}

export function MetricsList({ metrics, onEdit }: MetricsListProps) {
  const router = useRouter()
  const [confirmMetric, setConfirmMetric] = useState<Metric | null>(null)
  const [loadingDelete, setLoadingDelete] = useState(false)

  async function handleDelete() {
    if (!confirmMetric) return
    setLoadingDelete(true)
    try {
      const result = await deleteMetric(confirmMetric.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success("Метрика удалена")
      setConfirmMetric(null)
      router.refresh()
    } catch {
      toast.error("Не удалось удалить")
    } finally {
      setLoadingDelete(false)
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-3">
          <p className="text-sm font-semibold text-foreground">Введённые метрики</p>
        </div>

        {metrics.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Метрик пока нет</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Дата</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Канал</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Расходы</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Выручка</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Лиды</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Клики</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Показы</th>
                  <th className="w-20 px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...metrics]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((m) => (
                    <tr key={m.id} className="hover:bg-[#fafafa]">
                      <td className="px-4 py-3 text-sm text-foreground">{formatDate(m.date)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{m.channel}</td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums text-foreground">{fmt(m.spend)} ₽</td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums text-foreground">{fmt(m.revenue)} ₽</td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums text-foreground">{m.leads}</td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums text-foreground">{m.clicks}</td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums text-foreground">{fmt(m.impressions)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEdit(m)}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-[#eaeaea] hover:text-foreground"
                            title="Редактировать"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setConfirmMetric(m)}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-red-500"
                            title="Удалить"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {confirmMetric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="mb-1 text-base font-semibold text-foreground">Удалить запись?</h3>
            <p className="mb-5 text-sm text-muted-foreground">
              Метрика по каналу «{confirmMetric.channel}» за {formatDate(confirmMetric.date)} будет
              удалена безвозвратно.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmMetric(null)}
                disabled={loadingDelete}
              >
                Отмена
              </Button>
              <Button
                size="sm"
                className="bg-danger text-background hover:bg-danger/90"
                onClick={handleDelete}
                disabled={loadingDelete}
              >
                {loadingDelete && <Loader2 className="size-3.5 animate-spin" />}
                Удалить
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
