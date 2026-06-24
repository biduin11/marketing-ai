"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Building2, Calendar } from "lucide-react"
import { useProjectStore } from "@/lib/store/project-store"
import { setActiveProject } from "@/lib/actions/active-project"
import { cn } from "@/lib/utils"

interface ProjectCardItem {
  id: string
  name: string
  niche: string | null
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED"
  createdAt: Date
}

const statusLabel: Record<ProjectCardItem["status"], string> = {
  DRAFT: "Черновик",
  ACTIVE: "Активный",
  PAUSED: "На паузе",
  ARCHIVED: "Архив",
}

const statusColor: Record<ProjectCardItem["status"], string> = {
  DRAFT: "text-muted-foreground bg-muted",
  ACTIVE: "text-success bg-success/10",
  PAUSED: "text-warning bg-warning/10",
  ARCHIVED: "text-muted-foreground bg-muted",
}

export function ProjectCard({ project }: { project: ProjectCardItem }) {
  const { activeProjectId, setActiveProjectId } = useProjectStore()
  const router = useRouter()
  const [, startTransition] = useTransition()
  const isActive = activeProjectId === project.id

  function handleSelect() {
    setActiveProjectId(project.id)
    startTransition(async () => {
      await setActiveProject(project.id)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleSelect}
      className={cn(
        "group flex flex-col gap-4 rounded-2xl border bg-card p-6 text-left transition-all hover:border-foreground/20 hover:shadow-sm",
        isActive
          ? "border-foreground/30 ring-1 ring-foreground/10"
          : "border-border"
      )}
    >
      {/* Icon + Status */}
      <div className="flex items-start justify-between">
        <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
          <Building2 className="size-5 text-muted-foreground" />
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            statusColor[project.status]
          )}
        >
          {statusLabel[project.status]}
        </span>
      </div>

      {/* Info */}
      <div>
        <h3 className="font-medium text-foreground">{project.name}</h3>
        {project.niche && (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {project.niche}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Calendar className="size-3" />
        {new Date(project.createdAt).toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </div>
    </button>
  )
}
