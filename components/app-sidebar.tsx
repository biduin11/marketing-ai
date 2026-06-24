"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LogOut, Zap } from "lucide-react"
import { navItems } from "@/lib/nav"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface AppSidebarProps {
  userEmail?: string | null
  userName?: string | null
}

export function AppSidebar({ userEmail, userName }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
          <Zap className="size-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-semibold text-foreground">
          AI Marketing OS
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent font-medium text-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
            {(userName ?? userEmail ?? "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            {userName && (
              <p className="truncate text-xs font-medium text-foreground">
                {userName}
              </p>
            )}
            <p className="truncate text-xs text-muted-foreground">
              {userEmail ?? ""}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => signOut({ redirectTo: "/login" })}
            title="Выйти"
          >
            <LogOut className="size-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
