"use client"

import { User } from "lucide-react"
import { PlanCard } from "@/components/settings/plan-card"
import { UsageBar } from "@/components/settings/usage-bar"
import type { UsageInfo } from "@/lib/services/usage.service"

interface SettingsViewProps {
  name: string | null
  email: string
  usage: UsageInfo
}

export function SettingsView({ name, email, usage }: SettingsViewProps) {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Настройки</h2>
        <p className="text-sm text-muted-foreground">Профиль, план и расход AI</p>
      </div>

      {/* Profile */}
      <div className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-neutral-100">
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
      <UsageBar usage={usage} />
    </div>
  )
}
