"use client"

import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { navItems } from "@/lib/nav"
import { ProjectSwitcher, type ProjectListItem } from "@/components/project-switcher"
import { NewProjectDialog } from "@/components/new-project-dialog"

interface AppHeaderProps {
  projects: ProjectListItem[]
  onMenuClick?: () => void
}

export function AppHeader({ projects, onMenuClick }: AppHeaderProps) {
  const pathname = usePathname()

  const currentItem = navItems.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  )

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center text-foreground md:hidden"
          aria-label="Открыть меню"
        >
          <Menu className="size-5" />
        </button>
        <ProjectSwitcher projects={projects} />
        <span className="text-sm text-muted-foreground">/</span>
        <h1 className="text-sm font-medium text-foreground">
          {currentItem?.label ?? "AI Marketing OS"}
        </h1>
      </div>

      <div className="hidden items-center gap-2 md:flex">
        <NewProjectDialog />
      </div>
    </header>
  )
}
