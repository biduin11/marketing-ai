import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getUsageThisMonth } from "@/lib/services/usage.service"
import { SettingsView } from "@/components/settings/settings-view"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const usage = await getUsageThisMonth(session.user.id)

  return (
    <SettingsView
      name={session.user.name ?? null}
      email={session.user.email ?? ""}
      usage={usage}
    />
  )
}
