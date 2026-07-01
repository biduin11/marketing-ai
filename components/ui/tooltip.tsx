"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProviderProps {
  children: React.ReactNode
}

function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>
}

interface TooltipContextValue {
  open: boolean
  setOpen: (v: boolean) => void
}

const TooltipContext = React.createContext<TooltipContextValue>({
  open: false,
  setOpen: () => {},
})

interface TooltipProps {
  children: React.ReactNode
  defaultOpen?: boolean
}

function Tooltip({ children, defaultOpen = false }: TooltipProps) {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <span className="relative inline-flex items-center">{children}</span>
    </TooltipContext.Provider>
  )
}

interface TooltipTriggerProps {
  children: React.ReactNode
  asChild?: boolean
  className?: string
}

function TooltipTrigger({ children, className }: TooltipTriggerProps) {
  const { setOpen } = React.useContext(TooltipContext)
  return (
    <span
      className={cn("inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
    </span>
  )
}

interface TooltipContentProps {
  children: React.ReactNode
  side?: "top" | "bottom" | "left" | "right"
  className?: string
  sideOffset?: number
}

function TooltipContent({
  children,
  side = "top",
  className,
}: TooltipContentProps) {
  const { open } = React.useContext(TooltipContext)
  if (!open) return null

  const positionClass = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-1",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1",
    left: "right-full top-1/2 -translate-y-1/2 mr-1",
    right: "left-full top-1/2 -translate-y-1/2 ml-1",
  }[side]

  return (
    <div
      className={cn(
        "absolute z-50 w-max max-w-xs rounded-lg border border-[#eaeaea] bg-white px-3 py-2 text-xs text-foreground shadow-md",
        positionClass,
        className
      )}
    >
      {children}
    </div>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
