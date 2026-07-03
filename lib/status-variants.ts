import { Tag, Megaphone, Gift, BookOpen, type LucideIcon } from "lucide-react"
import type { OfferType } from "@/lib/ai/schemas/offer"

/**
 * Semantic status tone — single source of truth for status→appearance mapping.
 * Maps 1:1 to Badge variants (see components/ui/badge.tsx) and design tokens.
 */
export type StatusTone = "success" | "warning" | "danger" | "neutral" | "muted"

/** CSS custom property per tone — for inline `style` (SVG strokes, dynamic bars). */
export const TONE_CSS_VAR: Record<StatusTone, string> = {
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  danger: "var(--color-danger)",
  neutral: "var(--color-foreground)",
  muted: "var(--color-muted-foreground)",
}

/** Tailwind utility classes per tone — for text / surface / border. */
export const TONE_CLASSES: Record<
  StatusTone,
  { text: string; bg: string; border: string }
> = {
  success: { text: "text-success", bg: "bg-success/10", border: "border-success/20" },
  warning: { text: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
  danger: { text: "text-danger", bg: "bg-danger/10", border: "border-danger/20" },
  neutral: { text: "text-foreground", bg: "bg-muted", border: "border-border" },
  muted: { text: "text-muted-foreground", bg: "bg-muted/50", border: "border-border" },
}

/**
 * ROMI → tone. Thresholds: >400% healthy · 0–400% caution · ≤0 loss.
 */
export function romiTone(romi: number): StatusTone {
  if (romi > 400) return "success"
  if (romi > 0) return "warning"
  return "danger"
}

/** Presentation metadata for an offer type — label, tone and icon. */
export interface OfferTypeMeta {
  label: string
  tone: StatusTone
  icon: LucideIcon
}

export const OFFER_TYPE_META: Record<OfferType, OfferTypeMeta> = {
  utp: { label: "УТП", tone: "neutral", icon: Tag },
  promotion: { label: "Акция", tone: "warning", icon: Megaphone },
  special: { label: "Спецпредложение", tone: "success", icon: Gift },
  lead_magnet: { label: "Лид-магнит", tone: "muted", icon: BookOpen },
}
