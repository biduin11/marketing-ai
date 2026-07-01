import { getActiveProjectId } from "@/lib/actions/active-project"
import { listInboxSignals } from "@/lib/actions/inbox"
import { InboxView } from "@/components/inbox/inbox-view"

export default async function InboxPage() {
  const projectId = await getActiveProjectId()
  const signals = projectId ? await listInboxSignals(projectId) : []

  return <InboxView projectId={projectId} signals={signals} />
}
