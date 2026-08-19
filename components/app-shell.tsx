"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { AiChatPanel } from "@/components/ai-chat/ai-chat-panel"
import { WelcomeRoleModal } from "@/components/onboarding/welcome-role-modal"
import { QuickStartWidget } from "@/components/onboarding/quick-start-widget"
import type { ProjectListItem } from "@/components/project-switcher"
import type { QuickStartStep } from "@/lib/services/onboarding.service"

interface AppShellProps {
  userEmail?: string | null
  userName?: string | null
  projects: ProjectListItem[]
  showRoleModal: boolean
  quickStartSteps: QuickStartStep[]
  onboardingDismissed: boolean
  children: React.ReactNode
}

export function AppShell({
  userEmail,
  userName,
  projects,
  showRoleModal,
  quickStartSteps,
  onboardingDismissed,
  children,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar
        userEmail={userEmail}
        userName={userName}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader projects={projects} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
          {children}
        </main>
      </div>
      <AiChatPanel />

      {showRoleModal && <WelcomeRoleModal show />}
      {!onboardingDismissed && <QuickStartWidget steps={quickStartSteps} />}
    </div>
  )
}
