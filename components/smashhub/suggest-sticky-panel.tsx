"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SuggestStickyPanelProps {
  /** Show suggest / priority / pair blocks with height transition */
  open: boolean
  children: ReactNode
  className?: string
}

/** Collapses sticky suggest area without layout jump (grid 0fr → 1fr). */
export function SuggestStickyPanel({
  open,
  children,
  className,
}: SuggestStickyPanelProps) {
  return (
    <div
      className={cn(
        "suggest-expand grid transition-[grid-template-rows,opacity] duration-300 ease-out",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        className,
      )}
      aria-hidden={!open}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  )
}
