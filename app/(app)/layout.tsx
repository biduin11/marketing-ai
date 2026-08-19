import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { listProjects } from "@/lib/actions/projects"
import { prisma } from "@/lib/prisma"
import { getQuickStartProgress } from "@/lib/services/onboarding.service"
import { AppShell } from "@/components/app-shell"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userId = session.user.id

  const [projects, user, quickStartSteps] = await Promise.all([
    listProjects(),
    prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, onboardingDismissedAt: true },
    }),
    getQuickStartProgress(userId),
  ])

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
      showRoleModal={projects.length === 0 && !user?.role}
      quickStartSteps={quickStartSteps}
      onboardingDismissed={!!user?.onboardingDismissedAt}
    >
      {children}
    </AppShell>
  )
}
