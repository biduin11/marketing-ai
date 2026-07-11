"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import type { HypothesisStatus, HypothesisResult } from "@prisma/client"

export type HypothesisItem = {
  id: string
  title: string
  description: string | null
  channel: string
  budget: number | null
  status: HypothesisStatus
  startDate: string | null
  endDate: string | null
  result: string | null
  roi: number | null
  conclusion: HypothesisResult | null
  tags: string[]
  createdAt: string
}

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

function toItem(h: {
  id: string
  title: string
  description: string | null
  channel: string
  budget: number | null
  status: HypothesisStatus
  startDate: Date | null
  endDate: Date | null
  result: string | null
  roi: number | null
  conclusion: HypothesisResult | null
  tags: string[]
  createdAt: Date
}): HypothesisItem {
  return {
    id: h.id,
    title: h.title,
    description: h.description,
    channel: h.channel,
    budget: h.budget,
    status: h.status,
    startDate: h.startDate ? h.startDate.toISOString().slice(0, 10) : null,
    endDate: h.endDate ? h.endDate.toISOString().slice(0, 10) : null,
    result: h.result,
    roi: h.roi,
    conclusion: h.conclusion,
    tags: h.tags,
    createdAt: h.createdAt.toISOString(),
  }
}

export async function getHypotheses(projectId: string): Promise<HypothesisItem[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  })
  if (!project) return []

  const hypotheses = await prisma.hypothesis.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  })
  return hypotheses.map(toItem)
}

const createSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  channel: z.string().min(1).max(100),
  budget: z.number().int().min(0).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
})

export async function createHypothesis(
  input: z.infer<typeof createSchema>
): Promise<ActionResult<HypothesisItem>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Нет доступа" }

  const parsed = createSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: "Ошибка валидации" }

  const { projectId, title, description, channel, budget, startDate, endDate, tags } = parsed.data
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  })
  if (!project) return { success: false, error: "Проект не найден" }

  const hypothesis = await prisma.hypothesis.create({
    data: {
      projectId,
      title: title.trim(),
      description: description?.trim() || null,
      channel: channel.trim(),
      budget: budget ?? null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      tags: tags ?? [],
    },
  })
  revalidatePath("/hypotheses")
  return { success: true, data: toItem(hypothesis) }
}

const statusSchema = z.enum(["DRAFT", "RUNNING", "COMPLETED", "ARCHIVED"])

export async function updateHypothesisStatus(
  id: string,
  status: z.infer<typeof statusSchema>
): Promise<ActionResult<HypothesisItem>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Нет доступа" }

  const parsedStatus = statusSchema.safeParse(status)
  if (!parsedStatus.success) return { success: false, error: "Неверный статус" }

  const hypothesis = await prisma.hypothesis.findFirst({
    where: { id, project: { userId: session.user.id } },
    select: { id: true },
  })
  if (!hypothesis) return { success: false, error: "Гипотеза не найдена" }

  const updated = await prisma.hypothesis.update({
    where: { id },
    data: { status: parsedStatus.data },
  })
  revalidatePath("/hypotheses")
  return { success: true, data: toItem(updated) }
}

const completeSchema = z.object({
  result: z.string().min(1).max(2000),
  roi: z.number().optional(),
  conclusion: z.enum(["CONFIRMED", "REJECTED", "INCONCLUSIVE"]),
})

export async function completeHypothesis(
  id: string,
  input: z.infer<typeof completeSchema>
): Promise<ActionResult<HypothesisItem>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Нет доступа" }

  const parsed = completeSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: "Ошибка валидации" }

  const hypothesis = await prisma.hypothesis.findFirst({
    where: { id, project: { userId: session.user.id } },
    select: { id: true },
  })
  if (!hypothesis) return { success: false, error: "Гипотеза не найдена" }

  const updated = await prisma.hypothesis.update({
    where: { id },
    data: {
      status: "COMPLETED",
      result: parsed.data.result.trim(),
      roi: parsed.data.roi ?? null,
      conclusion: parsed.data.conclusion,
    },
  })
  revalidatePath("/hypotheses")
  return { success: true, data: toItem(updated) }
}

export async function deleteHypothesis(id: string): Promise<ActionResult<null>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Нет доступа" }

  const hypothesis = await prisma.hypothesis.findFirst({
    where: { id, project: { userId: session.user.id } },
    select: { id: true },
  })
  if (!hypothesis) return { success: false, error: "Гипотеза не найдена" }

  await prisma.hypothesis.delete({ where: { id } })
  revalidatePath("/hypotheses")
  return { success: true, data: null }
}
