import type { Platform } from "@prisma/client"

export interface PlatformField {
  name: "accountId" | "accessToken"
  label: string
  hint: string
}

export interface PlatformConfig {
  key: Platform
  name: string
  icon: string
  hint: string
  /** Which reputation block this platform feeds */
  kind: "reviews" | "social"
  fields: PlatformField[]
}

export const PLATFORMS: PlatformConfig[] = [
  {
    key: "YANDEX_MAPS",
    name: "Яндекс Карты",
    icon: "🗺️",
    hint: "Отзывы и рейтинг организации",
    kind: "reviews",
    fields: [
      {
        name: "accountId",
        label: "ID организации в Яндекс.Бизнес",
        hint: "Найти в URL: business.yandex.ru/dashboard/XXXXX",
      },
      {
        name: "accessToken",
        label: "OAuth токен Яндекс.Бизнес",
        hint: "Получить на oauth.yandex.ru",
      },
    ],
  },
  {
    key: "TWOGIS",
    name: "2ГИС",
    icon: "📍",
    hint: "Отзывы и рейтинг компании",
    kind: "reviews",
    fields: [
      {
        name: "accountId",
        label: "ID организации в 2ГИС",
        hint: "Из URL страницы компании в 2ГИС",
      },
      {
        name: "accessToken",
        label: "API ключ 2ГИС Partners",
        hint: "Получить на dev.2gis.ru",
      },
    ],
  },
  {
    key: "AVITO",
    name: "Авито",
    icon: "🛒",
    hint: "Статистика объявлений и звонки",
    kind: "social",
    fields: [
      {
        name: "accountId",
        label: "Client ID приложения Авито",
        hint: "Получить на developers.avito.ru",
      },
      {
        name: "accessToken",
        label: "Client Secret",
        hint: "Из личного кабинета разработчика Авито",
      },
    ],
  },
  {
    key: "VK",
    name: "ВКонтакте",
    icon: "💙",
    hint: "Статистика сообщества",
    kind: "social",
    fields: [
      {
        name: "accountId",
        label: "ID сообщества ВКонтакте",
        hint: "Числовой ID или короткое имя (без vk.com/)",
      },
      {
        name: "accessToken",
        label: "Access Token сообщества",
        hint: "Настройки сообщества → Работа с API",
      },
    ],
  },
  {
    key: "TELEGRAM",
    name: "Telegram",
    icon: "✈️",
    hint: "Статистика канала",
    kind: "social",
    fields: [
      {
        name: "accountId",
        label: "Username канала",
        hint: "Например: finkrovlya (без @)",
      },
      {
        name: "accessToken",
        label: "Bot Token",
        hint: "Создать бота через @BotFather, добавить в канал как админа",
      },
    ],
  },
]

export function platformLabel(platform: Platform): string {
  return PLATFORMS.find((p) => p.key === platform)?.name ?? platform
}

export function platformIcon(platform: Platform): string {
  return PLATFORMS.find((p) => p.key === platform)?.icon ?? "🔗"
}
