"use client"

import { Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { SkillBadge } from "./skill-badge"
import type { AuthUser } from "@/lib/api"
import { cn } from "@/lib/utils"

function formatWeeklyGr(delta: number) {
  if (delta > 0) return `+${delta} GR`
  if (delta < 0) return `${delta} GR`
  return "0 GR"
}

export function HomeStatsCard({ user }: { user: AuthUser | null }) {
  const rank = user?.rank
  const stats = user?.stats
  const weeklyGr = stats?.weekly_gr
  const weeklyDelta = weeklyGr?.delta ?? 0
  const showWeeklyBadge = (weeklyGr?.matches ?? 0) > 0

  if (!user) {
    return (
      <Card className="bg-gradient-to-br from-accent to-accent/80 border-0 p-4 rounded-3xl overflow-hidden relative">
        <p className="text-sm text-muted-foreground relative z-10">
          Đăng nhập để xem Global Rating và thống kê tuần
        </p>
      </Card>
    )
  }

  if (!rank) {
    return (
      <Card className="bg-gradient-to-br from-accent to-accent/80 border-0 p-4 rounded-3xl overflow-hidden relative">
        <p className="text-sm text-muted-foreground relative z-10">
          Cập nhật trình độ trong hồ sơ để hiển thị Global Rating
        </p>
      </Card>
    )
  }

  const winRate = stats?.win_rate ?? 0
  const globalRank = stats?.global_rank
  const matches = rank.matches_count ?? 0

  return (
    <Card className="bg-gradient-to-br from-accent to-accent/80 border-0 p-4 rounded-3xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <StatsCardContent
        rank={rank}
        weeklyDelta={weeklyDelta}
        showWeeklyBadge={showWeeklyBadge}
        winRate={winRate}
        matches={matches}
        globalRank={globalRank}
      />
    </Card>
  )
}

function StatsCardContent({
  rank,
  weeklyDelta,
  showWeeklyBadge,
  winRate,
  matches,
  globalRank,
}: {
  rank: NonNullable<AuthUser["rank"]>
  weeklyDelta: number
  showWeeklyBadge: boolean
  winRate: number
  matches: number
  globalRank: number | null | undefined
}) {
  return (
    <div className="flex items-center justify-between relative z-10">
      <div>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <SkillBadge level={rank.tier} size="sm" />
          {showWeeklyBadge && (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-2 py-0",
                weeklyDelta >= 0
                  ? "border-primary/30 text-primary"
                  : "border-red-500/30 text-red-400",
              )}
            >
              <Zap className="w-3 h-3 mr-1" />
              {formatWeeklyGr(weeklyDelta)}
            </Badge>
          )}
        </div>
        <p className="text-3xl font-bold text-foreground mt-2">
          {rank.rating.toLocaleString("vi-VN")}
        </p>
        <p className="text-xs text-muted-foreground">
          Global Rating
          {(rank.host_rating_count ?? 0) > 0
            ? ` · ${rank.host_rating_count} đánh giá host`
            : ""}
        </p>
      </div>
      <div className="text-right">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">Thắng</span>
            <span className="font-bold text-emerald-400">{winRate}%</span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">Trận</span>
            <span className="font-bold text-foreground">{matches}</span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">Hạng</span>
            <span className="font-bold text-primary">
              {globalRank != null ? `#${globalRank}` : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
