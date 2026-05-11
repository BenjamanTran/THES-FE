"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarCheck,
  ChevronRight,
  Clock,
  Crown,
  Loader2,
  LogIn,
  MapPin,
  Plus,
  Users,
  Wallet,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SkillBadge } from "./skill-badge"
import { fetchMyGames, type Game } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { formatPriceRange } from "@/lib/format"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

interface MyGamesScreenProps {
  onCreateMatch: () => void
  onOpenGame?: (id: number) => void
}

type TimeTab = "upcoming" | "past"
type RoleFilter = "all" | "host" | "joined"

const PER_PAGE = 15

function statusMeta(status: Game["status"]) {
  switch (status) {
    case "open":
      return { label: "Đang mở", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" }
    case "full":
      return { label: "Đã đầy", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" }
    case "ongoing":
      return { label: "Đang diễn ra", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" }
    case "finished":
      return { label: "Đã kết thúc", className: "bg-neutral-500/20 text-neutral-300 border-neutral-500/30" }
    case "cancelled":
      return { label: "Đã huỷ", className: "bg-red-500/20 text-red-400 border-red-500/30" }
  }
}

function formatTime(game: Game) {
  const start = new Date(game.start_time)
  const end = new Date(game.end_time)
  return {
    date: format(start, "EEE, dd/MM", { locale: vi }),
    time: `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`,
  }
}

export function MyGamesScreen({ onCreateMatch, onOpenGame }: MyGamesScreenProps) {
  const router = useRouter()
  const { user } = useAuth()
  const userId = user?.id ?? -1
  const [timeTab, setTimeTab] = useState<TimeTab>("upcoming")
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
  const [games, setGames] = useState<Game[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState<number | null>(null)
  const [totalPages, setTotalPages] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPage = useCallback(
    (pageNum: number, mode: "replace" | "append") => {
      if (mode === "replace") setLoading(true)
      else setLoadingMore(true)
      setError(null)

      fetchMyGames(timeTab, {
        page: String(pageNum),
        per_page: String(PER_PAGE),
      })
        .then((res) => {
          if (mode === "replace") {
            setGames(res.games)
          } else {
            setGames((prev) => {
              const seen = new Set(prev.map((g) => g.id))
              return [...prev, ...res.games.filter((g) => !seen.has(g.id))]
            })
          }
          setPage(res.meta.page)
          setTotal(res.meta.total)
          setTotalPages(res.meta.total_pages)
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Không tải được")
          if (mode === "replace") {
            setGames([])
            setTotal(null)
            setTotalPages(null)
          }
        })
        .finally(() => {
          if (mode === "replace") setLoading(false)
          else setLoadingMore(false)
        })
    },
    [timeTab],
  )

  useEffect(() => {
    if (!user) return
    loadPage(1, "replace")
  }, [loadPage, user])

  if (!user) {
    return (
      <div className="flex flex-col">
        <header className="glass-dark sticky top-0 z-40 px-4 pt-4 pb-3 safe-top border-b border-border/20">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-primary" />
            Trận của tôi
          </h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center text-3xl mb-4">
            📅
          </div>
          <h2 className="font-bold mb-2">Chưa đăng nhập</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Đăng nhập để xem các trận bạn đang host hoặc đã tham gia.
          </p>
          <Button
            className="rounded-full"
            onClick={() => router.push("/login?next=/")}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Đăng nhập
          </Button>
        </div>
      </div>
    )
  }

  const filteredGames = useMemo(() => {
    if (roleFilter === "all") return games
    if (roleFilter === "host") return games.filter((g) => g.host?.id === userId)
    return games.filter((g) => g.host?.id !== userId)
  }, [games, roleFilter, userId])

  const hasMore = totalPages !== null && page < totalPages
  const loadMore = () => {
    if (!hasMore || loadingMore || loading) return
    loadPage(page + 1, "append")
  }

  const hostCount = useMemo(
    () => games.filter((g) => g.host?.id === userId).length,
    [games, userId],
  )
  const joinedCount = games.length - hostCount

  const emptyMessage =
    timeTab === "upcoming"
      ? "Bạn chưa có trận nào sắp tới."
      : "Chưa có trận đã qua nào."

  return (
    <div className="flex flex-col">
      <header className="glass-dark sticky top-0 z-40 px-4 pt-4 pb-3 safe-top border-b border-border/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-primary" />
              Trận của tôi
              {total !== null && (
                <span className="text-xs font-medium text-muted-foreground">· {total} trận</span>
              )}
            </h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Các trận bạn đang host hoặc đã tham gia
            </p>
          </div>
          <Button size="sm" className="rounded-xl h-9" onClick={onCreateMatch}>
            <Plus className="w-4 h-4 mr-1" />
            Tạo trận
          </Button>
        </div>

        <Tabs value={timeTab} onValueChange={(v) => setTimeTab(v as TimeTab)}>
          <TabsList className="w-full grid grid-cols-2 h-9 bg-secondary/50">
            <TabsTrigger
              value="upcoming"
              className="h-7 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Sắp tới
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="h-7 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Đã qua
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {(
            [
              { id: "all" as const, label: `Tất cả · ${games.length}` },
              { id: "host" as const, label: `Tôi host · ${hostCount}` },
              { id: "joined" as const, label: `Tham gia · ${joinedCount}` },
            ] satisfies Array<{ id: RoleFilter; label: string }>
          ).map((opt) => (
            <Badge
              key={opt.id}
              variant={roleFilter === opt.id ? "default" : "outline"}
              className="cursor-pointer px-3 py-1 rounded-full text-[11px] flex-shrink-0"
              onClick={() => setRoleFilter(opt.id)}
            >
              {opt.label}
            </Badge>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-sm text-destructive mb-3">{error}</p>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => loadPage(1, "replace")}
            >
              Thử lại
            </Button>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            {timeTab === "upcoming" && (
              <Button size="sm" className="mt-4 rounded-full" onClick={onCreateMatch}>
                <Plus className="w-4 h-4 mr-1" />
                Tạo trận đấu
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGames.map((game) => {
              const { date, time } = formatTime(game)
              const isHost = game.host?.id === userId
              const status = statusMeta(game.status)
              return (
                <Card
                  key={game.id}
                  onClick={() => onOpenGame?.(game.id)}
                  className="p-4 rounded-2xl border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-sm truncate">
                          {game.description || game.location || `Trận #${game.id}`}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`rounded-full text-[10px] px-1.5 py-0 ${status.className}`}
                        >
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {isHost ? (
                          <Badge className="bg-amber-500/20 text-amber-400 border-0 text-[10px] px-1.5 py-0">
                            <Crown className="w-3 h-3 mr-1" />
                            Bạn host
                          </Badge>
                        ) : (
                          <Badge className="bg-primary/15 text-primary border-0 text-[10px] px-1.5 py-0">
                            Tham gia
                          </Badge>
                        )}
                      </div>
                      {game.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{game.location}</span>
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
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
              )
            })}

            {hasMore && roleFilter === "all" && (
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
                {total !== null ? `Đã hiển thị toàn bộ ${total} trận` : "Đã hết"}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
