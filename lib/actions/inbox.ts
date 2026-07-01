"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import type { SignalType, SignalPriority } from "@prisma/client"

export type InboxSignalRow = {
  id: string
  type: SignalType
  priority: SignalPriority
  title: string
  body: string
  action: string | null
  actionHref: string | null
  read: boolean
  createdAt: string
}

export async function listInboxSignals(projectId: string): Promise<InboxSignalRow[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  })
  if (!project) return []

  const signals = await prisma.inboxSignal.findMany({
    where: { projectId },
    orderBy: [{ read: "asc" }, { createdAt: "desc" }],
    take: 50,
  })

  return signals.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
  }))
}

export async function countUnreadSignals(projectId: string): Promise<number> {
  const session = await auth()
  if (!session?.user?.id) return 0

  return prisma.inboxSignal.count({
    where: { projectId, read: false },
  })
}

const markReadSchema = z.object({
  signalId: z.string().min(1),
})

export async function markSignalRead(raw: unknown): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) return

  const parsed = markReadSchema.safeParse(raw)
  if (!parsed.success) return

  await prisma.inboxSignal.updateMany({
    where: {
      id: parsed.data.signalId,
      project: { userId: session.user.id },
    },
    data: { read: true },
  })
}

export async function markAllSignalsRead(projectId: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) return

  await prisma.inboxSignal.updateMany({
    where: {
      projectId,
      project: { userId: session.user.id },
      read: false,
    },
    data: { read: true },
  })
}

export async function createSignal(params: {
  projectId: string
  type: SignalType
  priority: SignalPriority
  title: string
  body: string
  action?: string
  actionHref?: string
}): Promise<void> {
  await prisma.inboxSignal.create({
    data: {
      projectId: params.projectId,
      type: params.type,
      priority: params.priority,
      title: params.title,
      body: params.body,
      action: params.action ?? null,
      actionHref: params.actionHref ?? null,
    },
  })
}
