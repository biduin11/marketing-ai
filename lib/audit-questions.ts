export interface AuditQuestionOption {
  value: number
  label: string
}

export interface AuditQuestion {
  id: string
  category: string
  question: string
  options: AuditQuestionOption[]
}

export const AUDIT_QUESTIONS: AuditQuestion[] = [
  {
    id: "site",
    category: "Онлайн-присутствие",
    question: "Есть ли у компании сайт?",
    options: [
      { value: 0, label: "Нет сайта" },
      { value: 1, label: "Есть, но устаревший" },
      { value: 2, label: "Есть, хороший" },
      { value: 3, label: "Есть, с хорошей конверсией" },
    ],
  },
  {
    id: "maps",
    category: "Локальный поиск",
    question: "Как компания представлена на Яндекс.Картах и 2ГИС?",
    options: [
      { value: 0, label: "Не представлена" },
      { value: 1, label: "Есть карточка, мало отзывов" },
      { value: 2, label: "Рейтинг 4.0-4.5, 20+ отзывов" },
      { value: 3, label: "Рейтинг 4.5+, 50+ отзывов" },
    ],
  },
  {
    id: "social",
    category: "Социальные сети",
    question: "Как компания ведёт социальные сети?",
    options: [
      { value: 0, label: "Нет соцсетей" },
      { value: 1, label: "Есть, но редко публикует" },
      { value: 2, label: "Публикует 2-3 раза в неделю" },
      { value: 3, label: "Активно, есть вовлечённость" },
    ],
  },
  {
    id: "ads",
    category: "Реклама",
    question: "Какая реклама запущена прямо сейчас?",
    options: [
      { value: 0, label: "Никакой рекламы" },
      { value: 1, label: "Только офлайн" },
      { value: 2, label: "Есть онлайн-реклама" },
      { value: 3, label: "Системная реклама с аналитикой" },
    ],
  },
  {
    id: "leads",
    category: "Лидогенерация",
    question: "Сколько заявок получает компания в месяц?",
    options: [
      { value: 0, label: "Менее 10" },
      { value: 1, label: "10-30 заявок" },
      { value: 2, label: "30-100 заявок" },
      { value: 3, label: "Более 100 заявок" },
    ],
  },
  {
    id: "crm",
    category: "Работа с клиентами",
    question: "Как ведётся база клиентов?",
    options: [
      { value: 0, label: "Никак" },
      { value: 1, label: "В таблице Excel/Google" },
      { value: 2, label: "Есть CRM или мессенджер" },
      { value: 3, label: "CRM с автоматизацией" },
    ],
  },
  {
    id: "repeat",
    category: "Повторные продажи",
    question: "Как компания работает с повторными покупками?",
    options: [
      { value: 0, label: "Никак не работает" },
      { value: 1, label: "Иногда звонят клиентам" },
      { value: 2, label: "Есть рассылки или акции" },
      { value: 3, label: "Системная работа с базой" },
    ],
  },
  {
    id: "content",
    category: "Контент",
    question: "Есть ли у компании контент-стратегия?",
    options: [
      { value: 0, label: "Нет никакого контента" },
      { value: 1, label: "Публикуют хаотично" },
      { value: 2, label: "Есть план на месяц" },
      { value: 3, label: "Стратегия с аналитикой" },
    ],
  },
  {
    id: "utp",
    category: "Позиционирование",
    question: "Есть ли у компании чёткое УТП?",
    options: [
      { value: 0, label: 'Нет, "работаем как все"' },
      { value: 1, label: "Есть, но размытое" },
      { value: 2, label: "Есть чёткое УТП" },
      { value: 3, label: "УТП подтверждено отзывами" },
    ],
  },
  {
    id: "analytics",
    category: "Аналитика",
    question: "Как компания измеряет эффективность маркетинга?",
    options: [
      { value: 0, label: "Никак не измеряет" },
      { value: 1, label: "Считают заявки" },
      { value: 2, label: "Считают ROI по каналам" },
      { value: 3, label: "Полная сквозная аналитика" },
    ],
  },
]

export const AUDIT_QUESTION_IDS = AUDIT_QUESTIONS.map((q) => q.id)

const CATEGORY_LABELS: Record<string, string> = {
  site: "Сайт",
  maps: "Карты и отзывы",
  social: "Социальные сети",
  ads: "Реклама",
  leads: "Лидогенерация",
  crm: "База клиентов",
  repeat: "Повторные продажи",
  content: "Контент",
  utp: "Позиционирование",
  analytics: "Аналитика",
}

export function categoryLabel(key: string): string {
  return CATEGORY_LABELS[key] ?? key
}
