"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { ChevronsUpDown, FolderOpen, Plus } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useProjectStore } from "@/lib/store/project-store"
import { setActiveProject } from "@/lib/actions/active-project"
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

  const activeProject = projects.find((p) => p.id === activeProjectId)

  function handleSelect(id: string) {
    setActiveProjectId(id)
    startTransition(async () => {
      await setActiveProject(id)
      router.refresh()
    })
  }

  return (
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

      <DropdownMenuContent align="start" className="w-56">
        {projects.length > 0 && (
          <>
            <DropdownMenuLabel>Проекты</DropdownMenuLabel>
            {projects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => handleSelect(project.id)}
                className={cn(
                  activeProjectId === project.id &&
                    "bg-accent text-accent-foreground"
                )}
              >
                <span className="truncate">{project.name}</span>
                {project.niche && (
                  <span className="ml-auto truncate text-xs text-muted-foreground">
                    {project.niche}
                  </span>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
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
  )
}
