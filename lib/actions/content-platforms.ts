"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export type ContentPlatformItem = {
  id: string
  name: string
  share: number | null
}

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

const shareSchema = z
  .number()
  .int()
  .min(0)
  .max(100)
  .nullable()
  .optional()

async function assertOwner(projectId: string, userId: string): Promise<boolean> {
  const owned = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  })
  return !!owned
}

export async function getContentPlatforms(
  projectId: string
): Promise<ContentPlatformItem[]> {
  const session = await auth()
  if (!session?.user?.id) return []
  if (!(await assertOwner(projectId, session.user.id))) return []

  const platforms = await prisma.contentPlatform.findMany({
    where: { projectId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  })
  return platforms.map((p) => ({ id: p.id, name: p.name, share: p.share }))
}

const addSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1).max(60),
  share: shareSchema,
})

export async function addContentPlatform(
  input: z.infer<typeof addSchema>
): Promise<ActionResult<ContentPlatformItem>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Нет доступа" }

  const parsed = addSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: "Ошибка валидации" }

  const { projectId, name, share } = parsed.data
  if (!(await assertOwner(projectId, session.user.id)))
    return { success: false, error: "Проект не найден" }

  const count = await prisma.contentPlatform.count({ where: { projectId } })

  try {
    const platform = await prisma.contentPlatform.create({
      data: {
        projectId,
        name: name.trim(),
        share: share ?? null,
        order: count,
      },
    })
    revalidatePath("/content")
    return {
      success: true,
      data: { id: platform.id, name: platform.name, share: platform.share },
    }
  } catch {
    return { success: false, error: "Такая площадка уже добавлена" }
  }
}

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(60),
  share: shareSchema,
})

export async function updateContentPlatform(
  input: z.infer<typeof updateSchema>
): Promise<ActionResult<ContentPlatformItem>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Нет доступа" }

  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: "Ошибка валидации" }

  const { id, name, share } = parsed.data

  const existing = await prisma.contentPlatform.findFirst({
    where: { id, project: { userId: session.user.id } },
    select: { id: true },
  })
  if (!existing) return { success: false, error: "Площадка не найдена" }

  try {
    const platform = await prisma.contentPlatform.update({
      where: { id },
      data: { name: name.trim(), share: share ?? null },
    })
    revalidatePath("/content")
    return {
      success: true,
      data: { id: platform.id, name: platform.name, share: platform.share },
    }
  } catch {
    return { success: false, error: "Такая площадка уже добавлена" }
  }
}

export async function deleteContentPlatform(
  id: string
): Promise<ActionResult<null>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Нет доступа" }

  const platform = await prisma.contentPlatform.findFirst({
    where: { id, project: { userId: session.user.id } },
    select: { id: true },
  })
  if (!platform) return { success: false, error: "Площадка не найдена" }

  await prisma.contentPlatform.delete({ where: { id } })
  revalidatePath("/content")
  return { success: true, data: null }
}
