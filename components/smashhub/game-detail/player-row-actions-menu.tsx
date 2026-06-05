"use client"

import { useState } from "react"
import { Settings, type LucideIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type PlayerRowAction = {
  id: string
  label: string
  icon: LucideIcon
  onClick: () => void
  variant?: "default" | "destructive" | "primary"
}

interface PlayerRowActionsMenuProps {
  actions: PlayerRowAction[]
}

export function PlayerRowActionsMenu({ actions }: PlayerRowActionsMenuProps) {
  const [open, setOpen] = useState(false)

  if (actions.length === 0) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          aria-label="Thao tác người chơi"
          onClick={(e) => e.stopPropagation()}
        >
          <Settings className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-44 p-1"
        onClick={(e) => e.stopPropagation()}
      >
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              action.onClick()
              setOpen(false)
            }}
            className={cn(
              "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium text-left transition-colors",
              action.variant === "destructive"
                ? "text-destructive hover:bg-destructive/10"
                : action.variant === "primary"
                  ? "text-primary hover:bg-primary/10"
                  : "text-foreground hover:bg-secondary/60",
            )}
          >
            <action.icon className="w-3.5 h-3.5 shrink-0" />
            {action.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
