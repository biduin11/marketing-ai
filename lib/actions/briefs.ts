"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canGenerateAi } from "@/lib/gates"
import { generateBriefContent } from "@/lib/services/brief.service"
import { psychotypeKeys, type PsychotypeKey } from "@/lib/ai/schemas/psychotypes"
import type { BriefType, Prisma } from "@prisma/client"
import type { BriefContent } from "@/lib/ai/schemas/brief"

export type BriefItem = {
  id: string
  type: BriefType
  title: string
  content: BriefContent
  createdAt: string
}

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

function toItem(brief: {
  id: string
  type: BriefType
  title: string
  content: unknown
  createdAt: Date
}): BriefItem {
  return {
    id: brief.id,
    type: brief.type,
    title: brief.title,
    content: brief.content as BriefContent,
    createdAt: brief.createdAt.toISOString(),
  }
}

export async function getBriefs(projectId: string): Promise<BriefItem[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  })
  if (!project) return []

  const briefs = await prisma.brief.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  })
  return briefs.map(toItem)
}

const generateSchema = z.object({
  projectId: z.string().min(1),
  type: z.enum([
    "VIDEO",
    "DESIGN_POST",
    "DESIGN_STORY",
    "LANDING",
    "PHOTO",
    "COPYWRITING",
  ]),
  task: z.string().min(1).max(1000),
  psychotype: z.enum(psychotypeKeys),
})

export async function generateBrief(
  projectId: string,
  type: BriefType,
  task: string,
  psychotype: PsychotypeKey
): Promise<ActionResult<BriefItem>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Нет доступа" }

  const parsed = generateSchema.safeParse({ projectId, type, task, psychotype })
  if (!parsed.success) return { success: false, error: "Ошибка валидации" }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  })
  if (!project) return { success: false, error: "Проект не найден" }

  const gate = await canGenerateAi(session.user.id)
  if (!gate.allowed) {
    return { success: false, error: gate.reason ?? "Лимит генераций исчерпан" }
  }

  try {
    const { content } = await generateBriefContent(
      project,
      parsed.data.type,
      parsed.data.task,
      parsed.data.psychotype
    )

    const brief = await prisma.brief.create({
      data: {
        projectId,
        type: parsed.data.type,
        title: content.title,
        content: content as Prisma.InputJsonValue,
      },
    })
    revalidatePath("/briefs")
    return { success: true, data: toItem(brief) }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось сгенерировать бриф"
    return { success: false, error: message }
  }
}

export async function deleteBrief(id: string): Promise<ActionResult<null>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Нет доступа" }

  const brief = await prisma.brief.findFirst({
    where: { id, project: { userId: session.user.id } },
    select: { id: true },
  })
  if (!brief) return { success: false, error: "Бриф не найден" }

  await prisma.brief.delete({ where: { id } })
  revalidatePath("/briefs")
  return { success: true, data: null }
}
