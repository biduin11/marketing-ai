"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { listProjectMetrics } from "@/lib/services/metric.service"
import { createMetricSchema, updateMetricSchema } from "@/lib/validations/metric"

type ActionResult = { success: true } | { success: false; error: string }

async function ownedProject(projectId: string) {
  const session = await auth()
  if (!session?.user?.id) return null
  return prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  })
}

export async function createMetric(raw: unknown): Promise<ActionResult> {
  const parsed = createMetricSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Неверные данные" }
  }
  const { projectId, channel, date, ...values } = parsed.data

  const project = await ownedProject(projectId)
  if (!project) return { success: false, error: "Нет доступа" }

  try {
    await prisma.metric.upsert({
      where: { projectId_channel_date: { projectId, channel, date: new Date(date) } },
      create: { projectId, channel, date: new Date(date), ...values },
      update: values,
    })
    revalidatePath("/analytics")
    return { success: true }
  } catch {
    return { success: false, error: "Не удалось сохранить метрику" }
  }
}

export async function updateMetric(
  id: string,
  raw: unknown
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Не авторизован" }

  const parsed = updateMetricSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Неверные данные" }
  }

  const existing = await prisma.metric.findFirst({
    where: { id },
    include: { project: { select: { userId: true } } },
  })
  if (!existing || existing.project.userId !== session.user.id) {
    return { success: false, error: "Нет доступа" }
  }

  try {
    const { date, ...rest } = parsed.data
    await prisma.metric.update({
      where: { id },
      data: { ...rest, ...(date ? { date: new Date(date) } : {}) },
    })
    revalidatePath("/analytics")
    return { success: true }
  } catch {
    return { success: false, error: "Не удалось обновить метрику" }
  }
}

export async function deleteMetric(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Не авторизован" }

  const existing = await prisma.metric.findFirst({
    where: { id },
    include: { project: { select: { userId: true } } },
  })
  if (!existing || existing.project.userId !== session.user.id) {
    return { success: false, error: "Нет доступа" }
  }

  try {
    await prisma.metric.delete({ where: { id } })
    revalidatePath("/analytics")
    return { success: true }
  } catch {
    return { success: false, error: "Не удалось удалить метрику" }
  }
}

export async function listMetrics(projectId: string) {
  const session = await auth()
  if (!session?.user?.id) return []

  const project = await ownedProject(projectId)
  if (!project) return []

  return listProjectMetrics(projectId)
}
