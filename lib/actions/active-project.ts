"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const COOKIE_NAME = "active-project"

/** Persists the active project id in a cookie so Server Components can read it. */
export async function setActiveProject(projectId: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) return

  // Validate ownership before trusting the id.
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  })
  if (!project) return

  const store = await cookies()
  store.set(COOKIE_NAME, projectId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  })

  revalidatePath("/", "layout")
}

/**
 * Resolves the active project id for the current user:
 * cookie (if still owned) → most recently created project → null.
 */
export async function getActiveProjectId(): Promise<string | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  const store = await cookies()
  const cookieId = store.get(COOKIE_NAME)?.value

  if (cookieId) {
    const owned = await prisma.project.findFirst({
      where: { id: cookieId, userId: session.user.id },
      select: { id: true },
    })
    if (owned) return owned.id
  }

  const fallback = await prisma.project.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  })
  return fallback?.id ?? null
}
