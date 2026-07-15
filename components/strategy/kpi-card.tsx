import { DollarSign, Users, Percent, Target } from "lucide-react"

interface KpiCardProps {
  name: string
  target: string
}

// Pick an icon by KPI name keyword (monochrome, per design system).
function iconFor(name: string) {
  const n = name.toLowerCase()
  if (n.includes("выруч") || n.includes("revenue") || n.includes("доход"))
    return <DollarSign className="size-4" />
  if (n.includes("лид") || n.includes("lead"))
    return <Users className="size-4" />
  if (n.includes("конвер") || n.includes("conv"))
    return <Percent className="size-4" />
  return <Target className="size-4" />
}

export function KpiCard({ name, target }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {iconFor(name)}
        <span className="text-xs font-medium">{name}</span>
      </div>
      <p className="mt-2 text-xl font-semibold text-foreground">{target}</p>
    </div>
  )
}
