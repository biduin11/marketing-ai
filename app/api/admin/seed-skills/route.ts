/**
 * app/api/admin/seed-skills/route.ts
 *
 * Одноразовый (или пере-запускаемый при обновлении .md-файлов) эндпоинт.
 * Выполняется на Vercel — DATABASE_URL / OPENAI_API_KEY / ANTHROPIC_API_KEY
 * уже подставлены средой, ничего локально пуллить не нужно.
 *
 * Защищён секретом из заголовка — без него любой в интернете сможет
 * дёргать твою базу и жечь OpenAI-квоту.
 */

import { NextRequest, NextResponse } from "next/server";
import { seedSkill, HEAVY_SKILLS } from "@/lib/skill-seeding";

export const runtime = "nodejs";
export const maxDuration = 60; // сек. На Hobby-плане может быть меньше лимит — см. по одному скилу за вызов

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-seed-secret");
  if (!secret || secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const skillParam = req.nextUrl.searchParams.get("skill");
  const skillsToRun = skillParam ? [skillParam] : HEAVY_SKILLS;

  if (skillParam && !HEAVY_SKILLS.includes(skillParam)) {
    return NextResponse.json({ error: `неизвестный skill: ${skillParam}` }, { status: 400 });
  }

  const results: Record<string, number | string> = {};
  for (const slug of skillsToRun) {
    try {
      results[slug] = await seedSkill(slug);
    } catch (e) {
      results[slug] = `ошибка: ${(e as Error).message}`;
    }
  }

  return NextResponse.json({ ok: true, results });
}
