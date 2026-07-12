import { z } from "zod"

export const connectYandexMetrikaSchema = z.object({
  projectId: z.string().min(1),
  counterId: z
    .string()
    .trim()
    .min(1, "Укажите ID счётчика")
    .regex(/^\d+$/, "ID счётчика должен состоять из цифр"),
  accessToken: z.string().trim().min(10, "Укажите OAuth токен"),
})
