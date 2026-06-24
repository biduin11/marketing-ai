import { z } from "zod"

export const horizonInputSchema = z.union([
  z.literal(30),
  z.literal(90),
  z.literal(180),
  z.literal(365),
])

export const toggleTaskSchema = z.object({
  artifactId: z.string().min(1),
  taskKey: z.string().min(1),
  done: z.boolean(),
})

export type ToggleTaskInput = z.infer<typeof toggleTaskSchema>
