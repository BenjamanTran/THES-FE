"use client"

import { Loader2, Play, Sparkles, Plus, ListPlus, Link2, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { NextMatchSuggestion } from "@/lib/suggest-next-match"
import { cn } from "@/lib/utils"

interface NextMatchSuggestProps {
  suggestion?: NextMatchSuggestion | null
  /** Live start / create+start only when within game time window */
  isGameTime?: boolean
  loading?: boolean
  onStart: () => void
  onCreateAndStart: () => void
  onQueue: () => void
  /** Doubles: arrange match keeping pairs on each side (free players only) */
  showPairArrange?: boolean
  pairArrangeLabel?: string
  pairArrangeHint?: string
  pairArrangeDisabled?: boolean
  onArrangePair?: () => void
  pairArrangeLoading?: boolean
}

export function NextMatchSuggest({
  suggestion,
  isGameTime = true,
  loading,
  onStart,
  onCreateAndStart,
  onQueue,
  showPairArrange = false,
  pairArrangeLabel = "Sắp xếp cặp đấu",
  pairArrangeHint,
  pairArrangeDisabled = false,
  onArrangePair,
  pairArrangeLoading = false,
}: NextMatchSuggestProps) {
  if (!suggestion) {
    if (!showPairArrange || !onArrangePair) return null
    return (
      <div className="rounded-xl border border-border/40 bg-secondary/20 px-3 py-2.5 mb-2 space-y-2 transition-colors duration-300">
        <PairArrangeBlock
          label={pairArrangeLabel}
          hint={pairArrangeHint}
          disabled={pairArrangeDisabled}
          loading={pairArrangeLoading || loading}
          onArrangePair={onArrangePair}
        />
      </div>
    )
  }

  const isWaitCourt = suggestion.kind === "wait_court"
  const isWaitPlayers = suggestion.kind === "wait_players"
  const isWait = isWaitCourt || isWaitPlayers
  const altQueue =
    suggestion.kind === "start" || suggestion.kind === "create"
      ? suggestion.altQueue
      : undefined

  let primaryLabel: string | null = null
  let PrimaryIcon: LucideIcon | null = null
  let primaryOnClick: (() => void) | null = null
  let secondaryLabel: string | null = null
  let SecondaryIcon: LucideIcon | null = null
  let secondaryOnClick: (() => void) | null = null

  if (!isWait) {
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

    if (altQueue && isGameTime && suggestion.kind !== "queue") {
      secondaryLabel = "Thêm hàng chờ"
      SecondaryIcon = ListPlus
      secondaryOnClick = onQueue
    }
  }

  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5 mb-2 transition-colors duration-300",
        isWait ? "border-amber-500/40 bg-amber-500/10" : "border-primary/40 bg-primary/10",
      )}
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
          {altQueue ? (
            <p className="text-[10px] text-primary/90 mt-1 leading-snug">
              Hàng chờ tiếp: {altQueue.label} — {altQueue.reason}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {primaryLabel && PrimaryIcon && primaryOnClick ? (
            <Button
              size="sm"
              className="h-9 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3"
              disabled={loading}
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
          {secondaryLabel && SecondaryIcon && secondaryOnClick ? (
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-full text-xs px-3"
              disabled={loading}
              onClick={secondaryOnClick}
            >
              <SecondaryIcon className="w-3.5 h-3.5 mr-1" />
              {secondaryLabel}
            </Button>
          ) : null}
        </div>
      </div>

      {showPairArrange && onArrangePair ? (
        <div className="mt-2 pl-6">
          <PairArrangeBlock
            label={pairArrangeLabel}
            hint={pairArrangeHint}
            disabled={pairArrangeDisabled}
            loading={pairArrangeLoading || loading}
            onArrangePair={onArrangePair}
          />
        </div>
      ) : null}
    </div>
  )
}

function PairArrangeBlock({
  label,
  hint,
  disabled,
  loading,
  onArrangePair,
}: {
  label: string
  hint?: string
  disabled?: boolean
  loading?: boolean
  onArrangePair: () => void
}) {
  return (
    <div>
      <Button
        size="sm"
        variant="outline"
        className="w-full h-8 rounded-full text-[11px] font-medium border-primary/40 text-primary"
        disabled={disabled || loading}
        onClick={onArrangePair}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <>
            <Link2 className="w-3.5 h-3.5 mr-1" />
            {label}
          </>
        )}
      </Button>
      {hint ? (
        <p
          className={`text-[10px] mt-1 leading-snug ${disabled ? "text-amber-500/90" : "text-muted-foreground"}`}
        >
          {hint}
        </p>
      ) : null}
    </div>
  )
}
