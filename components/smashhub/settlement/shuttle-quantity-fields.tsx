"use client"

import { Input } from "@/components/ui/input"
import { Settings2 } from "lucide-react"
import { formatVnd } from "@/lib/format"
import { perShuttleVnd } from "@/lib/settlement/shuttle-expense"
import type { ShuttleSettings } from "@/lib/settlement/shuttle-expense"

interface ShuttleQuantityFieldsProps {
  settings: ShuttleSettings
  quantity: number
  totalVnd: number
  disabled?: boolean
  onQuantityChange: (quantity: number) => void
  onOpenSettings: () => void
}

export function ShuttleQuantityFields({
  settings,
  quantity,
  totalVnd,
  disabled,
  onQuantityChange,
  onOpenSettings,
}: ShuttleQuantityFieldsProps) {
  const perShuttle = perShuttleVnd(settings.tube_vnd, settings.per_tube)

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <button
        type="button"
        disabled={disabled}
        onClick={onOpenSettings}
        className="p-1.5 rounded-full text-muted-foreground hover:text-primary shrink-0 disabled:opacity-40"
        aria-label="Cài đặt cầu"
      >
        <Settings2 className="w-3.5 h-3.5" />
      </button>
      <div className="relative min-w-[3.5rem] max-w-[5rem] flex-1">
        <Input
          type="text"
          inputMode="numeric"
          value={quantity > 0 ? String(quantity) : ""}
          onChange={(e) => {
            const n = Number(e.target.value.replace(/\D/g, "")) || 0
            onQuantityChange(Math.max(0, Math.floor(n)))
          }}
          placeholder="0"
          disabled={disabled}
          className="h-9 text-xs pr-1 tabular-nums"
          style={{ paddingRight: "28px" }}
        />
        <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-muted-foreground">
          quả
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground min-w-0 truncate hidden sm:inline">
        {formatVnd(perShuttle)}/quả
      </span>
      <span className="text-[10px] text-muted-foreground min-w-[4.5rem] text-right tabular-nums shrink-0">
        = {formatVnd(totalVnd)}
      </span>
    </div>
  )
}
