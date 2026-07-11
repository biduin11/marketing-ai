"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canGenerateAi } from "@/lib/gates"
import {
  getLatestPlatformUtp,
  generatePlatformUtp,
} from "@/lib/services/platform-utp.service"
import {
  platformUtpSchema,
  platformKeys,
  type PlatformKey,
  type PlatformUtp,
} from "@/lib/ai/schemas/platform-utp"

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export type PlatformUtpResult = {
  payload: PlatformUtp
  version: number
  createdAt: string
}

function isPlatformKey(value: string): value is PlatformKey {
  return (platformKeys as readonly string[]).includes(value)
}

export async function getPlatformUtp(
  projectId: string,
  platform: string
): Promise<PlatformUtpResult | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  if (!isPlatformKey(platform)) return null

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  })
  if (!project) return null

  const artifact = await getLatestPlatformUtp(projectId, platform)
  if (!artifact) return null

  const parsed = platformUtpSchema.safeParse(artifact.payload)
  if (!parsed.success) return null

  return {
    payload: parsed.data,
    version: artifact.version,
    createdAt: artifact.createdAt.toISOString(),
  }
}

export async function runPlatformUtp(
  projectId: string,
  platform: string
): Promise<ActionResult<PlatformUtpResult>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Нет доступа" }
  if (!isPlatformKey(platform)) return { success: false, error: "Неизвестная площадка" }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  })
  if (!project) return { success: false, error: "Проект не найден" }

  const gate = await canGenerateAi(session.user.id)
  if (!gate.allowed) {
    return { success: false, error: gate.reason ?? "Лимит генераций исчерпан" }
  }

  try {
    const artifact = await generatePlatformUtp(project, platform)
    const parsed = platformUtpSchema.safeParse(artifact.payload)
    if (!parsed.success) {
      return { success: false, error: "AI-ответ не прошёл валидацию схемы" }
    }
    revalidatePath("/offers")
    return {
      success: true,
      data: {
        payload: parsed.data,
        version: artifact.version,
        createdAt: artifact.createdAt.toISOString(),
      },
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось сгенерировать УТП"
    return { success: false, error: message }
  }
}
