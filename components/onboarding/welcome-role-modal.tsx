"use client"

import { useState } from "react"
import { Megaphone, Building2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { setUserRole } from "@/lib/actions/user"
import type { UserRole } from "@/lib/validations/user"

const ROLE_OPTIONS: { value: UserRole; label: string; description: string; icon: typeof Megaphone }[] = [
  {
    value: "MARKETER",
    label: "Маркетолог / агентство",
    description: "Веду клиентов",
    icon: Megaphone,
  },
  {
    value: "BUSINESS_OWNER",
    label: "Владелец бизнеса",
    description: "Продвигаю свою компанию",
    icon: Building2,
  },
]

export function WelcomeRoleModal({ show }: { show: boolean }) {
  const [open, setOpen] = useState(show)
  const [saving, setSaving] = useState(false)

  async function choose(role: UserRole) {
    setSaving(true)
    try {
      await setUserRole({ role })
    } finally {
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Кто вы?</DialogTitle>
          <DialogDescription>
            Поможет точнее подбирать формулировки в интерфейсе. Можно пропустить.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 pt-2 sm:grid-cols-2">
          {ROLE_OPTIONS.map(({ value, label, description, icon: Icon }) => (
            <button
              key={value}
              type="button"
              disabled={saving}
              onClick={() => choose(value)}
              className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted disabled:opacity-60"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-4 text-foreground" />
              </span>
              <span className="text-sm font-medium text-foreground">{label}</span>
              <span className="text-xs text-muted-foreground">{description}</span>
            </button>
          ))}
        </div>
        <div className="flex justify-end pt-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={saving}
            onClick={() => setOpen(false)}
          >
            Пропустить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
