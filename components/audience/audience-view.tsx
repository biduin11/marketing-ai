"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Sparkles,
  RefreshCw,
  Loader2,
  Users,
  Briefcase,
  Zap,
  AlertCircle,
  Download,
  Calendar,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Target,
  BarChart2,
  User,
  DollarSign,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { SegmentCard } from "@/components/audience/segment-card"
import { PersonaCard } from "@/components/audience/persona-card"
import { JtbdCard } from "@/components/audience/jtbd-card"
import { PieChart, Pie, Cell } from "recharts"
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
import type { Cjm } from "@/lib/ai/schemas/cjm"
import { JourneyView } from "@/components/journey/journey-view"

interface AudienceViewProps {
  projectId: string
  defaultTab?: string
  segments: AudienceSegments | null
  segmentsVersion: number | null
  segmentsCreatedAt: string | null
  persona: BuyerPersona | null
  personaVersion: number | null
  jtbd: Jtbd | null
  jtbdVersion: number | null
  cjm: Cjm | null
  cjmVersion: number | null
  cjmCreatedAt: string | null
}

type LoadingKey = "segments" | "persona" | "jtbd" | null

const DONUT_COLORS = ["#111", "#555", "#999", "#ccc", "#e5e5e5"]

function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function parseShareFromSize(size: string): number {
  const match = size.match(/(\d+(?:[.,]\d+)?)/)
  if (match) {
    const val = parseFloat(match[1].replace(",", "."))
    if (!Number.isNaN(val) && val <= 100) return val
  }
  return 0
}

export function AudienceView({
  projectId,
  defaultTab = "overview",
  segments,
  segmentsVersion,
  segmentsCreatedAt,
  persona,
  personaVersion,
  jtbd,
  jtbdVersion,
  cjm,
  cjmVersion,
  cjmCreatedAt,
}: AudienceViewProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<LoadingKey>(null)
  const [activeTab, setActiveTab] = useState(defaultTab)

  async function generate(
    key: LoadingKey,
    action: (
      id: string,
      force: boolean
    ) => Promise<{ success: boolean; error?: string }>,
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

  // Donut chart data — prefer segments[].share, fallback to parsing size string
  const rawDonut =
    segments?.segments.map((seg) => ({
      name: seg.name,
      share: seg.share ?? parseShareFromSize(seg.size),
    })) ?? []
  const totalShare = rawDonut.reduce((s, d) => s + d.share, 0)
  const donutData =
    totalShare > 0
      ? rawDonut.map((d) => ({
          ...d,
          share: Math.round((d.share / totalShare) * 100),
        }))
      : rawDonut

  // Aggregated pains/triggers for existing tabs (from persona personas)
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

  const hasAnyData = !!segments || !!persona

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-foreground">Клиент</h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted">
            <Download size={15} />
            Экспорт
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
            <Calendar size={15} />
            {fmtDate(segmentsCreatedAt)}
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto flex-wrap gap-1">
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="segments">Сегменты</TabsTrigger>
          <TabsTrigger value="personas">Портреты</TabsTrigger>
          <TabsTrigger value="jtbd">Jobs to be Done</TabsTrigger>
          <TabsTrigger value="pains">Боли и потребности</TabsTrigger>
          <TabsTrigger value="triggers">Триггеры</TabsTrigger>
          <TabsTrigger value="insights">Инсайты</TabsTrigger>
          <TabsTrigger value="cjm">CJM</TabsTrigger>
        </TabsList>

        {/* ─── ОБЗОР ─── */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {!hasAnyData ? (
            <div className="flex h-[40vh] items-center justify-center">
              <EmptyState
                icon={Users}
                title="Данные не загружены"
                description="Перейдите во вкладку «Сегменты» или «Портреты» и сгенерируйте данные — Обзор соберёт их автоматически."
              />
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Сегменты, объём аудитории и ICP ниже — рабочие гипотезы AI. Сверьте их с CRM, продажами,
                  опросами или статистикой рекламных кабинетов перед тем, как закладывать бюджет.
                </p>
              </div>
              {/* СЕКЦИЯ 1 — Сводка по аудитории */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Метрики */}
                  <div>
                    <h2 className="mb-4 text-base font-semibold text-foreground">
                      Сводка по аудитории
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      {(
                        [
                          {
                            label: "Сегменты аудитории",
                            value: segments?.segments.length ?? 0,
                            sub: "ключевых сегмента",
                            icon: (
                              <Users size={18} className="text-muted-foreground" />
                            ),
                          },
                          {
                            label: "Общий объём аудитории",
                            value: segments?.totalAudience
                              ? segments.totalAudience.toLocaleString("ru-RU")
                              : "—",
                            sub: "чел.",
                            icon: (
                              <Users size={18} className="text-muted-foreground" />
                            ),
                          },
                          {
                            label: "Потенциальный охват",
                            value: segments?.potentialReach ?? "—",
                            sub: "",
                            icon: (
                              <Target size={18} className="text-muted-foreground" />
                            ),
                          },
                          {
                            label: "Уровень соответствия ICP",
                            value:
                              segments?.icpMatch != null
                                ? `${segments.icpMatch}%`
                                : "—",
                            sub: segments?.icpLevel ?? "",
                            icon: (
                              <BarChart2
                                size={18}
                                className="text-muted-foreground"
                              />
                            ),
                          },
                        ] as const
                      ).map((m) => (
                        <div
                          key={m.label}
                          className="rounded-xl border border-border p-4"
                        >
                          <p className="mb-2 text-xs leading-snug text-muted-foreground">
                            {m.label}
                          </p>
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="tabular-nums text-2xl font-bold text-foreground">
                                {m.value}
                              </p>
                              {m.sub && (
                                <p className="text-xs text-muted-foreground">
                                  {m.sub}
                                </p>
                              )}
                              <span className="mt-1 inline-flex rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                Оценка AI
                              </span>
                            </div>
                            {m.icon}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Donut chart */}
                  <div>
                    <h2 className="mb-4 text-base font-semibold text-foreground">
                      Распределение по сегментам
                    </h2>
                    {donutData.length > 0 ? (
                      <div className="flex items-center gap-6">
                        <PieChart width={160} height={160}>
                          <Pie
                            data={donutData}
                            cx={75}
                            cy={75}
                            innerRadius={50}
                            outerRadius={75}
                            dataKey="share"
                            paddingAngle={2}
                          >
                            {donutData.map((_, i) => (
                              <Cell
                                key={i}
                                fill={DONUT_COLORS[i % DONUT_COLORS.length]}
                              />
                            ))}
                          </Pie>
                        </PieChart>
                        <div className="min-w-0 flex-1 space-y-2">
                          {donutData.map((seg, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between gap-2"
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <div
                                  className="h-2 w-2 shrink-0 rounded-full"
                                  style={{
                                    background:
                                      DONUT_COLORS[i % DONUT_COLORS.length],
                                  }}
                                />
                                <span className="truncate text-sm text-foreground">
                                  {seg.name}
                                </span>
                              </div>
                              <span className="shrink-0 text-sm font-semibold text-foreground">
                                {seg.share}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Сгенерируйте сегменты для отображения распределения.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* СЕКЦИЯ 2 — Ключевые портреты */}
              {persona && persona.personas.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-foreground">
                      Ключевые портреты аудитории
                    </h2>
                    <button
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                      onClick={() => setActiveTab("personas")}
                    >
                      Все портреты <ChevronRight size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {persona.personas.slice(0, 4).map((p, i) => (
                      <div
                        key={i}
                        className="flex flex-col rounded-2xl border border-border p-4"
                      >
                        {/* Аватар + имя */}
                        <div className="mb-4 flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
                            <User size={20} className="text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {p.name}
                            </p>
                            {p.share != null && (
                              <p className="text-xs text-muted-foreground">
                                {p.share}% аудитории
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Демография */}
                        <div className="mb-4 space-y-1.5">
                          {(p.gender ?? p.age) && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <User size={12} className="shrink-0" />
                              <span>
                                {[p.gender, p.age]
                                  .filter((x): x is string => !!x)
                                  .join(", ")}
                              </span>
                            </div>
                          )}
                          {p.occupation && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Briefcase size={12} className="shrink-0" />
                              <span>{p.occupation}</span>
                            </div>
                          )}
                          {p.income && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <DollarSign size={12} className="shrink-0" />
                              <span>{p.income}</span>
                            </div>
                          )}
                        </div>

                        {/* Цели */}
                        {p.goals.length > 0 && (
                          <div className="mb-3">
                            <p className="mb-1 text-xs font-semibold text-foreground">
                              Цели
                            </p>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                              {p.goals[0]}
                            </p>
                          </div>
                        )}

                        {/* Боли */}
                        {p.pains.length > 0 && (
                          <div className="mb-4">
                            <p className="mb-1 text-xs font-semibold text-foreground">
                              Боли
                            </p>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                              {p.pains[0]}
                            </p>
                          </div>
                        )}

                        {/* Кнопка подробнее */}
                        <div className="mt-auto">
                          <button
                            className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted"
                            onClick={() => setActiveTab("personas")}
                          >
                            Подробнее <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* СЕКЦИЯ 3 — Потребности / Боли / Триггеры */}
              {segments && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Основные потребности */}
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <h3 className="mb-4 text-sm font-semibold text-foreground">
                      Основные потребности
                    </h3>
                    {segments.needs && segments.needs.length > 0 ? (
                      <div className="space-y-3">
                        {segments.needs.slice(0, 5).map((need, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="min-w-0 flex-1 text-xs text-foreground">
                              {need.label}
                            </span>
                            <div className="flex shrink-0 items-center gap-2">
                              <div className="h-1.5 w-20 rounded-full bg-border">
                                <div
                                  className="h-1.5 rounded-full bg-foreground"
                                  style={{ width: `${need.percent}%` }}
                                />
                              </div>
                              <span className="w-8 text-right text-xs font-medium text-foreground">
                                {need.percent}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Регенерируйте сегменты для получения данных.
                      </p>
                    )}
                  </div>

                  {/* Главные боли */}
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <h3 className="mb-4 text-sm font-semibold text-foreground">
                      Главные боли
                    </h3>
                    {segments.pains && segments.pains.length > 0 ? (
                      <div className="space-y-3">
                        {segments.pains.slice(0, 5).map((pain, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="min-w-0 flex-1 text-xs text-foreground">
                              {pain.label}
                            </span>
                            <div className="flex shrink-0 items-center gap-2">
                              <div className="h-1.5 w-20 rounded-full bg-border">
                                <div
                                  className="h-1.5 rounded-full bg-foreground"
                                  style={{ width: `${pain.percent}%` }}
                                />
                              </div>
                              <span className="w-8 text-right text-xs font-medium text-foreground">
                                {pain.percent}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Регенерируйте сегменты для получения данных.
                      </p>
                    )}
                  </div>

                  {/* Триггеры */}
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <h3 className="mb-4 text-sm font-semibold text-foreground">
                      Триггеры принятия решения
                    </h3>
                    {segments.triggers && segments.triggers.length > 0 ? (
                      <div className="space-y-3">
                        {segments.triggers.slice(0, 5).map((t, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="min-w-0 flex-1 text-xs text-foreground">
                              {t.label}
                            </span>
                            <div className="flex shrink-0 items-center gap-2">
                              <div className="h-1.5 w-20 rounded-full bg-border">
                                <div
                                  className="h-1.5 rounded-full bg-foreground"
                                  style={{ width: `${t.percent}%` }}
                                />
                              </div>
                              <span className="w-8 text-right text-xs font-medium text-foreground">
                                {t.percent}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Регенерируйте сегменты для получения данных.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ─── СЕГМЕНТЫ ─── */}
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
                  generate(
                    "segments",
                    runAudienceSegments,
                    true,
                    "Сегменты обновлены"
                  )
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
                  generate(
                    "segments",
                    runAudienceSegments,
                    false,
                    "Сегменты готовы"
                  )
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
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    {segments.summary}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {segments.segments.map((seg, i) => (
                  <SegmentCard key={i} segment={seg} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ─── ПОРТРЕТЫ ─── */}
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
                  generate(
                    "persona",
                    runBuyerPersona,
                    true,
                    "Персоны обновлены"
                  )
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
                  generate(
                    "persona",
                    runBuyerPersona,
                    false,
                    "Персоны готовы"
                  )
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

        {/* ─── JOBS TO BE DONE ─── */}
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

        {/* ─── БОЛИ И ПОТРЕБНОСТИ ─── */}
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
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                  <span className="mt-0.5 size-2 shrink-0 rounded-full bg-danger" />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{pain}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {pName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── ТРИГГЕРЫ ─── */}
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
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                  <span className="mt-0.5 size-2 shrink-0 rounded-full bg-success" />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{trigger}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {pName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── ИНСАЙТЫ ─── */}
        <TabsContent value="insights" className="mt-6">
          <div className="flex h-[40vh] items-center justify-center">
            <EmptyState
              icon={Zap}
              title="Инсайты скоро появятся"
              description="Раздел в разработке — здесь будут автоматические инсайты на основе всех данных аудитории."
            />
          </div>
        </TabsContent>

        {/* ─── CJM ─── */}
        <TabsContent value="cjm" className="mt-6">
          <JourneyView
            projectId={projectId}
            cjm={cjm}
            version={cjmVersion}
            cjmCreatedAt={cjmCreatedAt}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
