import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getUsageThisMonth } from "@/lib/services/usage.service"
import { listProjects } from "@/lib/actions/projects"
import { getActiveProjectId } from "@/lib/actions/active-project"
import { getChannels } from "@/lib/actions/channels"
import { listIntegrations } from "@/lib/actions/integrations"
import { SettingsView } from "@/components/settings/settings-view"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [usage, projects, activeProjectId] = await Promise.all([
    getUsageThisMonth(session.user.id),
    listProjects(),
    getActiveProjectId(),
  ])

  const { PLAN_LIMITS } = await import("@/lib/config/plans")
  const maxProjects = PLAN_LIMITS[usage.planName].maxProjects

  const [channels, integrations] = activeProjectId
    ? await Promise.all([
        getChannels(activeProjectId),
        listIntegrations(activeProjectId),
      ])
    : [[], []]

  return (
    <SettingsView
      name={session.user.name ?? null}
      email={session.user.email ?? ""}
      usage={usage}
      projectCount={projects.length}
      maxProjects={maxProjects === Infinity ? 999 : maxProjects}
      projects={projects}
      activeProjectId={activeProjectId}
      channels={channels}
      integrations={integrations}
    />
  )
}
