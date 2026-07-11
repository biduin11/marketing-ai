"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Copy, Plus, Link as LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createClientAccess,
  revokeClientAccess,
  type ClientAccessItem,
} from "@/lib/actions/clientAccess"

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
}

const EXPIRY_OPTIONS = [
  { value: "none", label: "Бессрочно" },
  { value: "7", label: "7 дней" },
  { value: "30", label: "30 дней" },
  { value: "90", label: "90 дней" },
] as const

interface ClientAccessSectionProps {
  projectId: string
  initialAccesses: ClientAccessItem[]
  appUrl: string
}

export function ClientAccessSection({
  projectId,
  initialAccesses,
  appUrl,
}: ClientAccessSectionProps) {
  const [accesses, setAccesses] = useState<ClientAccessItem[]>(initialAccesses)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [expiry, setExpiry] = useState<(typeof EXPIRY_OPTIONS)[number]["value"]>("none")
  const [creating, setCreating] = useState(false)
  const [isPending, startTransition] = useTransition()

  function linkFor(token: string): string {
    return `${appUrl}/client/${token}`
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(linkFor(token))
    toast.success("Ссылка скопирована")
  }

  function openCreate() {
    setClientName("")
    setClientEmail("")
    setExpiry("none")
    setDialogOpen(true)
  }

  async function handleCreate() {
    setCreating(true)
    try {
      const result = await createClientAccess({
        projectId,
        clientName: clientName.trim() || undefined,
        clientEmail: clientEmail.trim() || undefined,
        expiresInDays: expiry === "none" ? null : (Number(expiry) as 7 | 30 | 90),
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setAccesses((prev) => [result.data, ...prev])
      setDialogOpen(false)
      copyLink(result.data.token)
    } catch {
      toast.error("Не удалось создать ссылку")
    } finally {
      setCreating(false)
    }
  }

  function handleRevoke(id: string) {
    if (!window.confirm("Отозвать доступ клиента?")) return
    startTransition(async () => {
      const result = await revokeClientAccess(id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setAccesses((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isActive: false } : a))
      )
      toast.success("Доступ отозван")
    })
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-1 text-base font-semibold text-foreground">Доступ для клиента</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Отправьте клиенту ссылку — он увидит дашборд проекта без возможности редактирования
      </p>

      {accesses.map((access) => (
        <div
          key={access.id}
          className="mb-2 flex items-center justify-between rounded-xl border border-border p-3"
        >
          <div>
            <p className="text-sm font-medium text-foreground">
              {access.clientName ?? "Клиент"}
            </p>
            <p className="text-xs text-muted-foreground">
              {access.isActive ? "● Активен" : "○ Отозван"}
              {access.lastVisitAt && ` · Последний визит: ${fmtDate(access.lastVisitAt)}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyLink(access.token)}
              disabled={!access.isActive}
            >
              <Copy className="size-3.5" />
              Скопировать ссылку
            </Button>
            {access.isActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRevoke(access.id)}
                disabled={isPending}
                className="text-danger hover:bg-danger/10 hover:text-danger"
              >
                Отозвать
              </Button>
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={openCreate}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-foreground hover:text-foreground"
      >
        <Plus className="size-3.5" />
        Создать ссылку для клиента
      </button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Доступ для клиента</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="client-name">Имя клиента</Label>
              <Input
                id="client-name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Необязательно"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-email">Email клиента</Label>
              <Input
                id="client-email"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="Необязательно"
              />
            </div>
            <div className="space-y-2">
              <Label>Срок действия</Label>
              <Select value={expiry} onValueChange={(v) => v && setExpiry(v as typeof expiry)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} disabled={creating}>
              <LinkIcon className="size-3.5" />
              Создать ссылку
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
