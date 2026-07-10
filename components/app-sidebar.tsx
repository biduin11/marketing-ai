"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LogOut, PanelLeftClose, PanelLeftOpen, X, Zap } from "lucide-react"
import { navGroups } from "@/lib/nav"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

const COLLAPSED_KEY = "sidebar-collapsed"

interface AppSidebarProps {
  userEmail?: string | null
  userName?: string | null
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function AppSidebar({
  userEmail,
  userName,
  mobileOpen = false,
  onMobileClose,
}: AppSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  // На мобильном overlay всегда показывает полный список — collapsed влияет только на десктоп-ширину
  const hideLabels = collapsed && !mobileOpen

  useEffect(() => {
    const saved = localStorage.getItem(COLLAPSED_KEY)
    if (saved === "1") setCollapsed(true)
  }, [])

  function toggle() {
    setCollapsed((v) => {
      localStorage.setItem(COLLAPSED_KEY, v ? "0" : "1")
      return !v
    })
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar shadow-xl transition-transform duration-300",
        "md:static md:z-auto md:w-60 md:shadow-none md:transition-[width] md:duration-200 md:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        collapsed ? "md:w-14" : "md:w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-3">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent-foreground/10 ring-1 ring-sidebar-accent-foreground/20">
          <Zap className="size-4 text-sidebar-accent-foreground" />
        </div>
        {!hideLabels && (
          <span className="truncate text-sm font-semibold text-sidebar-accent-foreground">
            AI Marketing OS
          </span>
        )}
        <button
          onClick={toggle}
          className={cn(
            "ml-auto hidden size-6 items-center justify-center rounded text-sidebar-primary hover:text-sidebar-accent-foreground md:flex",
            collapsed && "mx-auto"
          )}
          title={collapsed ? "Развернуть" : "Свернуть"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </button>
        <button
          onClick={onMobileClose}
          className="ml-auto flex min-h-[44px] min-w-[44px] items-center justify-center rounded text-sidebar-primary hover:text-sidebar-accent-foreground md:hidden"
          aria-label="Закрыть меню"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {navGroups.map((group, gi) => (
          <div key={gi} className={cn(gi > 0 && "mt-3")}>
            {group.label && !hideLabels && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-primary/50">
                {group.label}
              </p>
            )}
            {group.label && hideLabels && gi > 0 && (
              <div className="mx-3 mb-2 mt-1 border-t border-sidebar-border" />
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={hideLabels ? item.label : undefined}
                      onClick={onMobileClose}
                      className={cn(
                        "flex min-h-[44px] items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors md:min-h-0",
                        hideLabels && "justify-center",
                        isActive
                          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : "text-sidebar-primary hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className="size-4 shrink-0" />
                      {!hideLabels && <span className="truncate">{item.label}</span>}
                      {!hideLabels && item.badge && (
                        <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-sidebar-accent-foreground/15 px-1 text-[10px] font-semibold text-sidebar-accent-foreground">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border p-3">
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-2 py-1.5",
            hideLabels && "justify-center px-0"
          )}
        >
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent-foreground/10 text-xs font-medium text-sidebar-accent-foreground">
            {(userName ?? userEmail ?? "U").charAt(0).toUpperCase()}
          </div>
          {!hideLabels && (
            <div className="min-w-0 flex-1">
              {userName && (
                <p className="truncate text-xs font-medium text-sidebar-accent-foreground">
                  {userName}
                </p>
              )}
              <p className="truncate text-xs text-sidebar-primary">
                {userEmail ?? ""}
              </p>
            </div>
          )}
          {!hideLabels && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => signOut({ redirectTo: "/login" })}
              title="Выйти"
              className="text-sidebar-primary hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  )
}
