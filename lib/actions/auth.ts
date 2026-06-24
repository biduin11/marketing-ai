"use server"

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { registerSchema } from "@/lib/validations/auth"
import type { RegisterInput } from "@/lib/validations/auth"

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export async function registerUser(
  input: RegisterInput
): Promise<ActionResult<{ email: string }>> {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: "Ошибка валидации",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    }
  }

  const { name, email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return {
      success: false,
      error: "Пользователь с таким email уже существует",
      fieldErrors: { email: ["Email уже занят"] },
    }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: { name, email, passwordHash },
  })

  return { success: true, data: { email } }
}
