# Graph Report - marketing_ai  (2026-06-24)

## Corpus Check
- 141 files · ~32,861 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 680 nodes · 1590 edges · 34 communities (27 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fc53dc70`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_AI Server Actions|AI Server Actions]]
- [[_COMMUNITY_App Layout & Navigation|App Layout & Navigation]]
- [[_COMMUNITY_Auth & Project Actions|Auth & Project Actions]]
- [[_COMMUNITY_Page Components & Routing|Page Components & Routing]]
- [[_COMMUNITY_Dependencies & Package Config|Dependencies & Package Config]]
- [[_COMMUNITY_Project Architecture Docs|Project Architecture Docs]]
- [[_COMMUNITY_Strategy & Utils|Strategy & Utils]]
- [[_COMMUNITY_Company Intelligence UI|Company Intelligence UI]]
- [[_COMMUNITY_Content Factory UI|Content Factory UI]]
- [[_COMMUNITY_Audience Module UI|Audience Module UI]]
- [[_COMMUNITY_Component Aliases & Config|Component Aliases & Config]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Root Layout & Providers|Root Layout & Providers]]
- [[_COMMUNITY_Public SVG Assets|Public SVG Assets]]
- [[_COMMUNITY_AI Client & Env|AI Client & Env]]
- [[_COMMUNITY_NextAuth Type Extensions|NextAuth Type Extensions]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Auth API Route|Auth API Route]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 34|Community 34]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 79 edges
2. `getLatestArtifact()` - 39 edges
3. `EmptyState()` - 25 edges
4. `Button()` - 24 edges
5. `getActiveProjectId()` - 23 edges
6. `computeInputHash()` - 22 edges
7. `generateStructured()` - 21 edges
8. `getNextVersion()` - 21 edges
9. `getProject()` - 19 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `AppLayout()` --calls--> `listProjects()`  [INFERRED]
  app/(app)/layout.tsx → lib/actions/projects.ts
- `DeltaBadge()` --calls--> `cn()`  [EXTRACTED]
  components/analytics/analytics-cards.tsx → lib/utils.ts
- `buildExecutiveReportInput()` --calls--> `fmt()`  [INFERRED]
  lib/ai/prompts/executiveReport.ts → components/analytics/analytics-table.tsx
- `RoiBadge()` --calls--> `cn()`  [EXTRACTED]
  components/analytics/analytics-table.tsx → lib/utils.ts
- `RoiBadge()` --calls--> `cn()`  [EXTRACTED]
  components/dashboard/top-channels.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **NextAuth v5 Edge/Node split: auth.config.ts (Edge) + auth.ts (Node) governed by nextauth_v5** — nextauth_v5, auth_config_ts, auth_ts [EXTRACTED 1.00]
- **AI generation flow: anthropic_sdk → lib_ai → prisma_model_aiartifact (explicit user trigger, versioned, zod-validated)** — anthropic_sdk, lib_ai, prisma_model_aiartifact [EXTRACTED 1.00]
- **Database stack: prisma_neon + lib_db + manual_db_migration — Neon Postgres with manual SQL migration policy** — prisma_neon, lib_db, manual_db_migration [EXTRACTED 1.00]

## Communities (34 total, 7 thin omitted)

### Community 0 - "AI Server Actions"
Cohesion: 0.09
Nodes (58): ActionResult, checkAiGate(), ownedProject(), reportInputSchema, runAudienceSegments(), runBuyerPersona(), runCjm(), runCompanyAnalysis() (+50 more)

### Community 1 - "App Layout & Navigation"
Cohesion: 0.15
Nodes (12): ProjectSwitcherProps, DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator() (+4 more)

### Community 2 - "Auth & Project Actions"
Cohesion: 0.27
Nodes (7): ActionResult, registerUser(), FormErrors, LoginInput, loginSchema, RegisterInput, registerSchema

### Community 3 - "Page Components & Routing"
Cohesion: 0.07
Nodes (42): getActiveProjectId(), ActionResult, getProject(), ProjectListItem, updateProject(), AnalyticsPage(), AudiencePage(), CompanyPage() (+34 more)

### Community 4 - "Dependencies & Package Config"
Cohesion: 0.05
Nodes (43): dependencies, @anthropic-ai/sdk, @base-ui/react, bcryptjs, class-variance-authority, clsx, jspdf, lucide-react (+35 more)

### Community 5 - "Project Architecture Docs"
Cohesion: 0.08
Nodes (38): This is NOT the Next.js you know, AI layer principles (explicit trigger, versioning, inputHash cache, zod validation), AI Marketing OS, Anthropic SDK (lib/ai/client.ts), App Router layout — (auth)/ and (app)/, auth.config.ts (Edge-compatible, no Prisma/bcrypt), auth.ts (Node.js, Prisma + bcrypt), Code principles (TypeScript strict, Zod, Server Components, no business logic in components) (+30 more)

### Community 6 - "Strategy & Utils"
Cohesion: 0.09
Nodes (23): ActionResult, toggleStrategyTask(), horizonSchema, horizonValues, kpiSchema, roadmapItemSchema, Strategy, strategySchema (+15 more)

### Community 7 - "Company Intelligence UI"
Cohesion: 0.16
Nodes (13): AnalyticsChart(), AnalyticsChartProps, AnalyticsView(), AnalyticsViewProps, Range, RANGES, MetricFormDialog(), calcRoi() (+5 more)

### Community 8 - "Content Factory UI"
Cohesion: 0.10
Nodes (19): CalendarItem, categoryBorder, categoryLabel, ContentCalendar(), ContentCalendarProps, DAY_NAMES, typeConfig, Week (+11 more)

### Community 9 - "Audience Module UI"
Cohesion: 0.07
Nodes (37): AudienceView(), AudienceViewProps, LoadingKey, Job, JtbdCard(), JtbdCardProps, Persona, PersonaCard() (+29 more)

### Community 10 - "Component Aliases & Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 11 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 12 - "Root Layout & Providers"
Cohesion: 0.28
Nodes (5): geistMono, geistSans, metadata, Providers(), Toaster()

### Community 13 - "Public SVG Assets"
Cohesion: 0.60
Nodes (5): File Icon SVG, Globe Icon SVG, Next.js Logo SVG, Vercel Logo SVG, Window/Browser Icon SVG

### Community 21 - "Community 21"
Cohesion: 0.08
Nodes (22): BillingResult, createBillingPortalSession(), createCheckoutSession(), { handlers, auth, signIn, signOut }, PLAN_LABELS, PLAN_LIMITS, PlanLimits, PlanName (+14 more)

### Community 22 - "Community 22"
Cohesion: 0.14
Nodes (14): AI Marketing OS — CLAUDE.md, AI-слой (ключевые принципы), graphify, Архитектура (где что живёт), База данных (текущая схема), Дизайн-система (токены в `app/globals.css`), Как обновлять этот файл, Переменные окружения (`.env` + Vercel) (+6 more)

### Community 23 - "Community 23"
Cohesion: 0.22
Nodes (11): DashboardView(), DashboardViewProps, DirectorCard(), DirectorCardProps, DirectorView(), DirectorViewProps, SEVERITY_COLOR, SEVERITY_LABEL (+3 more)

### Community 24 - "Community 24"
Cohesion: 0.25
Nodes (12): listMetrics(), HomePage(), DirectorPage(), GET(), buildDirectorInput(), DirectorContext, computeChannelBreakdown(), filterByRange() (+4 more)

### Community 25 - "Community 25"
Cohesion: 0.21
Nodes (9): AnalyticsCards(), AnalyticsCardsProps, CardDef, CARDS, DeltaBadge(), METRICS, MetricsSummary(), MetricsSummaryProps (+1 more)

### Community 26 - "Community 26"
Cohesion: 0.21
Nodes (9): AnalyticsTable(), AnalyticsTableProps, fmt(), RoiBadge(), RoiBadge(), TopChannels(), TopChannelsProps, ReportInput (+1 more)

### Community 27 - "Community 27"
Cohesion: 0.20
Nodes (17): cn(), Card(), CardAction(), CardContent(), CardDescription(), CardFooter(), CardHeader(), CardTitle() (+9 more)

### Community 28 - "Community 28"
Cohesion: 0.15
Nodes (12): setActiveProject(), active-project cookie + Zustand for active project state, NewProjectDialog(), ProjectCard(), ProjectCardItem, statusColor, statusLabel, ProjectSwitcher() (+4 more)

### Community 29 - "Community 29"
Cohesion: 0.17
Nodes (10): uploadReportPdf(), ArtifactType, getDefaultRange(), ReportEntry, ReportsView(), ReportsViewProps, ReportTab, TABS (+2 more)

### Community 30 - "Community 30"
Cohesion: 0.24
Nodes (9): listProjects(), AppLayout(), AppHeader(), AppHeaderProps, AppSidebar(), AppSidebarProps, ProjectListItem, NavItem (+1 more)

### Community 31 - "Community 31"
Cohesion: 0.12
Nodes (22): createProject(), CHANNELS, MetricFormDialogProps, CompanyCardDialogProps, FormErrors, NewProjectDialogProps, UpgradeGateProps, FormErrors (+14 more)

### Community 32 - "Community 32"
Cohesion: 0.24
Nodes (7): ActionResult, createMetric(), ownedProject(), CreateMetricInput, createMetricSchema, UpdateMetricInput, updateMetricSchema

## Knowledge Gaps
- **197 isolated node(s):** `FormErrors`, `FormErrors`, `geistSans`, `geistMono`, `metadata` (+192 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 27` to `App Layout & Navigation`, `Page Components & Routing`, `Strategy & Utils`, `Company Intelligence UI`, `Content Factory UI`, `Audience Module UI`, `Community 21`, `Community 23`, `Community 25`, `Community 26`, `Community 28`, `Community 29`, `Community 30`, `Community 31`?**
  _High betweenness centrality (0.154) - this node is a cross-community bridge._
- **Why does `Recharts (monochrome charts)` connect `Project Architecture Docs` to `Company Intelligence UI`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Dependencies & Package Config` to `Community 28`, `Project Architecture Docs`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **What connects `FormErrors`, `FormErrors`, `geistSans` to the rest of the system?**
  _198 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AI Server Actions` be split into smaller, more focused modules?**
  _Cohesion score 0.0902304446608244 - nodes in this community are weakly interconnected._
- **Should `Page Components & Routing` be split into smaller, more focused modules?**
  _Cohesion score 0.07211538461538461 - nodes in this community are weakly interconnected._
- **Should `Dependencies & Package Config` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._