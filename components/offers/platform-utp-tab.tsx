"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Sparkles, RefreshCw, Loader2, Copy, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import {
  getPlatformUtp,
  runPlatformUtp,
  type PlatformUtpResult,
} from "@/lib/actions/platform-utp"
import type { PlatformKey, PsychotypeKey } from "@/lib/ai/schemas/platform-utp"
import { cn } from "@/lib/utils"

const PLATFORMS: { id: PlatformKey; label: string; icon: string }[] = [
  { id: "avito", label: "Авито", icon: "🛒" },
  { id: "yandex_maps", label: "Яндекс.Карты", icon: "🗺️" },
  { id: "instagram", label: "Instagram", icon: "📸" },
  { id: "telegram", label: "Telegram", icon: "✈️" },
  { id: "vk", label: "ВКонтакте", icon: "💙" },
  { id: "youtube", label: "YouTube", icon: "▶️" },
  { id: "tiktok", label: "TikTok", icon: "🎵" },
]

const PSYCHOTYPE_META: { key: PsychotypeKey; label: string; emoji: string }[] = [
  { key: "traditionalist", label: "Традиционалист", emoji: "🐪" },
  { key: "independent", label: "Независимый", emoji: "🐯" },
  { key: "aesthete", label: "Эстет", emoji: "🦚" },
  { key: "hedonist", label: "Гедонист", emoji: "🐱" },
]

interface PlatformUtpTabProps {
  projectId: string
}

export function PlatformUtpTab({ projectId }: PlatformUtpTabProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformKey | null>(null)
  const [result, setResult] = useState<PlatformUtpResult | null>(null)
  const [generating, setGenerating] = useState(false)
  const [isPending, startTransition] = useTransition()

  const platformLabel = selectedPlatform
    ? PLATFORMS.find((p) => p.id === selectedPlatform)?.label
    : undefined

  function selectPlatform(platform: PlatformKey) {
    setSelectedPlatform(platform)
    setResult(null)
    startTransition(async () => {
      const cached = await getPlatformUtp(projectId, platform)
      setResult(cached)
    })
  }

  async function generate() {
    if (!selectedPlatform) return
    setGenerating(true)
    try {
      const res = await runPlatformUtp(projectId, selectedPlatform)
      if (!res.success) {
        toast.error(res.error)
        return
      }
      setResult(res.data)
      toast.success("УТП готовы")
    } catch {
      toast.error("Не удалось сгенерировать УТП")
    } finally {
      setGenerating(false)
    }
  }

  function copyVariant(variant: {
    headline: string
    fullText: string
    cta: string
  }) {
    navigator.clipboard.writeText(
      `${variant.headline}\n\n${variant.fullText}\n\n${variant.cta}`
    )
    toast.success("Скопировано")
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground">
          УТП по площадкам
        </h2>
        <p className="text-sm text-muted-foreground">
          AI-заголовки и тексты под формат и аудиторию каждой площадки
        </p>
      </div>

      {/* Platform pills */}
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => selectPlatform(p.id)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
              selectedPlatform === p.id
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-foreground hover:bg-muted"
            )}
          >
            <span>{p.icon}</span>
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {!selectedPlatform ? (
        <div className="flex h-[40vh] items-center justify-center">
          <EmptyState
            icon={Store}
            title="Выберите площадку"
            description="Выберите площадку, чтобы получить УТП под каждый психотип покупателя."
          />
        </div>
      ) : isPending ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          <Button onClick={generate} disabled={generating} size="sm">
            {generating ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : result ? (
              <RefreshCw className="size-3.5" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            {result ? "Регенерировать" : `Сгенерировать УТП для ${platformLabel}`}
          </Button>

          {!result && !generating && (
            <div className="flex h-[30vh] items-center justify-center">
              <EmptyState
                icon={Sparkles}
                title="УТП ещё не созданы"
                description={`Нажмите «Сгенерировать УТП для ${platformLabel}», чтобы AI подготовил варианты под каждый психотип.`}
              />
            </div>
          )}

          {result && (
            <>
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="mb-1 text-xs font-medium text-foreground">
                  📊 Аудитория {platformLabel}
                </p>
                <p className="text-sm text-foreground">{result.payload.audience}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Формат: {result.payload.format} · версия {result.version}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {PSYCHOTYPE_META.map((p) => {
                  const variant = result.payload.variants.find(
                    (v) => v.psychotype === p.key
                  )
                  return (
                    <div
                      key={p.key}
                      className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                    >
                      <p className="mb-3 text-xs font-semibold text-muted-foreground">
                        {p.emoji} {p.label}
                      </p>

                      {variant ? (
                        <>
                          <p className="mb-1 text-base font-bold text-foreground">
                            {variant.headline}
                          </p>
                          <p className="mb-3 text-sm text-muted-foreground">
                            {variant.subheadline}
                          </p>

                          <div className="mb-3 rounded-xl border border-border bg-muted/40 p-3">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                              {variant.fullText}
                            </p>
                          </div>

                          <p className="mb-3 text-xs font-medium text-foreground">
                            CTA: {variant.cta}
                          </p>

                          {variant.tips.length > 0 && (
                            <div className="border-t border-border pt-3">
                              <p className="mb-1 text-xs text-muted-foreground">
                                💡 Советы для {platformLabel}:
                              </p>
                              <ul className="space-y-1">
                                {variant.tips.map((tip, i) => (
                                  <li
                                    key={i}
                                    className="flex gap-1.5 text-xs text-muted-foreground"
                                  >
                                    <span className="shrink-0">•</span>
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => copyVariant(variant)}
                            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs text-muted-foreground hover:bg-muted"
                          >
                            <Copy className="size-3" />
                            Копировать текст
                          </button>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">—</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
