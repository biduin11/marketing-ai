"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  saveYandexMetrikaIntegration,
  syncNow,
  removeYandexMetrikaIntegration,
  type YandexMetrikaIntegrationItem,
} from "@/lib/actions/yandex-metrika"

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface YandexMetrikaSectionProps {
  projectId: string
  initialIntegration: YandexMetrikaIntegrationItem | null
}

export function YandexMetrikaSection({
  projectId,
  initialIntegration,
}: YandexMetrikaSectionProps) {
  const [integration, setIntegration] = useState(initialIntegration)
  const [counterId, setCounterId] = useState("")
  const [accessToken, setAccessToken] = useState("")
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConnect() {
    setConnecting(true)
    setError(null)
    try {
      const result = await saveYandexMetrikaIntegration({ projectId, counterId, accessToken })
      if (!result.success) {
        setError(result.error)
        return
      }
      setIntegration(result.data)
      setCounterId("")
      setAccessToken("")
      toast.success("Яндекс.Метрика подключена")
    } finally {
      setConnecting(false)
    }
  }

  async function handleSyncNow() {
    setSyncing(true)
    try {
      const result = await syncNow(projectId)
      if (!result.success) {
        toast.error(result.error)
        setIntegration((prev) => (prev ? { ...prev, syncError: result.error } : prev))
        return
      }
      setIntegration((prev) =>
        prev ? { ...prev, lastSyncAt: new Date().toISOString(), syncError: null } : prev
      )
      toast.success(`Синхронизировано метрик: ${result.data.synced}`)
    } finally {
      setSyncing(false)
    }
  }

  async function handleRemove() {
    if (!window.confirm("Отключить Яндекс.Метрику?")) return
    const result = await removeYandexMetrikaIntegration(projectId)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    setIntegration(null)
    toast.success("Интеграция отключена")
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FC3F1D]">
          <span className="text-xs font-bold text-white">Я</span>
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">Яндекс.Метрика</h3>
          <p className="text-xs text-muted-foreground">
            Автоматический импорт визитов, лидов и источников трафика
          </p>
        </div>
        {integration?.isActive && (
          <span className="ml-auto rounded-full border border-success/20 bg-success/10 px-2 py-1 text-xs text-success">
            Подключено
          </span>
        )}
      </div>

      {!integration ? (
        <div className="space-y-4">
          <div className="space-y-1 rounded-xl border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Как получить данные:</p>
            <p>
              1. ID счётчика — в URL Метрики: metrika.yandex.ru/stat/id/<b>XXXXXXXX</b>
            </p>
            <p>
              2. OAuth токен — oauth.yandex.ru → создай приложение → права: <b>metrika:read</b>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="metrika-counter">ID счётчика</Label>
              <Input
                id="metrika-counter"
                value={counterId}
                onChange={(e) => setCounterId(e.target.value)}
                placeholder="12345678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metrika-token">OAuth токен</Label>
              <Input
                id="metrika-token"
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="y0_AgAAAA..."
              />
            </div>
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          <Button onClick={handleConnect} disabled={!counterId || !accessToken || connecting}>
            {connecting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Проверяю...
              </>
            ) : (
              "Подключить"
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-muted/50 p-2">
              <p className="text-muted-foreground">ID счётчика</p>
              <p className="font-medium text-foreground">{integration.counterId}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2">
              <p className="text-muted-foreground">Последняя синхронизация</p>
              <p className="font-medium text-foreground">
                {integration.lastSyncAt
                  ? fmtDateTime(integration.lastSyncAt)
                  : "Ещё не синхронизировано"}
              </p>
            </div>
          </div>

          {integration.syncError && (
            <div className="rounded-xl border border-danger/20 bg-danger/10 p-3">
              <p className="text-xs text-danger">⚠️ Ошибка: {integration.syncError}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSyncNow} disabled={syncing}>
              {syncing ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Синхронизирую...
                </>
              ) : (
                <>
                  <RefreshCw className="size-3.5" />
                  Синхронизировать сейчас
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemove}
              className="text-danger hover:bg-danger/10 hover:text-danger"
            >
              Отключить
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Автоматическая синхронизация каждый день в 06:00
          </p>
        </div>
      )}
    </div>
  )
}
