import { z } from "zod"

export const objectionResponseSchema = z.object({
  traditionalist: z.string().describe("Ответ для психотипа Традиционалист"),
  independent: z.string().describe("Ответ для психотипа Независимый"),
  aesthete: z.string().describe("Ответ для психотипа Эстет"),
  hedonist: z.string().describe("Ответ для психотипа Гедонист"),
})
export type ObjectionResponses = z.infer<typeof objectionResponseSchema>

export const psychotypeKeys = [
  "traditionalist",
  "independent",
  "aesthete",
  "hedonist",
] as const
export type PsychotypeKey = (typeof psychotypeKeys)[number]
