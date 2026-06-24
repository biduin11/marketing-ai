"use client"

import { usePathname } from "next/navigation"
import { navItems } from "@/lib/nav"
import { ProjectSwitcher, type ProjectListItem } from "@/components/project-switcher"
import { NewProjectDialog } from "@/components/new-project-dialog"

interface AppHeaderProps {
  projects: ProjectListItem[]
}

export function AppHeader({ projects }: AppHeaderProps) {
  const pathname = usePathname()

  const currentItem = navItems.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  )

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-3">
        <ProjectSwitcher projects={projects} />
        <span className="text-sm text-muted-foreground">/</span>
        <h1 className="text-sm font-medium text-foreground">
          {currentItem?.label ?? "AI Marketing OS"}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <NewProjectDialog />
      </div>
    </header>
  )
}
