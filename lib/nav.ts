import {
  BarChart3,
  Bell,
  Bot,
  Building2,
  CalendarDays,
  ChartLine,
  ClipboardCheck,
  ClipboardList,
  Crosshair,
  FileText,
  Home,
  LayoutList,
  Route,
  Settings,
  Star,
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
      { label: "Command Center", href: "/", icon: Home },
      { label: "AI Директор", href: "/director", icon: Bot },
      { label: "Входящие", href: "/inbox", icon: Bell },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      { label: "Аудит", href: "/audit", icon: ClipboardCheck },
      { label: "Бренд", href: "/company", icon: Building2 },
      { label: "Конкуренты", href: "/competitors", icon: Crosshair },
      { label: "Клиент", href: "/audience", icon: Users },
      { label: "Путь клиента", href: "/journey", icon: Route },
      { label: "Офферы", href: "/offers", icon: Tag },
    ],
  },
  {
    label: "STRATEGY",
    items: [
      { label: "Стратегия", href: "/strategy", icon: ChartLine },
      { label: "Спринт", href: "/sprint", icon: CalendarDays },
    ],
  },
  {
    label: "EXECUTION",
    items: [
      { label: "Контент", href: "/content", icon: LayoutList },
      { label: "Брифы", href: "/briefs", icon: ClipboardList },
    ],
  },
  {
    label: "RESULTS",
    items: [
      { label: "Аналитика", href: "/analytics", icon: BarChart3 },
      { label: "Репутация", href: "/reputation", icon: Star },
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
