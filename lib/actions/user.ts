"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { setUserRoleSchema, type SetUserRoleInput } from "@/lib/validations/user"

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function setUserRole(input: SetUserRoleInput): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Нет доступа" }
  }

  const parsed = setUserRoleSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: "Ошибка валидации" }
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: parsed.data.role },
    })
    revalidatePath("/", "layout")
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Не удалось сохранить" }
  }
}

export async function dismissOnboarding(): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Нет доступа" }
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingDismissedAt: new Date() },
    })
    revalidatePath("/", "layout")
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Не удалось сохранить" }
  }
}
