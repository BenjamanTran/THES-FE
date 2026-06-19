"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  value: number
  sizeClassName?: string
  className?: string
  showValue?: boolean
}

export function formatStars(value: number) {
  return value.toFixed(2).replace(/\.?0+$/, "")
}

export function StarRating({ value, sizeClassName = "h-4 w-4", className, showValue = false }: StarRatingProps) {
  const normalized = Math.min(5, Math.max(0, value))

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {showValue && (
        <span className="tabular-nums text-current">{formatStars(normalized)}</span>
      )}
      <div className="flex gap-0.5" aria-label={`${formatStars(normalized)} sao`}>
        {[0, 1, 2, 3, 4].map((index) => {
          const fill = Math.min(1, Math.max(0, normalized - index))

          return (
            <span key={index} className={cn("relative inline-block", sizeClassName)}>
              <Star className={cn("absolute inset-0 text-muted-foreground/30", sizeClassName)} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={cn("fill-amber-400 text-amber-400", sizeClassName)} />
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
