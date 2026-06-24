"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Sparkles, RefreshCw, Loader2, Users, Briefcase, Zap, AlertCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { SegmentCard } from "@/components/audience/segment-card"
import { PersonaCard } from "@/components/audience/persona-card"
import { JtbdCard } from "@/components/audience/jtbd-card"
import {
  runAudienceSegments,
  runBuyerPersona,
  runJtbd,
} from "@/lib/actions/ai"
import type {
  AudienceSegments,
  BuyerPersona,
  Jtbd,
} from "@/lib/ai/schemas/audience"

interface AudienceViewProps {
  projectId: string
  segments: AudienceSegments | null
  segmentsVersion: number | null
  persona: BuyerPersona | null
  personaVersion: number | null
  jtbd: Jtbd | null
  jtbdVersion: number | null
}

type LoadingKey = "segments" | "persona" | "jtbd" | null

export function AudienceView({
  projectId,
  segments,
  segmentsVersion,
  persona,
  personaVersion,
  jtbd,
  jtbdVersion,
}: AudienceViewProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<LoadingKey>(null)

  async function generate(
    key: LoadingKey,
    action: (id: string, force: boolean) => Promise<{ success: boolean; error?: string }>,
    force: boolean,
    successMsg: string
  ) {
    setLoading(key)
    try {
      const result = await action(projectId, force)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(successMsg)
      router.refresh()
    } catch {
      toast.error("Не удалось выполнить генерацию")
    } finally {
      setLoading(null)
    }
  }

  const allPains = persona
    ? persona.personas.flatMap((p) =>
        p.pains.map((pain) => ({ pain, persona: p.name }))
      )
    : []

  const allTriggers = persona
    ? persona.personas.flatMap((p) =>
        p.triggers.map((trigger) => ({ trigger, persona: p.name }))
      )
    : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Аудитория</h2>
        <p className="text-sm text-muted-foreground">
          Сегменты, персоны, JTBD, боли и триггеры
        </p>
      </div>

      <Tabs defaultValue="segments">
        <TabsList>
          <TabsTrigger value="segments">Сегменты</TabsTrigger>
          <TabsTrigger value="personas">Портреты</TabsTrigger>
          <TabsTrigger value="jtbd">JTBD</TabsTrigger>
          <TabsTrigger value="pains">Боли</TabsTrigger>
          <TabsTrigger value="triggers">Триггеры</TabsTrigger>
        </TabsList>

        {/* ─── Сегменты ─── */}
        <TabsContent value="segments" className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {segments
                ? `${segments.segments.length} сегментов · версия ${segmentsVersion}`
                : "Нет данных"}
            </p>
            {segments ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  generate("segments", runAudienceSegments, true, "Сегменты обновлены")
                }
                disabled={loading !== null}
              >
                {loading === "segments" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                Регенерировать
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() =>
                  generate("segments", runAudienceSegments, false, "Сегменты готовы")
                }
                disabled={loading !== null}
              >
                {loading === "segments" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                Сгенерировать
              </Button>
            )}
          </div>

          {!segments ? (
            <div className="flex h-[40vh] items-center justify-center">
              <EmptyState
                icon={Users}
                title="Сегменты не созданы"
                description="Нажмите «Сгенерировать», чтобы AI выделил ключевые сегменты вашей аудитории."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {segments.summary && (
                <div className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
                  <p className="text-sm text-muted-foreground">{segments.summary}</p>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {segments.segments.map((seg, i) => (
                  <SegmentCard key={i} segment={seg} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ─── Портреты ─── */}
        <TabsContent value="personas" className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {persona
                ? `${persona.personas.length} персон · версия ${personaVersion}`
                : "Нет данных"}
            </p>
            {persona ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  generate("persona", runBuyerPersona, true, "Персоны обновлены")
                }
                disabled={loading !== null}
              >
                {loading === "persona" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                Регенерировать
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() =>
                  generate("persona", runBuyerPersona, false, "Персоны готовы")
                }
                disabled={loading !== null}
              >
                {loading === "persona" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                Сгенерировать
              </Button>
            )}
          </div>

          {!persona ? (
            <div className="flex h-[40vh] items-center justify-center">
              <EmptyState
                icon={Briefcase}
                title="Персоны не созданы"
                description="Нажмите «Сгенерировать», чтобы AI создал детальные Buyer Persona с целями, болями и триггерами."
              />
            </div>
          ) : (
            <div className="space-y-4">
              {persona.personas.map((p, i) => (
                <PersonaCard key={i} persona={p} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── JTBD ─── */}
        <TabsContent value="jtbd" className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {jtbd
                ? `${jtbd.jobs.length} работ · версия ${jtbdVersion}`
                : "Нет данных"}
            </p>
            {jtbd ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  generate("jtbd", runJtbd, true, "JTBD обновлены")
                }
                disabled={loading !== null}
              >
                {loading === "jtbd" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                Регенерировать
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() =>
                  generate("jtbd", runJtbd, false, "JTBD готовы")
                }
                disabled={loading !== null}
              >
                {loading === "jtbd" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                Сгенерировать
              </Button>
            )}
          </div>

          {!jtbd ? (
            <div className="flex h-[40vh] items-center justify-center">
              <EmptyState
                icon={Zap}
                title="JTBD не созданы"
                description="Нажмите «Сгенерировать», чтобы AI выявил работы, которые клиенты нанимают ваш продукт выполнять."
              />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {jtbd.jobs.map((job, i) => (
                <JtbdCard key={i} job={job} index={i} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Боли ─── */}
        <TabsContent value="pains" className="mt-6">
          {!persona ? (
            <div className="flex h-[40vh] items-center justify-center">
              <EmptyState
                icon={AlertCircle}
                title="Сначала сгенерируйте персоны"
                description="Боли извлекаются из Buyer Persona. Перейдите во вкладку «Портреты» и создайте персоны."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {allPains.map(({ pain, persona: pName }, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-[#eaeaea] bg-white p-4 shadow-sm"
                >
                  <span className="mt-0.5 size-2 shrink-0 rounded-full bg-[#dc2626]" />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{pain}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{pName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Триггеры ─── */}
        <TabsContent value="triggers" className="mt-6">
          {!persona ? (
            <div className="flex h-[40vh] items-center justify-center">
              <EmptyState
                icon={Zap}
                title="Сначала сгенерируйте персоны"
                description="Триггеры извлекаются из Buyer Persona. Перейдите во вкладку «Портреты» и создайте персоны."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {allTriggers.map(({ trigger, persona: pName }, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-[#eaeaea] bg-white p-4 shadow-sm"
                >
                  <span className="mt-0.5 size-2 shrink-0 rounded-full bg-[#16a34a]" />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{trigger}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{pName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
