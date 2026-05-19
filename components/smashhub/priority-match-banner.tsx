"use client"

import { Loader2, Play, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatMatchLabel } from "@/lib/suggest-next-match"
import type { MatchSummary } from "@/lib/api"

interface PriorityMatchBannerProps {
  match: MatchSummary
  reason: string
  canStart: boolean
  loading?: boolean
  onStart: () => void
}

export function PriorityMatchBanner({
  match,
  reason,
  canStart,
  loading,
  onStart,
}: PriorityMatchBannerProps) {
  return (
    <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 px-3 py-2.5 mb-2">
      <div className="flex items-start gap-2">
        <Star className="w-4 h-4 shrink-0 mt-0.5 fill-amber-500 text-amber-500" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
            Trận ưu tiên
          </p>
          <p className="text-xs font-medium text-foreground mt-0.5 leading-snug break-words">
            {formatMatchLabel(match)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{reason}</p>
        </div>
        {canStart ? (
          <Button
            size="sm"
            className="shrink-0 h-9 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3"
            disabled={loading}
            onClick={onStart}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Play className="w-3.5 h-3.5 mr-1" />
                Bắt đầu
              </>
            )}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
