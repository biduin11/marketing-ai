import { FolderOpen, Plus } from "lucide-react"
import { listProjects } from "@/lib/actions/projects"
import { EmptyState } from "@/components/empty-state"
import { NewProjectDialog } from "@/components/new-project-dialog"
import { ProjectCard } from "@/components/project-card"

export default async function HomePage() {
  const projects = await listProjects()

  if (projects.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={FolderOpen}
          title="Нет проектов"
          description="Создайте первый проект, чтобы начать работу с AI Marketing OS"
          action={
            <NewProjectDialog
              trigger={
                <div className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80">
                  <Plus className="size-3.5" />
                  Создать первый проект
                </div>
              }
            />
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Проекты</h2>
          <p className="text-sm text-muted-foreground">
            {projects.length}{" "}
            {projects.length === 1 ? "проект" : "проектов"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  )
}
