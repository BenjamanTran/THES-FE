"use client"

import {
  Clock,
  MapPin,
  Users,
  Plus,
  ChevronRight,
  Loader2,
  Wallet,
  Swords,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SkillBadge } from "../skill-badge"
import type { AuthUser } from "@/lib/api"
import { formatPriceRange } from "@/lib/format"
import { cn } from "@/lib/utils"
import { formatTime } from "./utils"
import { PER_PAGE } from "./constants"
import type { MatchesVm } from "./types"

interface MatchesGameListProps {
  vm: MatchesVm
  user: AuthUser | null
  onCreateMatch: () => void
  onOpenGame?: (id: number) => void
}

export function MatchesGameList({ vm, user, onCreateMatch, onOpenGame }: MatchesGameListProps) {
  const { games, loading, loadingMore, error, hasMore, total, loadFirstPage, loadMore } = vm

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
  {loading ? (
    <div className="space-y-3 animate-skeleton">
      <div className="h-28 rounded-2xl bg-muted/30" />
      <div className="h-28 rounded-2xl bg-muted/30" />
      <div className="h-28 rounded-2xl bg-muted/30" />
    </div>
  ) : error ? (
    <div className="text-center py-12">
      <p className="text-sm text-destructive mb-3">{error}</p>
      <Button size="sm" variant="outline" className="rounded-full" onClick={loadFirstPage}>
        Thử lại
      </Button>
    </div>
  ) : games.length === 0 ? (
    <div className="text-center py-12">
      <p className="text-sm text-muted-foreground">
        Không tìm thấy trận đấu phù hợp.
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Thử nới rộng bộ lọc hoặc tạo trận mới.
      </p>
      <Button size="sm" className="mt-4 rounded-full" onClick={onCreateMatch}>
        <Plus className="w-4 h-4 mr-1" />
        Tạo trận đấu
      </Button>
    </div>
  ) : (
    <div className="space-y-3 animate-stagger">
      {games.map((game, index) => {
        const { date, time } = formatTime(game)
        const isHost = game.host?.id === user?.id
        const isFinished = game.status === "finished"
        const showFinishedHeader =
          isFinished &&
          (index === 0 || games[index - 1]?.status !== "finished")
        return (
          <div key={game.id}>
            {showFinishedHeader && (
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2 pb-1 px-0.5">
                Đã kết thúc
              </p>
            )}
          <Card
            onClick={() => onOpenGame?.(game.id)}
            className={cn(
              "p-4 rounded-2xl border-border/50 transition-colors cursor-pointer",
              isFinished
                ? "opacity-75 hover:opacity-90 hover:border-border"
                : "hover:border-primary/30",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm truncate">
                    {game.title || `Game #${game.id} (${game.host?.name || "Host"})`}
                  </h3>
                  {isHost && (
                    <Badge className="bg-primary/20 text-primary border-0 text-[10px] px-1.5 py-0">
                      Bạn host
                    </Badge>
                  )}
                  {isFinished && (
                    <Badge className="bg-muted text-muted-foreground border-0 text-[10px] px-1.5 py-0">
                      Đã kết thúc
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {date} · <span className="text-foreground font-medium">{time}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {game.min_tier && <SkillBadge level={game.min_tier} size="xs" />}
                  {game.max_tier && game.max_tier !== game.min_tier && (
                    <SkillBadge level={game.max_tier} size="xs" />
                  )}
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {game.match_type === "singles" ? "Đơn" : "Đôi"}
                  </Badge>
                  {typeof game.distance_km === "number" && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 flex items-center gap-0.5"
                    >
                      <MapPin className="w-2.5 h-2.5" />
                      {game.distance_km.toFixed(1)} km
                    </Badge>
                  )}
                  {game.fit_level === "good" && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[10px] px-1.5 py-0">
                      Phù hợp
                    </Badge>
                  )}
                  {(game.matches_count ?? 0) > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 flex items-center gap-0.5"
                    >
                      <Swords className="w-2.5 h-2.5" />
                      {game.matches_finished ?? 0}/{game.matches_count} trận
                    </Badge>
                  )}
                  {(game.min_price > 0 || game.max_price > 0) && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 flex items-center gap-0.5"
                    >
                      <Wallet className="w-2.5 h-2.5" />
                      {formatPriceRange(game.min_price ?? 0, game.max_price ?? 0)}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <div className="flex items-center gap-1 bg-secondary rounded-full px-2 py-1">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-medium">
                    {game.players_count}/{game.max_players}
                  </span>
                </div>
                <Button
                  size="sm"
                  className="rounded-full text-xs h-8 px-3"
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenGame?.(game.id)
                  }}
                >
                  Chi tiết
                  <ChevronRight className="w-3 h-3 ml-0.5" />
                </Button>
              </div>
            </div>
          </Card>
          </div>
        )
      })}

      {hasMore && (
        <div className="pt-2 pb-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Đang tải…
              </>
            ) : (
              "Tải thêm"
            )}
          </Button>
        </div>
      )}

      {!hasMore && games.length >= PER_PAGE && (
        <p className="text-center text-[11px] text-muted-foreground py-3">
          {total !== null
            ? `Đã hiển thị toàn bộ ${total} trận`
            : "Đã hiển thị tất cả trận đấu phù hợp"}
        </p>
      )}
    </div>
  )}
</div>
  )
}
