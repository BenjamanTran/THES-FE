"use client"

import { Loader2, Play, Sparkles, Plus, ListPlus, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { NextMatchSuggestion } from "@/lib/suggest-next-match"

interface NextMatchSuggestProps {
  suggestion: NextMatchSuggestion
  /** Live start / create+start only when within game time window */
  isGameTime?: boolean
  loading?: boolean
  batchLoading?: boolean
  /** Hide bulk queue when more than 2 matches are already waiting */
  showBatchActions?: boolean
  onStart: () => void
  onCreateAndStart: () => void
  onQueue: () => void
  onGenerateBatch: (count: 10 | 15) => void
}

export function NextMatchSuggest({
  suggestion,
  isGameTime = true,
  loading,
  batchLoading,
  showBatchActions = true,
  onStart,
  onCreateAndStart,
  onQueue,
  onGenerateBatch,
}: NextMatchSuggestProps) {
  const isWaitCourt = suggestion.kind === "wait_court"
  const isWaitPlayers = suggestion.kind === "wait_players"
  const isWait = isWaitCourt || isWaitPlayers
  const isBatchOnly = suggestion.kind === "batch"

  let primaryLabel: string | null = null
  let PrimaryIcon: LucideIcon | null = null
  let primaryOnClick: (() => void) | null = null

  if (!isWait && !isBatchOnly) {
    if (suggestion.kind === "start" && isGameTime) {
      primaryLabel = "Bắt đầu"
      PrimaryIcon = Play
      primaryOnClick = onStart
    } else if (suggestion.kind === "queue" || (suggestion.kind === "create" && !isGameTime)) {
      primaryLabel = "Thêm hàng chờ"
      PrimaryIcon = ListPlus
      primaryOnClick = onQueue
    } else if (suggestion.kind === "create" && isGameTime) {
      primaryLabel = "Tạo & bắt đầu"
      PrimaryIcon = Plus
      primaryOnClick = onCreateAndStart
    }
  }

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 mb-2 ${
        isWait ? "border-amber-500/40 bg-amber-500/10" : "border-primary/40 bg-primary/10"
      }`}
    >
      <div className="flex items-start gap-2">
        <Sparkles
          className={`w-4 h-4 shrink-0 mt-0.5 ${isWait ? "text-amber-500" : "text-primary"}`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-primary uppercase tracking-wide">
            {isWaitPlayers
              ? "Chờ người rảnh (còn sân)"
              : isWaitCourt
                ? "Trận tiếp theo (chờ sân)"
                : !isGameTime
                  ? "Gợi ý xếp trận (chưa tới giờ)"
                  : "Gợi ý trận tiếp theo"}
          </p>
          <p className="text-xs font-medium text-foreground mt-0.5 leading-snug break-words">
            {suggestion.label}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{suggestion.reason}</p>
        </div>
        {primaryLabel && PrimaryIcon && primaryOnClick ? (
          <Button
            size="sm"
            className="shrink-0 h-9 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3"
            disabled={loading || batchLoading}
            onClick={primaryOnClick}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <PrimaryIcon className="w-3.5 h-3.5 mr-1" />
                {primaryLabel}
              </>
            )}
          </Button>
        ) : null}
      </div>

      {showBatchActions ? (
        <div className="flex gap-1.5 mt-2 pl-6">
          {([10, 15] as const).map((n) => (
            <Button
              key={n}
              size="sm"
              variant="secondary"
              className="flex-1 h-8 rounded-full text-[11px] font-medium"
              disabled={loading || batchLoading}
              onClick={() => onGenerateBatch(n)}
            >
              {batchLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                `Xếp ${n} trận`
              )}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
