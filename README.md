# Marketing AI

Marketing AI — SaaS-система для ведения маркетинговых проектов. Она объединяет аудит компании, анализ рынка и аудитории, стратегию, контент, гипотезы, метрики и AI-рекомендации в одном рабочем пространстве.

## Стек

- Next.js 16, React 19 и TypeScript
- PostgreSQL и Prisma 7
- NextAuth 5
- Tailwind CSS 4 и shadcn/ui
- Anthropic, OpenAI и Gemini
- Stripe, Yandex Metrika и Vercel Cron

## Локальный запуск

Требования: Node.js 20+, npm и PostgreSQL.

1. Скопируйте `.env.example` в `.env.local` и заполните обязательные значения.
2. Установите зависимости:

   ```bash
   npm ci
   ```

3. Примените схему Prisma к локальной базе удобным для вашей среды способом, например:

   ```bash
   npx prisma db push
   ```

4. Запустите приложение:

   ```bash
   npm run dev
   ```

Приложение будет доступно на [http://localhost:3000](http://localhost:3000).

## Переменные окружения

Обязательные для основного приложения:

- `DATABASE_URL` — подключение к PostgreSQL;
- `AUTH_SECRET` — секрет NextAuth длиной не менее 32 символов;
- `ANTHROPIC_API_KEY` — основной ключ Anthropic.

Обязательные для соответствующих функций:

- `CRON_SECRET` — защита всех `/api/cron/*`, не менее 32 символов;
- `ENCRYPTION_KEY` — шифрование токенов Яндекс Метрики; рекомендуется случайное значение длиной 32+ символа;
- `OPENAI_API_KEY` и `GEMINI_API_KEY` — AI-маршрутизация и fallback;
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID` — подписка Pro;
- `NEXT_PUBLIC_APP_URL` — публичный адрес приложения.

Полный список находится в `.env.example`. `SKIP_ENV_VALIDATION=1` предназначен только для сборки образа без runtime-секретов.

## Команды проверки

```bash
npm run lint
npm test
npm run build
```

## Архитектура

- `app/` — страницы, layouts, API и фоновые обработчики;
- `components/` — функциональные экраны и UI-компоненты;
- `lib/actions/` — авторизованные server actions;
- `lib/services/` — бизнес-логика и внутренние серверные операции;
- `lib/ai/` — маршрутизация, промпты и Zod-схемы AI-ответов;
- `prisma/schema.prisma` — модель данных.

Пользовательские операции должны проверять владельца проекта в server action. Фоновые задачи не должны вызывать пользовательские actions: для них используются внутренние серверные сервисы после проверки `CRON_SECRET`.
