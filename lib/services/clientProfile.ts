import type { CompanyAnalysis } from "@/lib/ai/schemas/companyAnalysis"
import type { BuyerPersona } from "@/lib/ai/schemas/audience"
import { getLatestArtifact } from "@/lib/services/artifacts"

const psychotypeLabels: Record<string, string> = {
  traditionalist: "Традиционалист",
  independent: "Независимый",
  aesthete: "Эстет",
  hedonist: "Гедонист",
}

/**
 * Собирает блок с реальным профилем клиента (позиционирование + ICP/buyer
 * personas) из последних артефактов COMPANY_ANALYSIS и BUYER_PERSONA —
 * подмешивается в system prompt AI-генераций, привязанных к проекту.
 */
export async function buildClientProfileBlock(projectId: string): Promise<string> {
  const [companyAnalysisArtifact, buyerPersonaArtifact] = await Promise.all([
    getLatestArtifact(projectId, "COMPANY_ANALYSIS"),
    getLatestArtifact(projectId, "BUYER_PERSONA"),
  ])

  const parts: string[] = []

  const positioning = (companyAnalysisArtifact?.payload as CompanyAnalysis | null)?.positioning
  if (positioning) {
    parts.push(`Позиционирование:\n${positioning}`)
  }

  const personas = (buyerPersonaArtifact?.payload as BuyerPersona | null)?.personas
  if (personas?.length) {
    const block = personas
      .map((p) => {
        const psychotype = p.psychotype ? psychotypeLabels[p.psychotype] : null
        return `- ${p.name} (${p.occupation}, ${p.age}${psychotype ? `, психотип: ${psychotype}` : ""}): цели — ${p.goals.join("; ")}; боли — ${p.pains.join("; ")}; триггеры покупки — ${p.triggers.join("; ")}`
      })
      .join("\n")
    parts.push(`ICP / Buyer Personas:\n${block}`)
  }

  if (!parts.length) return ""

  return `## Профиль клиента (ICP / позиционирование)\n\n${parts.join("\n\n")}`
}
