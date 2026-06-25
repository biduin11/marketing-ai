"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ChevronsUpDown, FolderOpen, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useProjectStore } from "@/lib/store/project-store"
import { setActiveProject } from "@/lib/actions/active-project"
import { deleteProject } from "@/lib/actions/projects"
import { cn } from "@/lib/utils"

export interface ProjectListItem {
  id: string
  name: string
  niche: string | null
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED"
}

interface ProjectSwitcherProps {
  projects: ProjectListItem[]
  onNewProject?: () => void
}

export function ProjectSwitcher({
  projects,
  onNewProject,
}: ProjectSwitcherProps) {
  const { activeProjectId, setActiveProjectId } = useProjectStore()
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const activeProject = projects.find((p) => p.id === activeProjectId)
  const isSingleProject = projects.length <= 1

  function handleSelect(id: string) {
    setActiveProjectId(id)
    startTransition(async () => {
      await setActiveProject(id)
      router.refresh()
    })
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    const targetId = deleteTarget.id
    startTransition(async () => {
      const result = await deleteProject(targetId)
      if (!result.success) {
        toast.error(result.error)
        setDeleteTarget(null)
        return
      }
      const { nextProjectId } = result.data
      if (nextProjectId) {
        setActiveProjectId(nextProjectId)
        await setActiveProject(nextProjectId)
      }
      toast.success("Проект удалён")
      setDeleteTarget(null)
      router.push("/dashboard")
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex h-8 max-w-[200px] items-center gap-1.5 rounded-lg border border-input",
            "bg-transparent px-2.5 text-sm whitespace-nowrap transition-colors",
            "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "hover:bg-muted"
          )}
        >
          <FolderOpen className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-foreground">
            {activeProject?.name ?? "Выберите проект"}
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-64">
          {projects.length > 0 && (
            <>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Проекты</DropdownMenuLabel>
                {projects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => handleSelect(project.id)}
                    className={cn(
                      "group pr-1",
                      activeProjectId === project.id &&
                        "bg-accent text-accent-foreground"
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{project.name}</span>
                    <button
                      type="button"
                      title={
                        isSingleProject
                          ? "Создайте новый проект перед удалением этого"
                          : `Удалить «${project.name}»`
                      }
                      disabled={isSingleProject}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!isSingleProject) {
                          setDeleteTarget({ id: project.id, name: project.name })
                        }
                      }}
                      className={cn(
                        "ml-2 shrink-0 rounded p-1 transition-colors",
                        isSingleProject
                          ? "cursor-not-allowed text-[#d1d5db]"
                          : "text-[#d1d5db] hover:bg-red-50 hover:text-[#dc2626]"
                      )}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              {onNewProject && <DropdownMenuSeparator />}
            </>
          )}
          {onNewProject && (
            <DropdownMenuItem onClick={onNewProject}>
              <Plus className="size-4" />
              Новый проект
            </DropdownMenuItem>
          )}
          {projects.length === 0 && !onNewProject && (
            <div className="px-2 py-4 text-center text-xs text-muted-foreground">
              Нет проектов
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete confirmation dialog — outside the dropdown */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Удалить проект?</DialogTitle>
            <DialogDescription className="pt-1">
              Это действие нельзя отменить. Все данные проекта, AI-анализы и стратегии
              будут удалены безвозвратно.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
