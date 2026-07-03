"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Sparkles, RefreshCw, Loader2, Tag, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { runOffer } from "@/lib/actions/ai"
import type { Offer } from "@/lib/ai/schemas/offer"
import { OFFER_TYPE_META, TONE_CLASSES } from "@/lib/status-variants"
import { cn } from "@/lib/utils"

interface OffersViewProps {
  projectId: string
  offer: Offer | null
  version: number | null
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
                  const meta = OFFER_TYPE_META[o.type]
                  const tone = TONE_CLASSES[meta.tone]
                  const Icon = meta.icon
                  return (
                    <div
                      key={i}
                      className={cn(
                        "rounded-2xl border p-6 shadow-sm",
                        tone.bg,
                        tone.border
                      )}
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <span className={cn("flex items-center gap-1 text-xs font-medium", tone.text)}>
                          <Icon className="size-4" />
                          {meta.label}
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
                    className="rounded-2xl border border-border bg-card p-6 shadow-sm"
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
