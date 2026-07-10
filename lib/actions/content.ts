"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getLatestArtifact } from "@/lib/services/artifacts"
import { contentPlanSchema, contentStatusEnum } from "@/lib/ai/schemas/contentPlan"

type ActionResult = { success: true } | { success: false; error: string }

const updateStatusSchema = z.object({
  projectId: z.string().min(1),
  itemIndex: z.number().int().min(0),
  status: contentStatusEnum,
})

/**
 * Calendar items live inside AiArtifact.payload (type CONTENT_PLAN) as one JSON
 * blob, not as their own DB rows — there is no ContentPost model. Persisting a
 * status change means patching calendar[itemIndex] in place and saving the
 * artifact back, rather than updating a row by id.
 */
export async function updateContentItemStatus(
  input: z.infer<typeof updateStatusSchema>
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Нет доступа" }

  const parsed = updateStatusSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: "Ошибка валидации" }
  const { projectId, itemIndex, status } = parsed.data

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  })
  if (!project) return { success: false, error: "Проект не найден" }

  const artifact = await getLatestArtifact(projectId, "CONTENT_PLAN")
  const plan = artifact ? contentPlanSchema.safeParse(artifact.payload) : null
  if (!artifact || !plan?.success) {
    return { success: false, error: "Контент-план не найден" }
  }

  if (itemIndex >= plan.data.calendar.length) {
    return { success: false, error: "Публикация не найдена" }
  }

  const calendar = plan.data.calendar.map((item, i) =>
    i === itemIndex ? { ...item, status } : item
  )

  await prisma.aiArtifact.update({
    where: { id: artifact.id },
    data: { payload: { ...plan.data, calendar } },
  })

  revalidatePath("/content")
  return { success: true }
}
