"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { AiChatPanel } from "@/components/ai-chat/ai-chat-panel"
import type { ProjectListItem } from "@/components/project-switcher"

interface AppShellProps {
  userEmail?: string | null
  userName?: string | null
  projects: ProjectListItem[]
  children: React.ReactNode
}

export function AppShell({ userEmail, userName, projects, children }: AppShellProps) {
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
    </div>
  )
}
