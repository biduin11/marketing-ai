"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canGenerateAi } from "@/lib/gates"
import { generateObjectionResponses } from "@/lib/services/objection.service"
import { psychotypeKeys, type PsychotypeKey } from "@/lib/ai/schemas/objections"

export type ObjectionResponseItem = {
  id: string
  psychotype: PsychotypeKey
  response: string
}

export type ObjectionItem = {
  id: string
  text: string
  category: string | null
  createdAt: string
  responses: ObjectionResponseItem[]
}

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

function toItem(
  objection: {
    id: string
    text: string
    category: string | null
    createdAt: Date
    responses: { id: string; psychotype: string; response: string }[]
  }
): ObjectionItem {
  return {
    id: objection.id,
    text: objection.text,
    category: objection.category,
    createdAt: objection.createdAt.toISOString(),
    responses: objection.responses.map((r) => ({
      id: r.id,
      psychotype: r.psychotype as PsychotypeKey,
      response: r.response,
    })),
  }
}

export async function getObjections(projectId: string): Promise<ObjectionItem[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  })
  if (!project) return []

  const objections = await prisma.objection.findMany({
    where: { projectId },
    include: { responses: true },
    orderBy: { createdAt: "desc" },
  })
  return objections.map(toItem)
}

const createSchema = z.object({
  projectId: z.string().min(1),
  text: z.string().min(1).max(500),
  category: z.string().max(50).optional(),
})

export async function createObjection(
  input: z.infer<typeof createSchema>
): Promise<ActionResult<ObjectionItem>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Нет доступа" }

  const parsed = createSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: "Ошибка валидации" }

  const { projectId, text, category } = parsed.data
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  })
  if (!project) return { success: false, error: "Проект не найден" }

  const objection = await prisma.objection.create({
    data: { projectId, text: text.trim(), category: category?.trim() || null },
    include: { responses: true },
  })
  revalidatePath("/objections")
  return { success: true, data: toItem(objection) }
}

export async function generateResponses(
  objectionId: string
): Promise<ActionResult<ObjectionItem>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Нет доступа" }

  const objection = await prisma.objection.findFirst({
    where: { id: objectionId, project: { userId: session.user.id } },
    include: { project: true },
  })
  if (!objection) return { success: false, error: "Возражение не найдено" }

  const gate = await canGenerateAi(session.user.id)
  if (!gate.allowed) {
    return { success: false, error: gate.reason ?? "Лимит генераций исчерпан" }
  }

  try {
    const { payload } = await generateObjectionResponses(objection.project, objection.text)

    const updated = await prisma.$transaction(async (tx) => {
      await tx.objectionResponse.deleteMany({ where: { objectionId } })
      await tx.objectionResponse.createMany({
        data: psychotypeKeys.map((key) => ({
          objectionId,
          psychotype: key,
          response: payload[key],
        })),
      })
      return tx.objection.findUniqueOrThrow({
        where: { id: objectionId },
        include: { responses: true },
      })
    })

    revalidatePath("/objections")
    return { success: true, data: toItem(updated) }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось сгенерировать ответы"
    return { success: false, error: message }
  }
}

export async function deleteObjection(id: string): Promise<ActionResult<null>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Нет доступа" }

  const objection = await prisma.objection.findFirst({
    where: { id, project: { userId: session.user.id } },
    select: { id: true },
  })
  if (!objection) return { success: false, error: "Возражение не найдено" }

  await prisma.objectionResponse.deleteMany({ where: { objectionId: id } })
  await prisma.objection.delete({ where: { id } })
  revalidatePath("/objections")
  return { success: true, data: null }
}
