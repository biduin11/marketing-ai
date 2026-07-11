"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canGenerateAi } from "@/lib/gates"
import {
  generateSprint as generateSprintService,
  startOfWeekMonday,
} from "@/lib/services/sprint.service"

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

export type SprintTaskItem = {
  id: string
  title: string
  description: string | null
  priority: "HIGH" | "MEDIUM" | "LOW"
  category: string
  estimatedHours: number | null
  completed: boolean
  dueDay: string | null
}

export type SprintItem = {
  id: string
  weekStart: string
  weekEnd: string
  aiSummary: string | null
  tasks: SprintTaskItem[]
}

function toItem(sprint: {
  id: string
  weekStart: Date
  weekEnd: Date
  aiSummary: string | null
  tasks: {
    id: string
    title: string
    description: string | null
    priority: string
    category: string
    estimatedHours: number | null
    completed: boolean
    dueDay: string | null
  }[]
}): SprintItem {
  return {
    id: sprint.id,
    weekStart: sprint.weekStart.toISOString(),
    weekEnd: sprint.weekEnd.toISOString(),
    aiSummary: sprint.aiSummary,
    tasks: sprint.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      priority: t.priority as SprintTaskItem["priority"],
      category: t.category,
      estimatedHours: t.estimatedHours,
      completed: t.completed,
      dueDay: t.dueDay,
    })),
  }
}

async function ownedProject(projectId: string) {
  const session = await auth()
  if (!session?.user?.id) return null
  return prisma.project.findFirst({ where: { id: projectId, userId: session.user.id } })
}

export async function getCurrentSprint(projectId: string): Promise<SprintItem | null> {
  const project = await ownedProject(projectId)
  if (!project) return null

  const weekStart = startOfWeekMonday(new Date())
  const sprint = await prisma.sprint.findUnique({
    where: { projectId_weekStart: { projectId, weekStart } },
    include: { tasks: { orderBy: { createdAt: "asc" } } },
  })
  return sprint ? toItem(sprint) : null
}

export async function generateSprint(projectId: string): Promise<ActionResult<SprintItem>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Нет доступа" }

  const project = await ownedProject(projectId)
  if (!project) return { success: false, error: "Проект не найден" }

  const gate = await canGenerateAi(session.user.id)
  if (!gate.allowed) {
    return { success: false, error: gate.reason ?? "Лимит генераций исчерпан" }
  }

  try {
    const sprint = await generateSprintService(project)
    revalidatePath("/sprint")
    return { success: true, data: toItem(sprint) }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось сгенерировать план недели"
    return { success: false, error: message }
  }
}

export async function toggleSprintTask(taskId: string): Promise<ActionResult<null>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Нет доступа" }

  const task = await prisma.sprintTask.findFirst({
    where: { id: taskId, sprint: { project: { userId: session.user.id } } },
    select: { id: true, completed: true },
  })
  if (!task) return { success: false, error: "Задача не найдена" }

  await prisma.sprintTask.update({
    where: { id: taskId },
    data: { completed: !task.completed },
  })
  revalidatePath("/sprint")
  return { success: true, data: null }
}

const addTaskSchema = z.object({
  sprintId: z.string().min(1),
  title: z.string().min(1).max(300),
  description: z.string().max(1000).optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  category: z.string().min(1).max(50),
  estimatedHours: z.number().int().min(0).max(200).optional(),
  dueDay: z.string().max(30).optional(),
})

export async function addSprintTask(
  input: z.infer<typeof addTaskSchema>
): Promise<ActionResult<SprintTaskItem>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Нет доступа" }

  const parsed = addTaskSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: "Ошибка валидации" }

  const { sprintId, ...rest } = parsed.data
  const sprint = await prisma.sprint.findFirst({
    where: { id: sprintId, project: { userId: session.user.id } },
    select: { id: true },
  })
  if (!sprint) return { success: false, error: "Спринт не найден" }

  const task = await prisma.sprintTask.create({
    data: {
      sprintId,
      title: rest.title,
      description: rest.description ?? null,
      priority: rest.priority,
      category: rest.category,
      estimatedHours: rest.estimatedHours ?? null,
      dueDay: rest.dueDay ?? null,
    },
  })
  revalidatePath("/sprint")
  return {
    success: true,
    data: {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      category: task.category,
      estimatedHours: task.estimatedHours,
      completed: task.completed,
      dueDay: task.dueDay,
    },
  }
}

export async function deleteSprintTask(taskId: string): Promise<ActionResult<null>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Нет доступа" }

  const task = await prisma.sprintTask.findFirst({
    where: { id: taskId, sprint: { project: { userId: session.user.id } } },
    select: { id: true },
  })
  if (!task) return { success: false, error: "Задача не найдена" }

  await prisma.sprintTask.delete({ where: { id: taskId } })
  revalidatePath("/sprint")
  return { success: true, data: null }
}
