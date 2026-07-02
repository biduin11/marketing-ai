export const reputationSystem = `Ты — эксперт по управлению репутацией и SMM.
Проанализируй данные репутации компании и дай конкретные рекомендации.

ЗАДАЧА:
1. Найди паттерны в негативных отзывах — что чаще всего критикуют?
2. Найди паттерны в позитивных — что хвалят, это и есть УТП
3. Оцени активность в соцсетях — где растём, где падаем
4. Сформируй приоритизированный список конкретных действий:
   - Что ответить на негативные отзывы (шаблон ответа)
   - Что улучшить в работе компании (из паттернов жалоб)
   - Что усилить в контенте соцсетей
   - Как использовать позитивные отзывы в маркетинге

Требования:
- Пиши по-русски
- Будь конкретным: цитируй суть жалоб, а не абстракции
- Действия сортируй по impact × urgency
- Шаблоны ответов на негатив — вежливые, без оправданий, с решением
- Если данных по площадке нет — не выдумывай, пропусти

Отвечай только структурированным JSON.`

export interface ReputationReview {
  platform: string
  rating: number | null
  author: string | null
  text: string | null
  hasReply: boolean
  sentiment: string | null
  publishedAt: string
}

export interface ReputationSocialStat {
  platform: string
  followers: number
  reach: number
  engagement: number
  views: number
  clicks: number
}

export interface ReputationContext {
  projectName: string
  niche: string
  yandexReviews: ReputationReview[]
  twoGisReviews: ReputationReview[]
  vkStats: ReputationSocialStat[]
  telegramStats: ReputationSocialStat[]
  avitoStats: ReputationSocialStat[]
}

function formatReviews(label: string, reviews: ReputationReview[]): string[] {
  if (reviews.length === 0) return []
  const lines = [`--- ${label} (${reviews.length}) ---`]
  for (const r of reviews.slice(0, 40)) {
    const rating = r.rating != null ? `${r.rating}/5` : "—"
    const reply = r.hasReply ? " [есть ответ]" : " [БЕЗ ОТВЕТА]"
    lines.push(`[${rating}]${reply} ${r.author ?? "Аноним"}: ${r.text ?? "(без текста)"}`)
  }
  lines.push("")
  return lines
}

function formatStats(label: string, stats: ReputationSocialStat[]): string[] {
  if (stats.length === 0) return []
  const latest = stats[stats.length - 1]
  const first = stats[0]
  const followerDelta = latest.followers - first.followers
  return [
    `--- ${label} ---`,
    `Подписчики: ${latest.followers} (${followerDelta >= 0 ? "+" : ""}${followerDelta} за период)`,
    `Охват: ${latest.reach}  Вовлечённость: ${latest.engagement}  Просмотры: ${latest.views}  Клики: ${latest.clicks}`,
    "",
  ]
}

export function buildReputationInput(ctx: ReputationContext): string {
  const lines: string[] = [
    `=== ПРОЕКТ: ${ctx.projectName} ===`,
    `Ниша: ${ctx.niche}`,
    "",
    ...formatReviews("ОТЗЫВЫ ЯНДЕКС.КАРТЫ", ctx.yandexReviews),
    ...formatReviews("ОТЗЫВЫ 2ГИС", ctx.twoGisReviews),
    ...formatStats("СТАТИСТИКА ВКОНТАКТЕ", ctx.vkStats),
    ...formatStats("СТАТИСТИКА TELEGRAM", ctx.telegramStats),
    ...formatStats("СТАТИСТИКА АВИТО", ctx.avitoStats),
    "=== ЗАДАЧА ===",
    "Проанализируй данные выше и верни структурированный анализ репутации с приоритизированными действиями и шаблонами ответов.",
  ]
  return lines.join("\n")
}
