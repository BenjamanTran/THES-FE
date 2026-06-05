"use client"

import { ChevronRight, Wallet } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatPriceRange } from "@/lib/format"
import { cn } from "@/lib/utils"

interface SettlementEntryRowProps {
  minPrice: number
  maxPrice: number
  statusLabel: string
  onClick: () => void
  className?: string
}

export function SettlementEntryRow({
  minPrice,
  maxPrice,
  statusLabel,
  onClick,
  className,
}: SettlementEntryRowProps) {
  const published = statusLabel === "Đã công bố"

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl border border-border/50 p-4 transition-colors hover:border-primary/30",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Wallet className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-semibold">Giá / slot</span>
        </div>
        <span className="text-sm font-bold text-foreground shrink-0">
          {formatPriceRange(minPrice, maxPrice)}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">Cho toàn bộ thời gian chơi</p>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-primary">Tính tiền buổi</span>
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] px-1.5 py-0 rounded-full",
              published
                ? "border-emerald-500/40 text-emerald-500"
                : statusLabel === "Nháp"
                  ? "border-amber-500/40 text-amber-500"
                  : "border-muted-foreground/40 text-muted-foreground",
            )}
          >
            {statusLabel}
          </Badge>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>
    </button>
  )
}
