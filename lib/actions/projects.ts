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

export async function deleteProject(
  projectId: string
): Promise<ActionResult<{ nextProjectId: string | null }>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Нет доступа" }

  const owned = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  })
  if (!owned) return { success: false, error: "Проект не найден" }

  const count = await prisma.project.count({ where: { userId: session.user.id } })
  if (count <= 1) {
    return {
      success: false,
      error: "Нельзя удалить единственный проект. Создайте новый перед удалением.",
    }
  }

  await prisma.$transaction([
    prisma.aiArtifact.deleteMany({ where: { projectId } }),
    prisma.metric.deleteMany({ where: { projectId } }),
    prisma.strategyTask.deleteMany({ where: { projectId } }),
    prisma.customChannel.deleteMany({ where: { projectId } }),
    prisma.project.delete({ where: { id: projectId } }),
  ])

  const next = await prisma.project.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  })

  revalidatePath("/", "layout")
  return { success: true, data: { nextProjectId: next?.id ?? null } }
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Нет доступа" }
  }

  console.log('updateProject RAW input socials:', JSON.stringify(input?.socials))
  const parsed = updateProjectSchema.safeParse(input)
  console.log('updateProject parse success:', parsed.success)
  if (!parsed.success) {
    console.log('updateProject parse errors:', JSON.stringify(parsed.error.errors))
    console.error("[updateProject] validation error", parsed.error.flatten())
    return { success: false, error: "Ошибка валидации" }
  }

  const owned = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  })
  if (!owned) {
    return { success: false, error: "Проект не найден" }
  }

  const {
    name, niche, website, goals, products, competitors, regions, budget, socials,
    industry, dealCycle, brandTone, brandWords,
    clientType, audienceSegments, clientValues, objections, clientLanguage,
    currentChannels, marketingGoal, socialLinks, proofFacts,
    margin, conversionRate, currentCpl, leadsPerMonth, salesPerMonth, avgCheck,
    competitorsDetailed, productsDetailed,
  } = parsed.data

  console.log('updateProject PARSED socials:', JSON.stringify(socials))
  console.log('updateProject received socialLinks:', socialLinks)

  // Keep competitors[] in sync with detailed list for AI prompts backward compat
  const competitorNames =
    competitorsDetailed && competitorsDetailed.length > 0
      ? competitorsDetailed.map((c) => c.name ?? "").filter(Boolean)
      : competitors

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        name,
        niche: niche || null,
        website: website || null,
        goals: goals || null,
        products,
        competitors: competitorNames,
        regions,
        budget: budget ?? null,
        socials: socials ?? {},
        status: "ACTIVE",
        industry: industry || null,
        dealCycle: dealCycle || null,
        brandTone: brandTone || null,
        brandWords: brandWords || null,
        clientType: clientType || null,
        audienceSegments: audienceSegments || null,
        clientValues: clientValues || null,
        objections: objections || null,
        clientLanguage: clientLanguage || null,
        currentChannels: currentChannels || null,
        marketingGoal: marketingGoal || null,
        socialLinks: socialLinks || null,
        proofFacts: proofFacts || null,
        margin: margin ?? null,
        conversionRate: conversionRate ?? null,
        currentCpl: currentCpl ?? null,
        leadsPerMonth: leadsPerMonth ?? null,
        salesPerMonth: salesPerMonth ?? null,
        avgCheck: avgCheck ?? null,
        competitorsDetailed: competitorsDetailed ?? undefined,
        productsDetailed: productsDetailed ?? undefined,
      },
    })

    revalidatePath("/", "layout")
    return { success: true, data: { id: projectId } }
  } catch {
    return { success: false, error: "Не удалось сохранить карточку" }
  }
}
