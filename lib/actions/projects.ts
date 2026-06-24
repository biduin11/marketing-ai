"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createProjectSchema, updateProjectSchema } from "@/lib/validations/project"
import type { CreateProjectInput, UpdateProjectInput } from "@/lib/validations/project"
import type { Prisma } from "@prisma/client"
import { canCreateProject } from "@/lib/gates"

export type ProjectListItem = Prisma.ProjectGetPayload<{
  select: {
    id: true
    name: true
    niche: true
    status: true
    createdAt: true
  }
}>

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

  const gate = await canCreateProject(session.user.id)
  if (!gate.allowed) {
    return { success: false, error: gate.reason ?? "Лимит проектов исчерпан" }
  }

  const parsed = createProjectSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: "Ошибка валидации" }
  }

  const { name, niche, website, goals, budget, competitors } = parsed.data

  try {
    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        name,
        niche: niche ?? null,
        website: website || null,
        goals: goals ?? null,
        budget: budget ?? null,
        competitors: competitors ?? [],
      },
    })

    revalidatePath("/", "layout")
    return { success: true, data: { id: project.id, name: project.name } }
  } catch {
    return { success: false, error: "Не удалось создать проект" }
  }
}

export async function listProjects(): Promise<ProjectListItem[]> {
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

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Нет доступа" }
  }

  const parsed = updateProjectSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: "Ошибка валидации" }
  }

  const owned = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  })
  if (!owned) {
    return { success: false, error: "Проект не найден" }
  }

  const { name, niche, website, goals, products, competitors, regions, budget, socials } =
    parsed.data

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        name,
        niche: niche || null,
        website: website || null,
        goals: goals || null,
        products,
        competitors,
        regions,
        budget,
        socials: socials ?? {},
        status: "ACTIVE",
      },
    })

    revalidatePath("/", "layout")
    return { success: true, data: { id: projectId } }
  } catch {
    return { success: false, error: "Не удалось сохранить карточку" }
  }
}
