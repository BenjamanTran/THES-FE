"use client"

import { Clock, Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"
import { formatPlayTime } from "@/lib/format"
import type { AuthUser } from "@/lib/api"

interface ProfileQuickStatsCardProps {
  matchStats: AuthUser["rank"]
  favoriteVenue: string | null | undefined
}

export function ProfileQuickStatsCard({ matchStats, favoriteVenue }: ProfileQuickStatsCardProps) {
  const playTime = formatPlayTime(matchStats?.play_time_seconds ?? 0)
  const venueLabel = favoriteVenue?.trim() || "Chưa có"

  return (
    <div className="px-4 pb-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 rounded-2xl border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Thời gian chơi</p>
              <p className="font-bold">{playTime}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-2xl border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Sân yêu thích</p>
              <p className="font-bold text-sm truncate">{venueLabel}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
