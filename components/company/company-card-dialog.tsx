"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Pencil } from "lucide-react"
import type { Project } from "@prisma/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateProject } from "@/lib/actions/projects"
import { updateProjectSchema } from "@/lib/validations/project"

interface CompanyCardDialogProps {
  project: Project
}

export function CompanyCardDialog({ project }: CompanyCardDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: project.name,
    niche: project.niche ?? "",
    website: project.website ?? "",
    products: project.products.join(", "),
    competitors: project.competitors.join(", "),
    regions: project.regions.join(", "),
    budget: project.budget?.toString() ?? "",
    goals: project.goals ?? "",
  })

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const parsed = updateProjectSchema.safeParse({
      name: form.name,
      niche: form.niche,
      website: form.website,
      products: form.products,
      competitors: form.competitors,
      regions: form.regions,
      budget: form.budget ? Number(form.budget) : undefined,
      goals: form.goals,
    })

    if (!parsed.success) {
      toast.error("Проверьте корректность полей")
      return
    }

    setLoading(true)
    try {
      const result = await updateProject(project.id, parsed.data)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success("Карточка сохранена")
      setOpen(false)
      router.refresh()
    } catch {
      toast.error("Что-то пошло не так")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="size-3.5" />
        Редактировать карточку
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="mb-4">
              <DialogTitle>Карточка компании</DialogTitle>
            </DialogHeader>

            <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <Label htmlFor="c-name">
                  Название <span className="text-danger">*</span>
                </Label>
                <Input
                  id="c-name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="c-niche">Ниша</Label>
                  <Input
                    id="c-niche"
                    value={form.niche}
                    onChange={(e) => update("niche", e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-budget">Бюджет / мес (USD)</Label>
                  <Input
                    id="c-budget"
                    type="number"
                    min="0"
                    value={form.budget}
                    onChange={(e) => update("budget", e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-website">Сайт</Label>
                <Input
                  id="c-website"
                  type="url"
                  placeholder="https://example.com"
                  value={form.website}
                  onChange={(e) => update("website", e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-products">
                  Продукты / услуги{" "}
                  <span className="text-xs text-muted-foreground">
                    (через запятую)
                  </span>
                </Label>
                <Textarea
                  id="c-products"
                  rows={2}
                  value={form.products}
                  onChange={(e) => update("products", e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-competitors">
                  Конкуренты{" "}
                  <span className="text-xs text-muted-foreground">
                    (через запятую)
                  </span>
                </Label>
                <Textarea
                  id="c-competitors"
                  rows={2}
                  value={form.competitors}
                  onChange={(e) => update("competitors", e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-regions">
                  Регионы{" "}
                  <span className="text-xs text-muted-foreground">
                    (через запятую)
                  </span>
                </Label>
                <Input
                  id="c-regions"
                  value={form.regions}
                  onChange={(e) => update("regions", e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-goals">Цели и задачи</Label>
                <Textarea
                  id="c-goals"
                  rows={3}
                  value={form.goals}
                  onChange={(e) => update("goals", e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="size-3.5 animate-spin" />}
                Сохранить
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
