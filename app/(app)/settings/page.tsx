import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getUsageThisMonth } from "@/lib/services/usage.service"
import { listProjects } from "@/lib/actions/projects"
import { getActiveProjectId } from "@/lib/actions/active-project"
import { getChannels } from "@/lib/actions/channels"
import { SettingsView } from "@/components/settings/settings-view"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [usage, projects, activeProjectId] = await Promise.all([
    getUsageThisMonth(session.user.id),
    listProjects(),
    getActiveProjectId(),
  ])

  const channels = activeProjectId ? await getChannels(activeProjectId) : []

  return (
    <SettingsView
      name={session.user.name ?? null}
      email={session.user.email ?? ""}
      usage={usage}
      projects={projects}
      activeProjectId={activeProjectId}
      channels={channels}
    />
  )
}
