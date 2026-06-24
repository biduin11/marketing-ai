"use server"

import { put } from "@vercel/blob"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function uploadReportPdf(
  projectId: string,
  artifactId: string,
  base64DataUri: string
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Не авторизован" }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  })
  if (!project) return { success: false, error: "Нет доступа" }

  try {
    const base64 = base64DataUri.split(",")[1]
    if (!base64) return { success: false, error: "Неверный формат PDF" }

    const buffer = Buffer.from(base64, "base64")
    const filename = `reports/${projectId}/${artifactId}.pdf`

    const blob = await put(filename, buffer, {
      access: "public",
      contentType: "application/pdf",
    })

    return { success: true, url: blob.url }
  } catch {
    return { success: false, error: "Не удалось загрузить PDF" }
  }
}
