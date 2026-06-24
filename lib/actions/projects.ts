"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createProjectSchema } from "@/lib/validations/project"
import type { CreateProjectInput } from "@/lib/validations/project"

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function createProject(
  input: CreateProjectInput
): Promise<ActionResult<{ id: string; name: string }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Нет доступа" }
  }

  const parsed = createProjectSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: "Ошибка валидации" }
  }

  const { name, niche, website, goals } = parsed.data

  try {
    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        name,
        niche: niche ?? null,
        website: website || null,
        goals: goals ?? null,
      },
    })

    revalidatePath("/", "layout")
    return { success: true, data: { id: project.id, name: project.name } }
  } catch {
    return { success: false, error: "Не удалось создать проект" }
  }
}

export async function listProjects() {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.project.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      niche: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getProject(projectId: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  return prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  })
}
