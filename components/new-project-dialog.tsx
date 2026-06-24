"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Loader2 } from "lucide-react"
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
import { createProject } from "@/lib/actions/projects"
import { createProjectSchema } from "@/lib/validations/project"
import { useProjectStore } from "@/lib/store/project-store"

interface NewProjectDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

interface FormErrors {
  name?: string[]
  niche?: string[]
  website?: string[]
  goals?: string[]
}

export function NewProjectDialog({
  open: controlledOpen,
  onOpenChange,
  trigger,
}: NewProjectDialogProps) {
  const router = useRouter()
  const setActiveProjectId = useProjectStore((s) => s.setActiveProjectId)

  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [form, setForm] = useState({
    name: "",
    niche: "",
    website: "",
    goals: "",
  })

  function handleOpenChange(next: boolean) {
    if (isControlled) {
      onOpenChange?.(next)
    } else {
      setInternalOpen(next)
    }
    if (!next) {
      setForm({ name: "", niche: "", website: "", goals: "" })
      setErrors({})
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    const parsed = createProjectSchema.safeParse(form)
    if (!parsed.success) {
      setErrors(
        parsed.error.flatten().fieldErrors as FormErrors
      )
      return
    }

    setLoading(true)
    try {
      const result = await createProject(parsed.data)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(`Проект «${result.data.name}» создан`)
      setActiveProjectId(result.data.id)
      handleOpenChange(false)
      router.refresh()
    } catch {
      toast.error("Что-то пошло не так")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {trigger ? (
        <span onClick={() => handleOpenChange(true)}>{trigger}</span>
      ) : (
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => handleOpenChange(true)}
        >
          <Plus className="size-3.5" />
          Новый проект
        </Button>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="mb-4">
              <DialogTitle>Новый проект</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">
                  Название <span className="text-danger">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Например: Кофейня «Аромат»"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  aria-invalid={!!errors.name}
                  disabled={loading}
                />
                {errors.name?.[0] && (
                  <p className="text-xs text-danger">{errors.name[0]}</p>
                )}
              </div>

              {/* Niche */}
              <div className="space-y-1.5">
                <Label htmlFor="niche">Ниша / отрасль</Label>
                <Input
                  id="niche"
                  placeholder="Например: Фуд, B2C, услуги"
                  value={form.niche}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, niche: e.target.value }))
                  }
                  disabled={loading}
                />
              </div>

              {/* Website */}
              <div className="space-y-1.5">
                <Label htmlFor="website">Сайт</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  value={form.website}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, website: e.target.value }))
                  }
                  aria-invalid={!!errors.website}
                  disabled={loading}
                />
                {errors.website?.[0] && (
                  <p className="text-xs text-danger">{errors.website[0]}</p>
                )}
              </div>

              {/* Goals */}
              <div className="space-y-1.5">
                <Label htmlFor="goals">Цели / задачи</Label>
                <Textarea
                  id="goals"
                  placeholder="Что хотите достичь с помощью маркетинга?"
                  rows={3}
                  value={form.goals}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, goals: e.target.value }))
                  }
                  disabled={loading}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="size-3.5 animate-spin" />}
                Создать проект
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
