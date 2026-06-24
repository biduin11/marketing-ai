import { DollarSign, Users, Percent, Target, type LucideIcon } from "lucide-react"

interface KpiCardProps {
  name: string
  target: string
}

// Pick an icon by KPI name keyword (monochrome, per design system).
function iconFor(name: string): LucideIcon {
  const n = name.toLowerCase()
  if (n.includes("выруч") || n.includes("revenue") || n.includes("доход"))
    return DollarSign
  if (n.includes("лид") || n.includes("lead")) return Users
  if (n.includes("конвер") || n.includes("conv")) return Percent
  return Target
}

export function KpiCard({ name, target }: KpiCardProps) {
  const Icon = iconFor(name)
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-xs font-medium">{name}</span>
      </div>
      <p className="mt-2 text-xl font-semibold text-foreground">{target}</p>
    </div>
  )
}
