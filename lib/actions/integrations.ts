"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { encrypt } from "@/lib/crypto"
import { syncAllIntegrations } from "@/lib/services/sync.service"
import type { Platform } from "@prisma/client"

type ActionResult =
  | { success: true }
  | { success: false; error: string }

export interface IntegrationListItem {
  id: string
  platform: Platform
  accountId: string | null
  accountName: string | null
  isActive: boolean
  lastSyncAt: string | null
  hasToken: boolean
}

async function ownedProject(projectId: string): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.id) return false
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  })
  return !!project
}

const saveSchema = z.object({
  projectId: z.string().min(1),
  platform: z.enum(["YANDEX_MAPS", "TWOGIS", "AVITO", "VK", "TELEGRAM"]),
  accountId: z.string().trim().min(1, "Укажите ID аккаунта"),
  accountName: z.string().trim().optional(),
  accessToken: z.string().trim().optional(),
  isActive: z.boolean().optional(),
})

export async function saveIntegration(
  input: z.input<typeof saveSchema>
): Promise<ActionResult> {
  const parsed = saveSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" }
  }
  const { projectId, platform, accountId, accountName, accessToken, isActive } = parsed.data

  if (!(await ownedProject(projectId))) {
    return { success: false, error: "Нет доступа к проекту" }
  }

  // Only re-encrypt the token when a new one is provided; keep the existing
  // encrypted token when the field is left blank on edit.
  const encryptedToken =
    accessToken && accessToken.length > 0 ? encrypt(accessToken) : undefined

  try {
    await prisma.integration.upsert({
      where: { projectId_platform: { projectId, platform } },
      create: {
        projectId,
        platform,
        accountId,
        accountName: accountName || null,
        accessToken: encryptedToken ?? null,
        isActive: isActive ?? true,
      },
      update: {
        accountId,
        accountName: accountName || null,
        ...(encryptedToken ? { accessToken: encryptedToken } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    })
  } catch {
    return { success: false, error: "Не удалось сохранить интеграцию" }
  }

  revalidatePath("/settings")
  revalidatePath("/reputation")
  return { success: true }
}

export async function deleteIntegration(
  integrationId: string
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Требуется вход" }

  const integration = await prisma.integration.findFirst({
    where: { id: integrationId, project: { userId: session.user.id } },
    select: { id: true },
  })
  if (!integration) return { success: false, error: "Интеграция не найдена" }

  await prisma.integration.delete({ where: { id: integrationId } })
  revalidatePath("/settings")
  revalidatePath("/reputation")
  return { success: true }
}

export async function listIntegrations(
  projectId: string
): Promise<IntegrationListItem[]> {
  if (!(await ownedProject(projectId))) return []

  const integrations = await prisma.integration.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  })

  return integrations.map((i) => ({
    id: i.id,
    platform: i.platform,
    accountId: i.accountId,
    accountName: i.accountName,
    isActive: i.isActive,
    lastSyncAt: i.lastSyncAt?.toISOString() ?? null,
    hasToken: !!i.accessToken,
  }))
}

export async function triggerSync(projectId: string): Promise<ActionResult> {
  if (!(await ownedProject(projectId))) {
    return { success: false, error: "Нет доступа к проекту" }
  }
  try {
    await syncAllIntegrations(projectId)
  } catch {
    return { success: false, error: "Синхронизация завершилась с ошибкой" }
  }
  revalidatePath("/reputation")
  return { success: true }
}
