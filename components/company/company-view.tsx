"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Sparkles,
  RefreshCw,
  Download,
  Loader2,
  TrendingUp,
  CheckCircle2,
} from "lucide-react"
import type { Project } from "@prisma/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { ScoreCard } from "@/components/shared/score-card"
import { RecommendationCard } from "@/components/company/recommendation-card"
import { CompanyWizard } from "@/components/company/company-wizard"
import { runCompanyAnalysis } from "@/lib/actions/ai"
import type { CompanyAnalysis } from "@/lib/ai/schemas/companyAnalysis"
import { GenerationProgress } from "@/components/shared/generation-progress"

const COMPANY_STEPS = [
  { id: "fetch", label: "Собираю данные компании" },
  { id: "analyze", label: "Анализирую рынок и конкурентов" },
  { id: "swot", label: "Строю SWOT и позиционирование" },
  { id: "score", label: "Вычисляю маркетинговый скор" },
  { id: "save", label: "Сохраняю результат" },
]

interface CompanyViewProps {
  project: Project
  analysis: CompanyAnalysis | null
  version: number | null
}

function ListBlock({ items }: { items: string[] }) {
  if (items.length === 0)
    return <p className="text-sm text-muted-foreground">Нет данных</p>
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm text-foreground">
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
          {item}
        </li>
      ))}
    </ul>
  )
}

function Card({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="mb-3 text-sm font-medium text-foreground">{title}</h3>
      {children}
    </div>
  )
}

export function CompanyView({ project, analysis, version }: CompanyViewProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [genCompleted, setGenCompleted] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)

  async function generate(force: boolean) {
    setLoading(true)
    setGenCompleted(false)
    setGenError(null)
    try {
      const result = await runCompanyAnalysis(project.id, force)
      if (!result.success) {
        setGenError(result.error)
        toast.error(result.error)
        return
      }
      setGenCompleted(true)
      toast.success(force ? "Анализ обновлён" : "Анализ готов")
      setTimeout(() => router.refresh(), 600)
    } catch {
      const msg = "Не удалось сгенерировать анализ"
      setGenError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Анализ компании
          </h2>
          <p className="text-sm text-muted-foreground">
            {project.name}
            {version !== null && (
              <span className="ml-2 text-xs">· версия {version}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CompanyWizard project={project} />
          {analysis ? (
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
              Сгенерировать анализ
            </Button>
          )}
        </div>
      </div>

      {/* Generation progress */}
      {loading && (
        <GenerationProgress
          steps={COMPANY_STEPS}
          completed={genCompleted}
          error={genError}
        />
      )}

      {/* Empty state */}
      {!loading && !analysis && (
        <div className="flex h-[50vh] items-center justify-center">
          <EmptyState
            icon={Sparkles}
            title="Анализ ещё не сгенерирован"
            description="Заполните карточку компании и нажмите «Сгенерировать анализ», чтобы AI построил скоркарту, SWOT и рекомендации."
          />
        </div>
      )}

      {!loading && analysis && (
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="swot">SWOT</TabsTrigger>
            <TabsTrigger value="positioning">Позиционирование</TabsTrigger>
            <TabsTrigger value="product">Продукт</TabsTrigger>
            <TabsTrigger value="market">Рынок</TabsTrigger>
            <TabsTrigger value="audit">Аудит</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              <ScoreCard score={analysis.score} level={analysis.level} />
              <div className="space-y-6">
                <Card title="Резюме">
                  <p className="text-sm text-muted-foreground">
                    {analysis.summary}
                  </p>
                </Card>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toast.info("Экспорт отчёта будет доступен в Итерации 4")
                    }
                  >
                    <Download className="size-3.5" />
                    Скачать отчёт
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card title="Сильные стороны">
                <ListBlock items={analysis.strengths} />
              </Card>
              <Card title="Точки роста">
                <ul className="space-y-2">
                  {analysis.growthPoints.map((p, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-sm text-foreground"
                    >
                      <TrendingUp className="mt-0.5 size-4 shrink-0 text-success" />
                      {p}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </TabsContent>

          {/* SWOT */}
          <TabsContent value="swot" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card title="Сильные стороны (S)">
                <ListBlock items={analysis.strengths} />
              </Card>
              <Card title="Слабые стороны (W)">
                <ListBlock items={analysis.weaknesses} />
              </Card>
              <Card title="Возможности (O)">
                <ListBlock items={analysis.opportunities} />
              </Card>
              <Card title="Угрозы (T)">
                <ListBlock items={analysis.threats} />
              </Card>
            </div>
          </TabsContent>

          {/* Positioning */}
          <TabsContent value="positioning" className="mt-6">
            <Card title="Позиционирование">
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {analysis.positioning}
              </p>
            </Card>
          </TabsContent>

          {/* Product */}
          <TabsContent value="product" className="mt-6 space-y-6">
            <Card title="Продукты и услуги">
              <ListBlock items={project.products} />
            </Card>
            <Card title="Возможности для продукта">
              <ListBlock items={analysis.opportunities} />
            </Card>
          </TabsContent>

          {/* Market */}
          <TabsContent value="market" className="mt-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card title="Регионы">
                <ListBlock items={project.regions} />
              </Card>
              <Card title="Конкуренты">
                <ListBlock items={project.competitors} />
              </Card>
            </div>
            <Card title="Угрозы рынка">
              <ListBlock items={analysis.threats} />
            </Card>
          </TabsContent>

          {/* Audit (full recommendations) */}
          <TabsContent value="audit" className="mt-6 space-y-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <CheckCircle2 className="size-4" />
              Рекомендации AI
            </div>
            {analysis.recommendations.map((rec, i) => (
              <RecommendationCard
                key={i}
                title={rec.title}
                body={rec.body}
                severity={rec.severity}
              />
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
