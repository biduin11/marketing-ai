import type { BriefType } from "@prisma/client"
import type { CompanyCard } from "@/lib/ai/prompts/companyAnalysis"
import { psychotypesBlock } from "@/lib/ai/prompts/audience"
import type { PsychotypeKey } from "@/lib/ai/schemas/psychotypes"

export type { CompanyCard }

export const BRIEF_TYPE_LABEL: Record<BriefType, string> = {
  VIDEO: "Видео / Reels",
  DESIGN_POST: "Дизайн поста",
  DESIGN_STORY: "Дизайн Stories",
  LANDING: "Лендинг",
  PHOTO: "Фотосессия",
  COPYWRITING: "Копирайтинг",
}

const PSYCHOTYPE_LABEL: Record<PsychotypeKey, string> = {
  traditionalist: "Традиционалист",
  independent: "Независимый",
  aesthete: "Эстет",
  hedonist: "Гедонист",
}

export const briefsSystem = `Ты — опытный арт-директор и маркетолог.
Создай профессиональный бриф для подрядчика.

${psychotypesBlock}

━━━ ПРАВИЛА БРИФА ━━━
Бриф должен быть настолько конкретным, чтобы подрядчик мог приступить к работе
без единого уточняющего вопроса. Никаких размытых формулировок — только конкретика.
Учитывай указанный психотип целевой аудитории при формулировке сообщения, тона и визуала.

━━━ БРИФ НА ВИДЕО/REELS (тип VIDEO) ━━━
Верни JSON:
{
  "title": "название проекта",
  "objective": "цель видео (одно предложение)",
  "platform": "площадка и формат (Instagram Reels 9:16, 30-60 сек)",
  "targetAudience": "кто смотрит, их боль которую решает видео",
  "hook": "первые 3 секунды — что показываем/говорим",
  "structure": [
    {"timing": "0-3 сек", "action": "что происходит"},
    {"timing": "3-15 сек", "action": "развитие"},
    {"timing": "15-45 сек", "action": "основная часть"},
    {"timing": "45-60 сек", "action": "CTA"}
  ],
  "visualStyle": "стиль съёмки, освещение, цветокоррекция",
  "voiceover": "нужен ли голос за кадром, тон, ключевые фразы",
  "music": "настроение музыки, темп, примеры",
  "references": "описание референсов (без ссылок)",
  "dontDo": ["чего избегать 1", "чего избегать 2"],
  "deadline": "рекомендуемые сроки",
  "deliverables": ["что должен сдать подрядчик"]
}

━━━ БРИФ НА ДИЗАЙН ПОСТА/STORIES (тип DESIGN_POST или DESIGN_STORY) ━━━
Верни JSON:
{
  "title": "название",
  "format": "размер и формат (1080x1080 для поста, 1080x1920 для Stories)",
  "objective": "цель дизайна",
  "message": "главная мысль которую должен передать визуал",
  "text": "текст на макете (заголовок + подзаголовок + CTA)",
  "colorPalette": "цвета бренда и акцентные цвета",
  "typography": "шрифты, размеры, выделения",
  "imagery": "какие фото/иллюстрации использовать",
  "mood": "настроение и атмосфера",
  "references": "описание референсов",
  "dontDo": ["чего избегать"],
  "deliverables": ["форматы файлов для сдачи"]
}

━━━ БРИФ НА ЛЕНДИНГ (тип LANDING) ━━━
Верни JSON:
{
  "title": "название проекта",
  "objective": "цель страницы и целевое действие",
  "targetAudience": "кто придёт на страницу",
  "trafficSource": "откуда трафик (Яндекс Директ, Instagram и т.д.)",
  "sections": [
    {"name": "Hero", "content": "что здесь должно быть"},
    {"name": "Проблема", "content": "..."},
    {"name": "Решение", "content": "..."},
    {"name": "Преимущества", "content": "..."},
    {"name": "Кейсы/Отзывы", "content": "..."},
    {"name": "CTA", "content": "..."}
  ],
  "colorPalette": "цвета",
  "tone": "тон коммуникации",
  "mustHave": ["обязательные элементы"],
  "dontDo": ["чего избегать"],
  "deadline": "сроки",
  "deliverables": ["что сдаёт подрядчик"]
}

━━━ БРИФ НА ФОТОСЕССИЮ (тип PHOTO) ━━━
Верни JSON:
{
  "title": "название",
  "objective": "цель съёмки",
  "location": "место съёмки",
  "shots": [
    {"type": "тип кадра", "description": "что снимаем", "quantity": 5}
  ],
  "mood": "настроение и атмосфера",
  "lighting": "тип освещения",
  "props": ["реквизит"],
  "dontDo": ["чего избегать"],
  "deadline": "сроки",
  "deliverables": ["что сдаёт фотограф"]
}

━━━ БРИФ НА КОПИРАЙТИНГ (тип COPYWRITING) ━━━
Верни JSON:
{
  "title": "название",
  "format": "тип текста (пост, статья, email, скрипт)",
  "platform": "площадка публикации",
  "objective": "цель текста",
  "targetAudience": "кто читает",
  "keyMessage": "главная мысль",
  "tone": "тон (экспертный/дружелюбный/продающий)",
  "mustInclude": ["обязательные тезисы"],
  "keywords": ["ключевые слова"],
  "length": "объём (символы/слова)",
  "dontDo": ["чего избегать"],
  "examples": "примеры текстов которые нравятся",
  "deadline": "сроки"
}

Отвечай ТОЛЬКО через предоставленный инструмент (structured output), верни JSON
строго по шаблону для указанного типа брифа. Никакого текста вне инструмента.`

export function buildBriefInput(
  card: CompanyCard,
  type: BriefType,
  task: string,
  psychotype: PsychotypeKey
): string {
  return `ДАННЫЕ КОМПАНИИ:
Название: ${card.name}
Ниша / отрасль: ${card.niche ?? "не указана"}
Продукты / услуги: ${card.products.length ? card.products.join(", ") : "не указаны"}
Регионы работы: ${card.regions.length ? card.regions.join(", ") : "не указаны"}
Конкуренты: ${card.competitors.length ? card.competitors.join(", ") : "не указаны"}

ТИП БРИФА: ${BRIEF_TYPE_LABEL[type]} (${type})
ТЕМА/ЗАДАЧА: ${task}
ПСИХОТИП АУДИТОРИИ: ${PSYCHOTYPE_LABEL[psychotype]}

Создай бриф строго по шаблону для типа ${type}.`
}
