"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PLATFORMS, type PlatformConfig } from "@/lib/config/platforms"
import { saveIntegration } from "@/lib/actions/integrations"
import type { IntegrationListItem } from "@/lib/actions/integrations"
import type { Platform } from "@prisma/client"

interface IntegrationsSectionProps {
  projectId: string
  integrations: IntegrationListItem[]
}

export function IntegrationsSection({
  projectId,
  integrations,
}: IntegrationsSectionProps) {
  const router = useRouter()
  const [activePlatform, setActivePlatform] = useState<PlatformConfig | null>(null)

  const current = activePlatform
    ? integrations.find((i) => i.platform === activePlatform.key) ?? null
    : null

  return (
    <div className="rounded-2xl border border-[#eaeaea] bg-white p-6">
      <h3 className="mb-1 text-base font-semibold text-[#111]">Интеграции</h3>
      <p className="mb-6 text-sm text-[#6b7280]">
        Подключите площадки, чтобы автоматически собирать отзывы и статистику
        соцсетей в раздел «Репутация».
      </p>

      <div className="space-y-4">
        {PLATFORMS.map((platform) => {
          const integration = integrations.find((i) => i.platform === platform.key)
          return (
            <div
              key={platform.key}
              className="flex items-center justify-between rounded-xl border border-[#eaeaea] p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#eaeaea] bg-[#fafafa] text-lg">
                  {platform.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#111]">{platform.name}</p>
                  <p className="text-xs text-[#6b7280]">
                    {integration?.accountName
                      ? `Подключено: ${integration.accountName}`
                      : integration?.accountId
                        ? `Подключено: ${integration.accountId}`
                        : platform.hint}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {integration?.isActive && (
                  <span className="rounded-full border border-green-200 bg-green-50 px-2 py-1 text-xs text-green-700">
                    Активно
                  </span>
                )}
                <button
                  onClick={() => setActivePlatform(platform)}
                  className="rounded-lg border border-[#eaeaea] px-3 py-1.5 text-sm hover:bg-[#fafafa]"
                >
                  {integration ? "Настроить" : "Подключить"}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {activePlatform && (
        <IntegrationDialog
          projectId={projectId}
          platform={activePlatform}
          current={current}
          onClose={() => setActivePlatform(null)}
          onSaved={() => {
            setActivePlatform(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

interface IntegrationDialogProps {
  projectId: string
  platform: PlatformConfig
  current: IntegrationListItem | null
  onClose: () => void
  onSaved: () => void
}

function IntegrationDialog({
  projectId,
  platform,
  current,
  onClose,
  onSaved,
}: IntegrationDialogProps) {
  const [accountId, setAccountId] = useState(current?.accountId ?? "")
  const [accountName, setAccountName] = useState(current?.accountName ?? "")
  const [accessToken, setAccessToken] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!accountId.trim()) {
      toast.error("Укажите ID аккаунта")
      return
    }
    // Token required on first connect; optional when editing (keep existing)
    if (!current?.hasToken && !accessToken.trim()) {
      toast.error("Укажите токен/ключ доступа")
      return
    }

    setSaving(true)
    try {
      const result = await saveIntegration({
        projectId,
        platform: platform.key as Platform,
        accountId: accountId.trim(),
        accountName: accountName.trim() || undefined,
        accessToken: accessToken.trim() || undefined,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(`${platform.name} подключено`)
      onSaved()
    } catch {
      toast.error("Не удалось сохранить интеграцию")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">{platform.icon}</span>
            {platform.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#111]">
              {platform.fields[0].label}
            </label>
            <Input
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder={platform.fields[0].label}
            />
            <p className="mt-1 text-xs text-[#6b7280]">{platform.fields[0].hint}</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#111]">
              {platform.fields[1].label}
            </label>
            <Input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder={
                current?.hasToken ? "•••••• (оставьте пустым, чтобы не менять)" : platform.fields[1].label
              }
            />
            <p className="mt-1 text-xs text-[#6b7280]">{platform.fields[1].hint}</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#111]">
              Название для отображения (необязательно)
            </label>
            <Input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Например: Мой салон на Ленина"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
              Отмена
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              Сохранить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
