"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { generateCompanyAnalysis } from "@/lib/services/company.service"
import { generateStrategy } from "@/lib/services/strategy.service"
import { horizonInputSchema } from "@/lib/validations/ai"
import type { Horizon } from "@/lib/ai/schemas/strategy"

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
