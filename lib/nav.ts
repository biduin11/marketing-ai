import {
  BarChart3,
  BotMessageSquare,
  Building2,
  ChartLine,
  Crosshair,
  FileText,
  Home,
  LayoutList,
  Megaphone,
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
}

export const navItems: NavItem[] = [
  { label: "Главная", href: "/", icon: Home },
  { label: "AI Директор", href: "/director", icon: BotMessageSquare },
  { label: "Анализ компании", href: "/company", icon: Building2 },
  { label: "Аудитория", href: "/audience", icon: Users },
  { label: "Конкуренты", href: "/competitors", icon: Crosshair },
  { label: "Офферы", href: "/offers", icon: Tag },
  { label: "Стратегия", href: "/strategy", icon: ChartLine },
  { label: "CJM", href: "/journey", icon: Route },
  { label: "Контент-план", href: "/content", icon: LayoutList },
  { label: "Кампании", href: "/campaigns", icon: Megaphone },
  { label: "Аналитика", href: "/analytics", icon: BarChart3 },
  { label: "Отчёты", href: "/reports", icon: FileText },
  { label: "Настройки", href: "/settings", icon: Settings },
]
