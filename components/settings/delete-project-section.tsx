"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { deleteProject } from "@/lib/actions/projects"
import { setActiveProject } from "@/lib/actions/active-project"
import { useProjectStore } from "@/lib/store/project-store"

interface DeleteProjectSectionProps {
  projectId: string
  projectName: string
  isSingleProject: boolean
}

export function DeleteProjectSection({
  projectId,
  projectName,
  isSingleProject,
}: DeleteProjectSectionProps) {
  const router = useRouter()
  const { setActiveProjectId } = useProjectStore()
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProject(projectId)
      if (!result.success) {
        toast.error(result.error)
        setOpen(false)
        return
      }
      const { nextProjectId } = result.data
      if (nextProjectId) {
        setActiveProjectId(nextProjectId)
        await setActiveProject(nextProjectId)
      }
      toast.success("Проект удалён")
      setOpen(false)
      router.push("/")
    })
  }

  return (
    <div className="rounded-2xl border border-danger/20 bg-card p-6">
      <h3 className="mb-1 text-sm font-semibold text-danger">Опасная зона</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Удаление проекта необратимо. Все AI-анализы, стратегии и данные будут уничтожены.
      </p>

      <div
        title={
          isSingleProject
            ? "Создайте новый проект перед удалением этого"
            : undefined
        }
        className="inline-block"
      >
        <Button
          variant="destructive"
          size="sm"
          disabled={isSingleProject}
          onClick={() => setOpen(true)}
          className="gap-2"
        >
          <Trash2 className="size-4" />
          Удалить проект «{projectName}»
        </Button>
      </div>

      {isSingleProject && (
        <p className="mt-2 text-xs text-muted-foreground">
          Создайте новый проект перед удалением этого.
        </p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Удалить проект?</DialogTitle>
            <DialogDescription className="pt-1">
              Это действие нельзя отменить. Все данные проекта, AI-анализы и стратегии
              будут удалены безвозвратно.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
