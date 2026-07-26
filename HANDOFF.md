# AI Marketing OS — передача работы

Дата подготовки: 26 июля 2026

Репозиторий: `github.com/biduin11/marketing-ai`

Ветка на момент передачи: `master`

Предыдущий коммит: `7b1cd51` (`feat: add Offers page to sidebar navigation`)

## Цель проекта

AI Marketing OS — Next.js-приложение для комплексного управления
маркетингом: аудит компании и рынка, аудитория, конкуренты, офферы,
CJM, контент-план, аналитика, стратегия, спринты, отчёты,
AI-директор, клиентский доступ, Яндекс Метрика и ЮKassa.

## Важно перед продолжением

Все перечисленные ниже обновления зависимостей, исправления React/lint,
настройка Turbopack, тесты и документация включены в тот же коммит,
что и этот файл. На новом компьютере достаточно получить актуальный
`origin/master`.

Папка `.codex/` не относится к продуктовой части и намеренно не изменялась.
Секреты и `.env*` в репозиторий не добавлялись.

## Текущий стек

- Next.js `16.2.12`, App Router, Turbopack
- React `19.2.4`
- TypeScript strict
- Tailwind CSS 4, shadcn/ui
- Prisma и Prisma Client `7.9.0`
- PostgreSQL / Neon
- Auth.js / NextAuth `5.0.0-beta.32`
- OpenAI, Anthropic, Gemini
- Zustand, Recharts, Vercel Blob
- Vitest `4.1.10`

Это нестандартная новая версия Next.js. Перед изменением Next.js-кода
обязательно читать соответствующую локальную документацию:

```text
node_modules/next/dist/docs/
```

## Что уже сделано в текущей рабочей копии

1. Обновлены уязвимые прямые зависимости:
   - Next.js: `16.2.9` → `16.2.12`;
   - NextAuth: `5.0.0-beta.31` → `5.0.0-beta.32`;
   - Prisma-пакеты выровнены на `7.9.0`;
   - `eslint-config-next` выровнен на `16.2.12`.
2. Устранены найденные critical-advisory Auth.js.
3. Исправлены все lint-ошибки и предупреждения:
   - условный вызов `useMemo`;
   - синхронный `setState` в effects;
   - динамическое создание Lucide-компонента;
   - неиспользуемые импорты, типы и параметры.
4. Sidebar переведён на `useSyncExternalStore` для синхронизации
   состояния с `localStorage`.
5. Форма метрики пересоздаёт draft-состояние через React `key`.
6. Финальное состояние индикатора AI-генерации теперь вычисляется при
   render без дополнительного синхронного effect.
7. Удалены временные AI debug-логи, включая фрагменты сгенерированного
   JSON.
8. В `next.config.ts` явно задан `turbopack.root`; предупреждение о
   неверном корне workspace исчезло.
9. Стандартный README заменён документацией по проекту.
10. Добавлены 20 регрессионных тестов:
    - классификация ошибок и AI fallback;
    - тарифы и истечение подписки;
    - аналитические расчёты.

## Последние успешные проверки

```bash
npm run lint
npm test
npx tsc --noEmit
npm run build
```

Результаты:

- ESLint: успешно, 0 ошибок и 0 предупреждений.
- Vitest: 3 файла, 20 тестов, все пройдены.
- TypeScript: успешно.
- Production build: успешно.
- Next.js сформировал 28 маршрутов.

## Оставшиеся advisory

Команда:

```bash
npm audit --omit=dev
```

показывает 7 записей: 5 high и 2 moderate, critical — 0.

Они приходят из внутренних зависимостей актуальных версий:

- Next.js → `postcss`, `sharp`;
- Prisma CLI → `find-my-way`, `valibot`.

Не запускать:

```bash
npm audit fix --force
```

На момент передачи npm предлагает для «исправления» несовместимые откаты
до Next.js 9 и Prisma 6. Следует дождаться исправленных релизов Next.js и
Prisma либо отдельно проверить официальные обновления. Не подменять
внутренние версии `postcss` и `sharp` через `overrides` без полноценной
проверки image optimization и production runtime.

## Запуск на новом компьютере

```bash
git clone https://github.com/biduin11/marketing-ai.git
cd marketing-ai
npm ci
```

Создать `.env.local`:

```dotenv
DATABASE_URL=postgresql://...
AUTH_SECRET=...
AUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=...

# Опциональные AI-провайдеры
ANTHROPIC_BASE_URL=
OPENAI_API_KEY=
OPENAI_BASE_URL=
GEMINI_API_KEY=
DEEPSEEK_API_KEY=
TAVILY_API_KEY=
AI_PROVIDER=

# Production и интеграции
CRON_SECRET=
ENCRYPTION_KEY=
BLOB_READ_WRITE_TOKEN=
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
NEXT_PUBLIC_APP_URL=
```

Запуск:

```bash
npm run dev
```

После установки зависимостей Prisma Client генерируется автоматически
через `postinstall`.

## Правила работы с базой данных

Не запускать `prisma migrate deploy` автоматически и не добавлять его в
build/deploy-скрипты.

После изменения `prisma/schema.prisma`:

1. подготовить SQL;
2. применить его вручную через Neon SQL Editor;
3. только после подтверждения выполнить:

```bash
npx prisma generate
```

## Архитектурные правила

- Server Components используются по умолчанию.
- Server Actions считаются доступными через прямой POST.
- Каждое защищённое действие повторно проверяет сессию.
- При работе с `projectId`, `artifactId`, `metricId` и другими ID нужно
  проверять принадлежность ресурса текущему пользователю.
- Вход Server Actions валидируется Zod.
- AI-ответ валидируется Zod до записи в БД.
- AI-генерация запускается только по явному действию пользователя.
- Бизнес-логика находится в `lib/services`, а не в React-компонентах.
- Не использовать `any`, `as any`, `@ts-ignore` и production
  `console.log`.
- Не логировать промпты, пользовательские данные и необработанные
  AI-ответы.

## Рекомендуемая следующая работа

1. Проверить официальный безопасный релиз Next.js после `16.2.12`.
2. Проверить обновление Prisma после `7.9.0`, закрывающее advisory
   `find-my-way` и `valibot`.
3. Добавить интеграционные тесты Server Actions:
   - отсутствие сессии;
   - IDOR / чужой `projectId`;
   - ограничения тарифов;
   - создание и обновление метрик.
4. Добавить тесты платёжного webhook ЮKassa:
   - повторная доставка webhook;
   - неизвестный payment ID;
   - неподтверждённый статус;
   - продление действующего тарифа.
5. Добавить smoke-тесты авторизации и основных пользовательских
   сценариев через Playwright.
6. Проверить production-переменные окружения в Vercel, не копируя
   секреты в задачи, логи или Markdown-файлы.

## Команда для первого сообщения новому агенту

```text
Изучи AGENTS.md, HANDOFF.md и локальную документацию Next.js 16 в
node_modules/next/dist/docs. Продолжи работу с текущей незакоммиченной
рабочей копией, не удаляй пользовательские изменения и не запускай
prisma migrate deploy. Сначала проверь git status, npm run lint,
npm test, npx tsc --noEmit и npm run build. После этого займись
следующим пунктом из раздела «Рекомендуемая следующая работа».
```
