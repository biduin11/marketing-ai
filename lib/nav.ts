import {
  BarChart3,
  Bell,
  BotMessageSquare,
  Building2,
  ChartLine,
  Crosshair,
  FileText,
  Home,
  LayoutList,
  Route,
  Settings,
  Tag,
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
      { label: "Главная", href: "/", icon: Home },
      { label: "Входящие", href: "/inbox", icon: Bell },
    ],
  },
  {
    label: "ПОНЯТЬ",
    items: [
      { label: "Бренд и оффер", href: "/company", icon: Building2 },
      { label: "Аудитория", href: "/audience", icon: Users },
      { label: "CJM", href: "/journey", icon: Route },
      { label: "Конкуренты", href: "/competitors", icon: Crosshair },
    ],
  },
  {
    label: "РЕШИТЬ",
    items: [
      { label: "Командный центр", href: "/director", icon: BotMessageSquare },
      { label: "Стратегия", href: "/strategy", icon: ChartLine },
      { label: "Перформанс", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "ДЕЛАТЬ",
    items: [
      { label: "Контент-студия", href: "/content", icon: LayoutList },
      { label: "Отчёты", href: "/reports", icon: FileText },
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
