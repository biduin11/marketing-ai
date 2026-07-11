import { z } from "zod"

export const sprintTaskSchema = z.object({
  title: z.string().describe("Конкретное название задачи"),
  description: z.string().nullable().describe("Детали и контекст выполнения задачи"),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).describe("Приоритет: HIGH — первые 2 задачи, влияющие на выручку"),
  category: z
    .string()
    .describe("Категория: контент / реклама / аналитика / работа с клиентами / репутация / стратегия"),
  estimatedHours: z.number().nullable().describe("Реалистичная оценка времени в часах"),
  dueDay: z.string().nullable().describe("День недели, например «Понедельник»"),
})

export const sprintSchema = z.object({
  weekSummary: z.string().describe("Краткое описание фокуса недели"),
  tasks: z.array(sprintTaskSchema).describe("5-7 конкретных задач на неделю"),
})

export type Sprint = z.infer<typeof sprintSchema>
export type SprintTaskInput = z.infer<typeof sprintTaskSchema>
