import { z } from "zod"

export const severityEnum = z.enum(["low", "medium", "high"])
export type Severity = z.infer<typeof severityEnum>

export const recommendationSchema = z.object({
  title: z.string().describe("Краткий заголовок рекомендации"),
  body: z.string().describe("Развёрнутое описание рекомендации и шагов"),
  severity: severityEnum.describe(
    "Приоритет: low — желательно, medium — важно, high — критично"
  ),
})

export const companyAnalysisSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(100)
    .describe("Общая маркетинговая оценка компании от 0 до 100"),
  level: z
    .string()
    .describe(
      "Текстовый уровень зрелости, например: «Начальный», «Развивающийся», «Сильный», «Лидер»"
    ),
  summary: z
    .string()
    .describe("Резюме анализа на 2-4 предложения"),
  strengths: z.array(z.string()).describe("Сильные стороны бизнеса"),
  weaknesses: z.array(z.string()).describe("Слабые стороны бизнеса"),
  opportunities: z.array(z.string()).describe("Возможности на рынке"),
  threats: z.array(z.string()).describe("Угрозы и риски"),
  positioning: z
    .string()
    .describe("Анализ текущего позиционирования и рекомендуемое позиционирование"),
  growthPoints: z
    .array(z.string())
    .describe("Конкретные точки роста для бизнеса"),
  recommendations: z
    .array(recommendationSchema)
    .describe("Приоритизированные рекомендации AI"),
})

export type CompanyAnalysis = z.infer<typeof companyAnalysisSchema>
