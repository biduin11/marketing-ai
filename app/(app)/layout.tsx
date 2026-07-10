import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { listProjects } from "@/lib/actions/projects"
import { AppShell } from "@/components/app-shell"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const projects = await listProjects()

  const projectItems = projects.map((p) => ({
    id: p.id,
    name: p.name,
    niche: p.niche,
    status: p.status,
  }))

  return (
    <AppShell
      userEmail={session.user.email}
      userName={session.user.name}
      projects={projectItems}
    >
      {children}
    </AppShell>
  )
}
