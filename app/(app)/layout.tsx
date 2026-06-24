import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { listProjects } from "@/lib/actions/projects"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const projects = await listProjects()

  // Serialize ProjectListItem (omit createdAt to keep it serializable simply)
  const projectItems = projects.map((p) => ({
    id: p.id,
    name: p.name,
    niche: p.niche,
    status: p.status as "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED",
  }))

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar
        userEmail={session.user.email}
        userName={session.user.name}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader projects={projectItems} />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
