"use client"

import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { SKILL_LABELS } from "../skill-badge"
import { formatVndShort } from "@/lib/format"
import type { MatchesVm } from "./types"

export function MatchesActiveFilterChips({ vm }: { vm: MatchesVm }) {
  const { filters, removeFilter, locationActive } = vm

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {filters.tier && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1 px-2 py-1 rounded-full flex-shrink-0"
        >
          {SKILL_LABELS[filters.tier]}
          <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter("tier")} />
        </Badge>
      )}
      {filters.matchType !== "any" && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1 px-2 py-1 rounded-full flex-shrink-0"
        >
          {filters.matchType === "singles" ? "Đơn" : "Đôi"}
          <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter("matchType")} />
        </Badge>
      )}
      {filters.notFull && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1 px-2 py-1 rounded-full flex-shrink-0"
        >
          Còn chỗ
          <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter("notFull")} />
        </Badge>
      )}
      {filters.useLocation && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1 px-2 py-1 rounded-full flex-shrink-0"
        >
          {locationActive ? `≤ ${filters.radiusKm} km` : "Theo vị trí"}
          <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter("useLocation")} />
        </Badge>
      )}
      {filters.priceMax > 0 && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1 px-2 py-1 rounded-full flex-shrink-0"
        >
          ≤ {formatVndShort(filters.priceMax)}
          <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter("priceMax")} />
        </Badge>
      )}
    </div>
  )
}
