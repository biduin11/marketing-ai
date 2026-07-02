import {
  BarChart3,
  Bell,
  Building2,
  ChartLine,
  Crosshair,
  Home,
  LayoutList,
  Settings,
  Star,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: string
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: "",
    items: [
      { label: "Command Center", href: "/", icon: Home },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      { label: "Бренд", href: "/company", icon: Building2 },
      { label: "Рынок", href: "/competitors", icon: Crosshair },
      { label: "Клиент", href: "/audience", icon: Users },
    ],
  },
  {
    label: "STRATEGY",
    items: [
      { label: "Стратегия", href: "/strategy", icon: ChartLine },
    ],
  },
  {
    label: "EXECUTION",
    items: [
      { label: "Контент", href: "/content", icon: LayoutList },
    ],
  },
  {
    label: "RESULTS",
    items: [
      { label: "Аналитика", href: "/analytics", icon: BarChart3 },
      { label: "Репутация", href: "/reputation", icon: Star },
    ],
  },
  {
    label: "",
    items: [
      { label: "Настройки", href: "/settings", icon: Settings },
    ],
  },
]

// Flat list for backward compat
export const navItems: NavItem[] = navGroups.flatMap((g) => g.items)
