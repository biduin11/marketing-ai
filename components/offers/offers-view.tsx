"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Sparkles, RefreshCw, Loader2, Tag, Megaphone, Gift, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { runOffer } from "@/lib/actions/ai"
import type { Offer, OfferType } from "@/lib/ai/schemas/offer"
import { cn } from "@/lib/utils"

interface OffersViewProps {
  projectId: string
  offer: Offer | null
  version: number | null
}

const offerTypeConfig: Record<
  OfferType,
  { label: string; color: string; bg: string; border: string }
> = {
  utp: {
    label: "УТП",
    color: "text-foreground",
    bg: "bg-muted",
    border: "border-border",
  },
  promotion: {
    label: "Акция",
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/20",
  },
  special: {
    label: "Спецпредложение",
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/20",
  },
  lead_magnet: {
    label: "Лид-магнит",
    color: "text-muted-foreground",
    bg: "bg-muted/50",
    border: "border-border",
  },
}

function OfferTypeIcon({ type }: { type: OfferType }) {
  const icons = {
    utp: Tag,
    promotion: Megaphone,
    special: Gift,
    lead_magnet: BookOpen,
  } as const
  const Icon = icons[type]
  return <Icon className="size-4" />
}

export function OffersView({ projectId, offer, version }: OffersViewProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function generate(force: boolean) {
    setLoading(true)
    try {
      const result = await runOffer(projectId, force)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(force ? "Офферы обновлены" : "Офферы готовы")
      router.refresh()
    } catch {
      toast.error("Не удалось сгенерировать офферы")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">Офферы</h2>
          <p className="text-sm text-muted-foreground">
            УТП, акции, спецпредложения и лид-магниты
            {version && <span className="ml-2 text-xs">· версия {version}</span>}
          </p>
        </div>
        {offer ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => generate(true)}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Регенерировать
          </Button>
        ) : (
          <Button size="sm" onClick={() => generate(false)} disabled={loading}>
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            Сгенерировать
          </Button>
        )}
      </div>

      {!offer ? (
        <div className="flex h-[50vh] items-center justify-center">
          <EmptyState
            icon={Tag}
            title="Офферы не созданы"
            description="Нажмите «Сгенерировать», чтобы AI разработал УТП, акции, спецпредложения и лид-магниты."
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* USP + Tagline */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Главное УТП
            </p>
            <p className="text-xl font-semibold text-foreground">{offer.usp}</p>
            {offer.tagline && (
              <p className="mt-3 inline-block rounded-full border border-border bg-muted px-3 py-1 text-sm text-muted-foreground">
                {offer.tagline}
              </p>
            )}
          </div>

          {/* Offers grid */}
          {offer.offers.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Офферы
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {offer.offers.map((o, i) => {
                  const cfg = offerTypeConfig[o.type]
                  return (
                    <div
                      key={i}
                      className={cn(
                        "rounded-2xl border p-5 shadow-sm",
                        cfg.bg,
                        cfg.border
                      )}
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <span className={cn("flex items-center gap-1 text-xs font-medium", cfg.color)}>
                          <OfferTypeIcon type={o.type} />
                          {cfg.label}
                        </span>
                        <span className="rounded border border-border bg-card px-1.5 py-0.5 text-xs text-muted-foreground">
                          {o.target}
                        </span>
                      </div>
                      <p className="mb-1 text-sm font-semibold text-foreground">
                        {o.title}
                      </p>
                      <p className="mb-3 text-sm text-muted-foreground">
                        {o.description}
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        → {o.cta}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Lead magnets */}
          {offer.leadMagnets.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Лид-магниты
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {offer.leadMagnets.map((lm, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <BookOpen className="size-4 text-muted-foreground" />
                      <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        {lm.format}
                      </span>
                    </div>
                    <p className="mb-1 text-sm font-medium text-foreground">
                      {lm.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {lm.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
