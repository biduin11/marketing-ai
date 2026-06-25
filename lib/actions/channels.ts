"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const DEFAULT_CHANNELS = [
  "Яндекс Директ",
  "Яндекс Карты",
  "2ГИС",
  "Instagram",
  "ВКонтакте",
  "Telegram",
  "TikTok",
  "Авито",
  "Email-рассылка",
  "WhatsApp-рассылка",
  "Сарафанное радио",
  "Офлайн-реклама",
  "SEO / Органика",
]

export type ChannelItem = {
  id: string
  name: string
  isDefault: boolean
}

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

export async function getChannels(projectId: string): Promise<ChannelItem[]> {
  const session = await auth()
  if (!session?.user?.id) {
    return DEFAULT_CHANNELS.map((name) => ({ id: name, name, isDefault: true }))
  }

  const owned = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  })
  if (!owned) {
    return DEFAULT_CHANNELS.map((name) => ({ id: name, name, isDefault: true }))
  }

  const custom = await prisma.customChannel.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  })

  const customNames = new Set(custom.map((c) => c.name))
  const defaults: ChannelItem[] = DEFAULT_CHANNELS.filter((name) => !customNames.has(name)).map(
    (name) => ({ id: name, name, isDefault: true })
  )
  const customItems: ChannelItem[] = custom.map((c) => ({
    id: c.id,
    name: c.name,
    isDefault: false,
  }))

  return [...defaults, ...customItems]
}

const addChannelSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1).max(100),
})

export async function addChannel(
  input: z.infer<typeof addChannelSchema>
): Promise<ActionResult<ChannelItem>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Нет доступа" }

  const parsed = addChannelSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: "Ошибка валидации" }

  const { projectId, name } = parsed.data

  const owned = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  })
  if (!owned) return { success: false, error: "Проект не найден" }

  try {
    const channel = await prisma.customChannel.create({
      data: { projectId, name: name.trim() },
    })
    revalidatePath("/settings")
    revalidatePath("/analytics")
    return { success: true, data: { id: channel.id, name: channel.name, isDefault: false } }
  } catch {
    return { success: false, error: "Такой канал уже есть в списке" }
  }
}

export async function deleteChannel(channelId: string): Promise<ActionResult<null>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Нет доступа" }

  const channel = await prisma.customChannel.findFirst({
    where: { id: channelId, project: { userId: session.user.id } },
  })
  if (!channel) return { success: false, error: "Канал не найден" }

  await prisma.customChannel.delete({ where: { id: channelId } })
  revalidatePath("/settings")
  revalidatePath("/analytics")
  return { success: true, data: null }
}
