"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { connectYandexMetrikaSchema } from "@/lib/validations/yandex-metrika"
import { encryptToken } from "@/lib/security/token-crypto"
import { syncYandexMetrika, testMetrikaConnection } from "@/lib/services/yandex-metrika.service"

type ActionResult<T = null> = { success: true; data: T } | { success: false; error: string }

export type YandexMetrikaIntegrationItem = {
  id: string
  counterId: string
  isActive: boolean
  lastSyncAt: string | null
  syncError: string | null
}

function toItem(i: {
  id: string
  counterId: string
  isActive: boolean
  lastSyncAt: Date | null
  syncError: string | null
}): YandexMetrikaIntegrationItem {
  return {
    id: i.id,
    counterId: i.counterId,
    isActive: i.isActive,
    lastSyncAt: i.lastSyncAt ? i.lastSyncAt.toISOString() : null,
    syncError: i.syncError,
  }
}

async function ownedProject(projectId: string) {
  const session = await auth()
  if (!session?.user?.id) return null
  return prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  })
}

export async function getYandexMetrikaIntegration(
  projectId: string
): Promise<YandexMetrikaIntegrationItem | null> {
  const project = await ownedProject(projectId)
  if (!project) return null

  const integration = await prisma.yandexMetrikaIntegration.findUnique({
    where: { projectId },
  })
  return integration ? toItem(integration) : null
}

export async function saveYandexMetrikaIntegration(
  raw: unknown
): Promise<ActionResult<YandexMetrikaIntegrationItem>> {
  const parsed = connectYandexMetrikaSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Неверные данные" }
  }
  const { projectId, counterId, accessToken } = parsed.data

  const project = await ownedProject(projectId)
  if (!project) return { success: false, error: "Нет доступа" }

  try {
    await testMetrikaConnection(counterId, accessToken)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка"
    return { success: false, error: `Не удалось подключиться: ${message}` }
  }

  const integration = await prisma.yandexMetrikaIntegration.upsert({
    where: { projectId },
    create: {
      projectId,
      counterId,
      accessToken: encryptToken(accessToken),
    },
    update: {
      counterId,
      accessToken: encryptToken(accessToken),
      isActive: true,
      syncError: null,
    },
  })

  revalidatePath("/settings")
  revalidatePath("/analytics")
  return { success: true, data: toItem(integration) }
}

export async function syncNow(projectId: string): Promise<ActionResult<{ synced: number }>> {
  const project = await ownedProject(projectId)
  if (!project) return { success: false, error: "Нет доступа" }

  const integration = await prisma.yandexMetrikaIntegration.findUnique({
    where: { projectId },
  })
  if (!integration) return { success: false, error: "Интеграция не найдена" }

  try {
    const result = await syncYandexMetrika(integration)
    revalidatePath("/settings")
    revalidatePath("/analytics")
    return { success: true, data: result }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка"
    await prisma.yandexMetrikaIntegration.update({
      where: { id: integration.id },
      data: { syncError: message },
    })
    revalidatePath("/settings")
    return { success: false, error: message }
  }
}

export async function removeYandexMetrikaIntegration(projectId: string): Promise<ActionResult> {
  const project = await ownedProject(projectId)
  if (!project) return { success: false, error: "Нет доступа" }

  await prisma.yandexMetrikaIntegration.deleteMany({ where: { projectId } })
  revalidatePath("/settings")
  revalidatePath("/analytics")
  return { success: true, data: null }
}
