"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { toggleTaskSchema } from "@/lib/validations/ai"
import type { ToggleTaskInput } from "@/lib/validations/ai"

type ActionResult =
  | { success: true }
  | { success: false; error: string }

export async function toggleStrategyTask(
  input: ToggleTaskInput
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Нет доступа" }

  const parsed = toggleTaskSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: "Ошибка валидации" }

  const { artifactId, taskKey, done } = parsed.data

  // Verify the artifact belongs to a project owned by the user.
  const artifact = await prisma.aiArtifact.findFirst({
    where: { id: artifactId, project: { userId: session.user.id } },
    select: { id: true, projectId: true },
  })
  if (!artifact) return { success: false, error: "Артефакт не найден" }

  try {
    await prisma.strategyTask.upsert({
      where: { artifactId_taskKey: { artifactId, taskKey } },
      create: {
        artifactId,
        projectId: artifact.projectId,
        taskKey,
        done,
      },
      update: { done },
    })
    return { success: true }
  } catch {
    return { success: false, error: "Не удалось сохранить задачу" }
  }
}
