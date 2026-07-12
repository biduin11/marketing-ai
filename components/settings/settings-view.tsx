"use client"

import { User } from "lucide-react"
import { PlanCard } from "@/components/settings/plan-card"
import { UsageBar } from "@/components/settings/usage-bar"
import { ChannelsSection } from "@/components/settings/channels-section"
import { ClientAccessSection } from "@/components/settings/client-access-section"
import { YandexMetrikaSection } from "@/components/settings/yandex-metrika-section"
import { DeleteProjectSection } from "@/components/settings/delete-project-section"
import type { UsageInfo } from "@/lib/services/usage.service"
import type { ProjectListItem } from "@/lib/actions/projects"
import type { ChannelItem } from "@/lib/actions/channels"
import type { ClientAccessItem } from "@/lib/actions/clientAccess"
import type { YandexMetrikaIntegrationItem } from "@/lib/actions/yandex-metrika"

interface SettingsViewProps {
  name: string | null
  email: string
  usage: UsageInfo
  projectCount: number
  maxProjects: number
  projects: ProjectListItem[]
  activeProjectId: string | null
  channels: ChannelItem[]
  clientAccesses: ClientAccessItem[]
  yandexMetrikaIntegration: YandexMetrikaIntegrationItem | null
  appUrl: string
}

export function SettingsView({ name, email, usage, projectCount, maxProjects, projects, activeProjectId, channels, clientAccesses, yandexMetrikaIntegration, appUrl }: SettingsViewProps) {
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? projects[0] ?? null

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground">Настройки</h2>
        <p className="text-sm text-muted-foreground">Профиль, план и расход AI</p>
      </div>

      {/* Profile */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <User className="size-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{name ?? "Пользователь"}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Для смены email или пароля обратитесь в поддержку.
        </p>
      </div>

      <PlanCard planName={usage.planName} />
      <UsageBar usage={usage} projectCount={projectCount} maxProjects={maxProjects} />

      {activeProject && (
        <ChannelsSection projectId={activeProject.id} initialChannels={channels} />
      )}

      {activeProject && (
        <ClientAccessSection
          projectId={activeProject.id}
          initialAccesses={clientAccesses}
          appUrl={appUrl}
        />
      )}

      {activeProject && (
        <YandexMetrikaSection
          projectId={activeProject.id}
          initialIntegration={yandexMetrikaIntegration}
        />
      )}

      {/* Danger zone */}
      {activeProject && (
        <DeleteProjectSection
          projectId={activeProject.id}
          projectName={activeProject.name}
          isSingleProject={projects.length <= 1}
        />
      )}
    </div>
  )
}
