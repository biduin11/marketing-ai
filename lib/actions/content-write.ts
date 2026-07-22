"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { generateTextWithGemini } from "@/lib/ai/generate-with-gemini"
import { generateTextWithOpenAI } from "@/lib/ai/generate-with-openai"
import { getLatestArtifact } from "@/lib/services/artifacts"
import { canGenerateAi } from "@/lib/gates"
import { z } from "zod"

const contentWriteSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(["reels", "post", "stories", "email"]),
  category: z.enum(["educational", "engagement", "sales"]),
  platform: z.string().optional(),
  hook: z.string().optional(),
})

type WriteResult =
  | { success: true; text: string }
  | { success: false; error: string }

const TYPE_LABELS: Record<string, string> = {
  reels: "сценарий Reels (видео до 60 сек)",
  post: "текст поста",
  stories: "текст для Stories",
  email: "текст email-письма",
}

const CATEGORY_LABELS: Record<string, string> = {
  educational: "образовательный",
  engagement: "вовлекающий",
  sales: "продающий",
}

export async function writeContentText(raw: unknown): Promise<WriteResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Не авторизован" }

  const parsed = contentWriteSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: "Неверные параметры" }

  const { projectId, title, type, category, platform, hook } = parsed.data

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  })
  if (!project) return { success: false, error: "Нет доступа" }

  const gate = await canGenerateAi(session.user.id)
  if (!gate.allowed) return { success: false, error: gate.reason ?? "Лимит генераций исчерпан" }

  const [audienceArtifact, offerArtifact] = await Promise.all([
    getLatestArtifact(projectId, "AUDIENCE_SEGMENTS"),
    getLatestArtifact(projectId, "OFFER"),
  ])

  const audienceContext = audienceArtifact
    ? JSON.stringify(audienceArtifact.payload, null, 0).slice(0, 800)
    : null
  const offerContext = offerArtifact
    ? JSON.stringify(offerArtifact.payload, null, 0).slice(0, 600)
    : null

  const prompt = `Напиши ${TYPE_LABELS[type] ?? type} для публикации в ${platform ?? "социальных сетях"}.

Тема: «${title}»
Категория контента: ${CATEGORY_LABELS[category] ?? category}
${hook ? `Hook (начало): ${hook}` : ""}

Компания: ${project.name}
Ниша: ${project.niche ?? "не указана"}
Стиль бренда: ${project.brandTone ?? "профессиональный, дружелюбный"}
${audienceContext ? `\nАудитория: ${audienceContext}` : ""}
${offerContext ? `\nОффер: ${offerContext}` : ""}

Требования:
${type === "reels" ? `- Структура: Hook (первые 3 сек) → Основной контент (15-40 сек) → CTA
- Пиши как дословный сценарий, что говорить на камеру
- В конце добавь 5-7 хэштегов` : ""}
${type === "post" ? `- Начни с цепляющего первого предложения
- Используй эмодзи умеренно
- Заканчивай CTA или вопросом к аудитории
- Оптимальная длина: 800-1500 символов
- В конце добавь 5-7 хэштегов` : ""}
${type === "stories" ? `- Короткий, ёмкий текст (до 200 символов)
- Интерактивный элемент: вопрос или призыв
- Несколько слайдов, если нужно — раздели символом ---` : ""}
${type === "email" ? `- Тема письма: дай вариант темы в начале
- Preview-текст: вторая строка
- Структура: зацепляющее начало → ценность → CTA
- Персонализированный, не безликий
- Длина: 300-600 слов` : ""}

Напиши ПОЛНЫЙ текст поста до конца. Не обрывай на середине предложения. Текст должен заканчиваться точкой или призывом к действию.

Пиши по-русски. Готовый текст — сразу, без вступлений.`

  try {
    if (process.env.AI_PROVIDER === "gemini") {
      const text = await generateTextWithGemini({ user: prompt, maxTokens: 2000 })
      return { success: true, text }
    }

    const text = await generateTextWithOpenAI({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 2000,
    })

    return { success: true, text }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Ошибка генерации"
    return { success: false, error: msg }
  }
}
