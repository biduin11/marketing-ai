"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { generateCompanyAnalysis } from "@/lib/services/company.service"
import { generateStrategy } from "@/lib/services/strategy.service"
import {
  generateAudienceSegments,
  generateBuyerPersona,
  generateJtbd,
} from "@/lib/services/audience.service"
import { generateCompetitorAnalysis } from "@/lib/services/competitor.service"
import { generateOffer } from "@/lib/services/offer.service"
import { generateCjm } from "@/lib/services/cjm.service"
import { generateContentPlan } from "@/lib/services/contentPlan.service"
import { generateExecutiveReport } from "@/lib/services/report.service"
import { listMetrics } from "@/lib/actions/metrics"
import { filterByRange } from "@/lib/services/analytics.service"
import { horizonInputSchema } from "@/lib/validations/ai"
import { z } from "zod"
import type { Horizon } from "@/lib/ai/schemas/strategy"

const reportInputSchema = z.object({
  type: z.enum(["REPORT_WEEKLY", "REPORT_MONTHLY", "REPORT_QUARTERLY"]),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period: z.string().min(1),
})

type ActionResult =
  | { success: true }
  | { success: false; error: string }

async function ownedProject(projectId: string) {
  const session = await auth()
  if (!session?.user?.id) return null
  return prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  })
}

export async function runCompanyAnalysis(
  projectId: string,
  force = false
): Promise<ActionResult> {
  const project = await ownedProject(projectId)
  if (!project) return { success: false, error: "Нет доступа" }

  try {
    await generateCompanyAnalysis(project, { force })
    revalidatePath("/company")
    return { success: true }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось сгенерировать анализ"
    return { success: false, error: message }
  }
}

export async function runStrategy(
  projectId: string,
  horizon: Horizon,
  force = false
): Promise<ActionResult> {
  const parsedHorizon = horizonInputSchema.safeParse(horizon)
  if (!parsedHorizon.success) {
    return { success: false, error: "Неверный горизонт планирования" }
  }

  const project = await ownedProject(projectId)
  if (!project) return { success: false, error: "Нет доступа" }

  try {
    await generateStrategy(project, parsedHorizon.data, { force })
    revalidatePath("/strategy")
    return { success: true }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось сгенерировать стратегию"
    return { success: false, error: message }
  }
}

export async function runAudienceSegments(
  projectId: string,
  force = false
): Promise<ActionResult> {
  const project = await ownedProject(projectId)
  if (!project) return { success: false, error: "Нет доступа" }

  try {
    await generateAudienceSegments(project, { force })
    revalidatePath("/audience")
    return { success: true }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось сгенерировать сегменты"
    return { success: false, error: message }
  }
}

export async function runBuyerPersona(
  projectId: string,
  force = false
): Promise<ActionResult> {
  const project = await ownedProject(projectId)
  if (!project) return { success: false, error: "Нет доступа" }

  try {
    await generateBuyerPersona(project, { force })
    revalidatePath("/audience")
    return { success: true }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось сгенерировать персоны"
    return { success: false, error: message }
  }
}

export async function runJtbd(
  projectId: string,
  force = false
): Promise<ActionResult> {
  const project = await ownedProject(projectId)
  if (!project) return { success: false, error: "Нет доступа" }

  try {
    await generateJtbd(project, { force })
    revalidatePath("/audience")
    return { success: true }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось сгенерировать JTBD"
    return { success: false, error: message }
  }
}

export async function runCompetitorAnalysis(
  projectId: string,
  force = false
): Promise<ActionResult> {
  const project = await ownedProject(projectId)
  if (!project) return { success: false, error: "Нет доступа" }

  try {
    await generateCompetitorAnalysis(project, { force })
    revalidatePath("/competitors")
    return { success: true }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось сгенерировать анализ конкурентов"
    return { success: false, error: message }
  }
}

export async function runOffer(
  projectId: string,
  force = false
): Promise<ActionResult> {
  const project = await ownedProject(projectId)
  if (!project) return { success: false, error: "Нет доступа" }

  try {
    await generateOffer(project, { force })
    revalidatePath("/offers")
    return { success: true }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось сгенерировать офферы"
    return { success: false, error: message }
  }
}

export async function runCjm(
  projectId: string,
  force = false
): Promise<ActionResult> {
  const project = await ownedProject(projectId)
  if (!project) return { success: false, error: "Нет доступа" }

  try {
    await generateCjm(project, { force })
    revalidatePath("/journey")
    return { success: true }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось сгенерировать CJM"
    return { success: false, error: message }
  }
}

export async function runContentPlan(
  projectId: string,
  force = false
): Promise<ActionResult> {
  const project = await ownedProject(projectId)
  if (!project) return { success: false, error: "Нет доступа" }

  try {
    await generateContentPlan(project, { force })
    revalidatePath("/content")
    return { success: true }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось сгенерировать контент-план"
    return { success: false, error: message }
  }
}

export async function runReport(
  projectId: string,
  raw: unknown,
  force = false
): Promise<ActionResult> {
  const parsed = reportInputSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: "Неверные параметры отчёта" }
  }

  const project = await ownedProject(projectId)
  if (!project) return { success: false, error: "Нет доступа" }

  try {
    const allMetrics = await listMetrics(projectId)
    const from = new Date(parsed.data.from)
    const to = new Date(parsed.data.to)
    const metrics = filterByRange(allMetrics, from, to)

    await generateExecutiveReport(
      project,
      parsed.data.type,
      metrics,
      parsed.data.period,
      { force }
    )
    revalidatePath("/reports")
    return { success: true }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось сгенерировать отчёт"
    return { success: false, error: message }
  }
}
