"use client"

import { Card } from "@/components/ui/card"
import type { AuthUser } from "@/lib/api"

interface ProfileWinLossCardProps {
  matchStats: AuthUser["rank"]
}

export function ProfileWinLossCard({ matchStats }: ProfileWinLossCardProps) {
  const wins = matchStats?.wins ?? 0
  const losses = matchStats?.losses ?? 0
  const total = matchStats?.matches_count ?? wins + losses
  const winPct = total > 0 ? (wins / total) * 100 : 0

  return (
    <div className="px-4 pb-4">
      <Card className="p-4 rounded-2xl border-border/50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold">Thắng / Thua</span>
          <span className="text-xs text-muted-foreground">
            {wins}W - {losses}L
          </span>
        </div>
        <div className="relative h-3 rounded-full overflow-hidden bg-red-500/30">
          <div
            className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all"
            style={{ width: `${winPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-emerald-400">{wins} Thắng</span>
          <span className="text-xs text-red-400">{losses} Thua</span>
        </div>
      </Card>
    </div>
  )
}
