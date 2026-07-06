import { Building2 } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { CompanyView } from "@/components/company/company-view"
import { getProject } from "@/lib/actions/projects"
import { getActiveProjectId } from "@/lib/actions/active-project"
import { getLatestArtifact } from "@/lib/services/artifacts"
import { companyAnalysisSchema } from "@/lib/ai/schemas/companyAnalysis"
import type { CompanyAnalysis } from "@/lib/ai/schemas/companyAnalysis"
import { marketAnalysisSchema } from "@/lib/ai/schemas/market"
import type { MarketAnalysis } from "@/lib/ai/schemas/market"
import { productAnalysisSchema } from "@/lib/ai/schemas/product"
import type { ProductAnalysis } from "@/lib/ai/schemas/product"

export default async function CompanyPage() {
  const projectId = await getActiveProjectId()

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={Building2}
          title="Нет активного проекта"
          description="Создайте или выберите проект, чтобы провести анализ компании."
        />
      </div>
    )
  }

  const project = await getProject(projectId)
  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={Building2}
          title="Проект не найден"
          description="Выберите другой проект в переключателе."
        />
      </div>
    )
  }

  const [artifact, marketArtifact, productArtifact] = await Promise.all([
    getLatestArtifact(project.id, "COMPANY_ANALYSIS"),
    getLatestArtifact(project.id, "MARKET_ANALYSIS"),
    getLatestArtifact(project.id, "PRODUCT_ANALYSIS"),
  ])

  let analysis: CompanyAnalysis | null = null
  if (artifact) {
    const parsed = companyAnalysisSchema.safeParse(artifact.payload)
    if (parsed.success) analysis = parsed.data
  }

  let marketAnalysis: MarketAnalysis | null = null
  if (marketArtifact) {
    const parsed = marketAnalysisSchema.safeParse(marketArtifact.payload)
    if (parsed.success) marketAnalysis = parsed.data
  }

  let productAnalysis: ProductAnalysis | null = null
  if (productArtifact) {
    const parsed = productAnalysisSchema.safeParse(productArtifact.payload)
    if (parsed.success) productAnalysis = parsed.data
  }

  return (
    <CompanyView
      project={project}
      analysis={analysis}
      version={artifact?.version ?? null}
      marketAnalysis={marketAnalysis}
      marketVersion={marketArtifact?.version ?? null}
      marketGeneratedAt={marketArtifact?.createdAt.toISOString() ?? null}
      productAnalysis={productAnalysis}
      productVersion={productArtifact?.version ?? null}
      productGeneratedAt={productArtifact?.createdAt.toISOString() ?? null}
    />
  )
}
