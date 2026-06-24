"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createMetric } from "@/lib/actions/metrics"

interface MetricFormDialogProps {
  projectId: string
}

const CHANNELS = ["Instagram", "Facebook", "Google Ads", "VK", "Telegram", "YouTube", "Email"]

export function MetricFormDialog({ projectId }: MetricFormDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  const [form, setForm] = useState({
    channel: "",
    date: today,
    spend: "",
    revenue: "",
    leads: "",
    clicks: "",
    impressions: "",
  })

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await createMetric({
        projectId,
        channel: form.channel,
        date: form.date,
        spend: parseFloat(form.spend) || 0,
        revenue: parseFloat(form.revenue) || 0,
        leads: parseInt(form.leads) || 0,
        clicks: parseInt(form.clicks) || 0,
        impressions: parseInt(form.impressions) || 0,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success("Метрика сохранена")
      setOpen(false)
      setForm({ channel: "", date: today, spend: "", revenue: "", leads: "", clicks: "", impressions: "" })
      router.refresh()
    } catch {
      toast.error("Не удалось сохранить")
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" />
        Добавить данные
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-base font-semibold text-foreground">Добавить метрики</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="channel" className="mb-1 block text-xs">Канал</Label>
              <Input
                id="channel"
                list="channels-list"
                placeholder="Instagram"
                value={form.channel}
                onChange={(e) => set("channel", e.target.value)}
                required
              />
              <datalist id="channels-list">
                {CHANNELS.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <Label htmlFor="date" className="mb-1 block text-xs">Дата</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="spend" className="mb-1 block text-xs">Расходы (₽)</Label>
              <Input id="spend" type="number" min="0" step="0.01" placeholder="0" value={form.spend} onChange={(e) => set("spend", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="revenue" className="mb-1 block text-xs">Выручка (₽)</Label>
              <Input id="revenue" type="number" min="0" step="0.01" placeholder="0" value={form.revenue} onChange={(e) => set("revenue", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="leads" className="mb-1 block text-xs">Лиды</Label>
              <Input id="leads" type="number" min="0" placeholder="0" value={form.leads} onChange={(e) => set("leads", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="clicks" className="mb-1 block text-xs">Клики</Label>
              <Input id="clicks" type="number" min="0" placeholder="0" value={form.clicks} onChange={(e) => set("clicks", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="impressions" className="mb-1 block text-xs">Показы</Label>
              <Input id="impressions" type="number" min="0" placeholder="0" value={form.impressions} onChange={(e) => set("impressions", e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" size="sm" disabled={loading || !form.channel}>
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Сохранить
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
