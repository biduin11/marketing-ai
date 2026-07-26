# AI Marketing OS

Веб-приложение для управления маркетингом: аудит компании и рынка,
сегментация аудитории, анализ конкурентов, офферы, CJM, контент-план,
аналитика, спринты, отчёты и рекомендации AI-директора.

## Стек

- Next.js 16, React 19, TypeScript
- Tailwind CSS 4 и shadcn/ui
- Prisma 7 и PostgreSQL (Neon)
- Auth.js / NextAuth 5
- OpenAI, Anthropic и Gemini
- Zustand, Recharts, Vercel Blob

## Локальный запуск

Требуется актуальная LTS-версия Node.js и доступная PostgreSQL.

```bash
npm ci
npm run dev
```

Приложение будет доступно по адресу
[http://localhost:3000](http://localhost:3000).

Минимальный `.env.local`:

```dotenv
DATABASE_URL=postgresql://...
AUTH_SECRET=...
AUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=...
```

Дополнительные интеграции включаются соответствующими переменными:

```dotenv
ANTHROPIC_BASE_URL=
OPENAI_API_KEY=
OPENAI_BASE_URL=
GEMINI_API_KEY=
DEEPSEEK_API_KEY=
TAVILY_API_KEY=
AI_PROVIDER=

CRON_SECRET=
ENCRYPTION_KEY=
BLOB_READ_WRITE_TOKEN=

YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
NEXT_PUBLIC_APP_URL=
```

## Проверки

```bash
npm run lint
npm test
npx tsc --noEmit
npm run build
npm audit --omit=dev
```

## Структура

- `app/` — маршруты, layouts, route handlers и cron endpoints.
- `components/` — UI и компоненты предметных модулей.
- `lib/actions/` — Server Actions, валидация запросов и контроль доступа.
- `lib/services/` — бизнес-логика.
- `lib/ai/` — маршрутизация AI-провайдеров, промпты и Zod-схемы.
- `prisma/schema.prisma` — схема данных.

Защищённые действия должны повторно проверять сессию и принадлежность
ресурса пользователю. AI-ответы валидируются Zod-схемами до сохранения.

## База данных

Проект не запускает миграции автоматически при сборке или деплое.
Изменения схемы применяются вручную в Neon SQL Editor, после чего
обновляется Prisma Client:

```bash
npx prisma generate
```

Не добавляйте `prisma migrate deploy` в build-скрипты.

## Деплой

Приложение рассчитано на Vercel. Расписания cron находятся в
`vercel.json`; все cron endpoints защищаются через `CRON_SECRET`.
Переменные окружения для production задаются в настройках проекта Vercel.
