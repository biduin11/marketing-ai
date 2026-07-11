import { z } from "zod"

export const platformKeys = [
  "avito",
  "yandex_maps",
  "instagram",
  "telegram",
  "vk",
  "youtube",
  "tiktok",
] as const
export type PlatformKey = (typeof platformKeys)[number]

export const psychotypeKeys = [
  "traditionalist",
  "independent",
  "aesthete",
  "hedonist",
] as const
export type PsychotypeKey = (typeof psychotypeKeys)[number]

export const platformUtpVariantSchema = z.object({
  psychotype: z
    .enum(psychotypeKeys)
    .describe("Психотип покупателя, под который написан вариант"),
  headline: z.string().describe("Заголовок / УТП, до 10 слов"),
  subheadline: z.string().describe("Подзаголовок, одно предложение"),
  cta: z.string().describe("Призыв к действию"),
  fullText: z.string().describe("Полный текст объявления для этой площадки"),
  tips: z
    .array(z.string())
    .describe("Советы по оформлению именно для этой площадки"),
})

export const platformUtpSchema = z.object({
  platform: z.string().describe("Название площадки"),
  audience: z.string().describe("Описание аудитории площадки"),
  format: z.string().describe("Формат контента, принятый на площадке"),
  variants: z
    .array(platformUtpVariantSchema)
    .describe("По одному варианту УТП на каждый из 4 психотипов"),
})
export type PlatformUtp = z.infer<typeof platformUtpSchema>
