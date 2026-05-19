"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Clock,
  MapPin,
  Users,
  Filter,
  Plus,
  ChevronRight,
  Loader2,
  Compass,
  Locate,
  X,
  Wallet,
  Swords,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet"
import { SkillBadge, SKILL_LABELS, type SkillLevel } from "./skill-badge"
import { GenderIcon } from "./gender-icon"
import { fetchGamesSearch, type Game } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useGeolocation } from "@/hooks/use-geolocation"
import { formatPriceRange, formatVndShort } from "@/lib/format"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface MatchesScreenProps {
  onCreateMatch: () => void
  onOpenGame?: (id: number) => void
}

const TIER_OPTIONS: SkillLevel[] = [
  "newbie",
  "beginner_plus",
  "lower_intermediate",
  "intermediate",
  "upper_intermediate",
  "advanced",
  "semi_pro",
  "professional",
]

const RADIUS_OPTIONS = [3, 5, 10, 20]

const PRICE_OPTIONS: Array<{ label: string; value: number }> = [
  { label: "Không giới hạn", value: 0 },
  { label: "≤ 50K", value: 50000 },
  { label: "≤ 80K", value: 80000 },
  { label: "≤ 120K", value: 120000 },
  { label: "≤ 200K", value: 200000 },
  { label: "≤ 500K", value: 500000 },
]

type MatchTypeFilter = "any" | "singles" | "doubles"

interface Filters {
  tier: SkillLevel | null
  radiusKm: number
  matchType: MatchTypeFilter
  notFull: boolean
  useLocation: boolean
  priceMax: number
}

/** Mặc định: không lọc — hiển thị tất cả trận chưa kết thúc */
const ALL_FILTERS: Filters = {
  tier: null,
  radiusKm: 5,
  matchType: "any",
  notFull: false,
  useLocation: false,
  priceMax: 0,
}

function formatTime(game: Game) {
  const start = new Date(game.start_time)
  const end = new Date(game.end_time)
  return {
    date: format(start, "EEE, dd/MM", { locale: vi }),
    time: `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`,
  }
}

const PER_PAGE = 15

export function MatchesScreen({ onCreateMatch, onOpenGame }: MatchesScreenProps) {
  const { user } = useAuth()
  const geo = useGeolocation(false)
  const [filters, setFilters] = useState<Filters>(ALL_FILTERS)
  const [draftFilters, setDraftFilters] = useState<Filters>(ALL_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)
  const [games, setGames] = useState<Game[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const locationActive = filters.useLocation && geo.status === "granted" && geo.coords !== null

  const buildParams = useCallback(
    (pageNum: number): Record<string, string> => {
      const params: Record<string, string> = {
        time_scope: "discover",
        sort: "discover",
        per_page: String(PER_PAGE),
        page: String(pageNum),
      }
      if (filters.notFull) params.not_full = "true"
      if (filters.tier) params.tier = filters.tier
      if (filters.matchType !== "any") params.match_type = filters.matchType
      if (filters.priceMax > 0) params.price_max = String(filters.priceMax)
      if (locationActive && geo.coords) {
        params.lat = String(geo.coords.lat)
        params.lng = String(geo.coords.lng)
        params.radius = String(filters.radiusKm)
      }
      return params
    },
    [filters, locationActive, geo.coords],
  )

  const loadFirstPage = useCallback(() => {
    setLoading(true)
    setError(null)
    setPage(1)
    fetchGamesSearch(buildParams(1))
      .then((res) => {
        setGames(res.games)
        setHasMore(res.meta?.has_more ?? false)
        setTotal(res.meta?.total ?? null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Không tải được")
        setGames([])
        setHasMore(false)
        setTotal(null)
      })
      .finally(() => setLoading(false))
  }, [buildParams])

  const loadMore = useCallback(() => {
    if (loadingMore || loading || !hasMore) return
    const next = page + 1
    setLoadingMore(true)
    fetchGamesSearch(buildParams(next))
      .then((res) => {
        setGames((prev) => {
          const seen = new Set(prev.map((g) => g.id))
          const fresh = res.games.filter((g) => !seen.has(g.id))
          return [...prev, ...fresh]
        })
        setHasMore(res.meta?.has_more ?? false)
        setPage(next)
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Không tải được"))
      .finally(() => setLoadingMore(false))
  }, [buildParams, hasMore, loading, loadingMore, page])

  useEffect(() => {
    loadFirstPage()
  }, [loadFirstPage])

  const activeFilterCount = useMemo(() => {
    let n = 0
    if (filters.tier) n += 1
    if (filters.matchType !== "any") n += 1
    if (filters.notFull) n += 1
    if (filters.useLocation) n += 1
    if (filters.priceMax > 0) n += 1
    return n
  }, [filters])

  const applyDraft = () => {
    setFilters(draftFilters)
    setFilterOpen(false)
    if (draftFilters.useLocation && geo.status !== "granted") {
      geo.request()
    }
  }

  const resetDraft = () => setDraftFilters(ALL_FILTERS)

  const clearAllFilters = () => {
    setFilters(ALL_FILTERS)
    setDraftFilters(ALL_FILTERS)
    setFilterOpen(false)
  }

  const removeFilter = (key: keyof Filters) => {
    setFilters((f) => ({ ...f, [key]: ALL_FILTERS[key] }))
  }

  const locationStatusText = (() => {
    if (activeFilterCount === 0) return "Trận đang diễn ra · đã kết thúc ở cuối"
    if (!filters.useLocation) return "Đã áp dụng bộ lọc"
    switch (geo.status) {
      case "granted":
        return `Trong bán kính ${filters.radiusKm} km`
      case "prompt":
        return "Đang xin quyền truy cập vị trí…"
      case "denied":
        return "Bạn từ chối quyền truy cập vị trí · đang hiển thị tất cả"
      case "unsupported":
        return "Trình duyệt không hỗ trợ định vị"
      case "error":
        return "Không xác định được vị trí"
      default:
        return "Chưa lấy vị trí"
    }
  })()

  return (
    <div className="flex flex-col">
      <header className="glass-dark sticky top-0 z-40 px-4 pt-4 pb-3 safe-top border-b border-border/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Compass className="w-5 h-5 text-primary" />
              Tìm trận
              {total !== null && (
                <span className="text-xs font-medium text-muted-foreground">
                  · {total} trận
                </span>
              )}
            </h1>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Locate className="w-3 h-3" />
              {locationStatusText}
              {filters.useLocation && (geo.status === "denied" || geo.status === "error") && (
                <button
                  type="button"
                  onClick={geo.request}
                  className="ml-1 text-primary font-medium underline-offset-2 hover:underline"
                >
                  Thử lại
                </button>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Sheet
              open={filterOpen}
              onOpenChange={(open) => {
                if (open) setDraftFilters(filters)
                setFilterOpen(open)
              }}
            >
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl relative">
                  <Filter className="w-4 h-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="rounded-t-3xl max-h-[85dvh] overflow-y-auto px-4 sm:px-6"
              >
                <SheetHeader className="px-0 pb-4">
                  <SheetTitle className="text-left">Bộ lọc</SheetTitle>
                  <SheetDescription className="sr-only">
                    Tinh chỉnh bộ lọc để tìm trận đấu phù hợp.
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 pb-6 safe-bottom">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-semibold">Định vị</Label>
                      <button
                        type="button"
                        onClick={() =>
                          setDraftFilters((f) => ({ ...f, useLocation: !f.useLocation }))
                        }
                        className={`text-xs font-medium ${
                          draftFilters.useLocation ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {draftFilters.useLocation ? "Đang bật" : "Đã tắt"}
                      </button>
                    </div>
                    {draftFilters.useLocation && geo.status !== "granted" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full mb-2"
                        onClick={geo.request}
                      >
                        Cho phép định vị
                      </Button>
                    )}
                    {draftFilters.useLocation && (
                      <div className="flex gap-2 flex-wrap">
                        {RADIUS_OPTIONS.map((r) => (
                          <Badge
                            key={r}
                            variant={draftFilters.radiusKm === r ? "default" : "outline"}
                            className="cursor-pointer px-3 py-2 rounded-full text-xs"
                            onClick={() => setDraftFilters((f) => ({ ...f, radiusKm: r }))}
                          >
                            {r} km
                          </Badge>
                        ))}
                      </div>
                    )}
                    {draftFilters.useLocation && geo.status !== "granted" && (
                      <p className="text-[11px] text-amber-400 mt-2">
                        Cần cấp quyền vị trí để lọc theo bán kính.
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Trình độ</Label>
                    <div className="flex gap-2 flex-wrap">
                      <Badge
                        variant={draftFilters.tier === null ? "default" : "outline"}
                        className="cursor-pointer px-3 py-2 rounded-full text-xs"
                        onClick={() => setDraftFilters((f) => ({ ...f, tier: null }))}
                      >
                        Tất cả
                      </Badge>
                      {TIER_OPTIONS.map((t) => (
                        <Badge
                          key={t}
                          variant={draftFilters.tier === t ? "default" : "outline"}
                          className="cursor-pointer px-3 py-2 rounded-full text-xs"
                          onClick={() => setDraftFilters((f) => ({ ...f, tier: t }))}
                        >
                          {SKILL_LABELS[t]}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Thể thức</Label>
                    <div className="flex gap-2">
                      {(["any", "singles", "doubles"] as MatchTypeFilter[]).map((mt) => (
                        <Badge
                          key={mt}
                          variant={draftFilters.matchType === mt ? "default" : "outline"}
                          className="cursor-pointer px-3 py-2 rounded-full text-xs"
                          onClick={() => setDraftFilters((f) => ({ ...f, matchType: mt }))}
                        >
                          {mt === "any" ? "Cả 2" : mt === "singles" ? "Đơn" : "Đôi"}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold mb-3 block flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      Ngân sách tối đa / slot
                    </Label>
                    <div className="flex gap-2 flex-wrap">
                      {PRICE_OPTIONS.map((opt) => (
                        <Badge
                          key={opt.value}
                          variant={draftFilters.priceMax === opt.value ? "default" : "outline"}
                          className="cursor-pointer px-3 py-2 rounded-full text-xs"
                          onClick={() =>
                            setDraftFilters((f) => ({ ...f, priceMax: opt.value }))
                          }
                        >
                          {opt.label}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Chỉ hiển thị trận có giá khởi điểm trong ngân sách.
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Tuỳ chọn khác</Label>
                    <Card
                      className="p-3 rounded-2xl border-border/50 cursor-pointer"
                      onClick={() =>
                        setDraftFilters((f) => ({ ...f, notFull: !f.notFull }))
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Chỉ trận còn slot</p>
                          <p className="text-[11px] text-muted-foreground">
                            Ẩn trận đã đủ người
                          </p>
                        </div>
                        <Badge
                          variant={draftFilters.notFull ? "default" : "outline"}
                          className="rounded-full text-[10px]"
                        >
                          {draftFilters.notFull ? "Bật" : "Tắt"}
                        </Badge>
                      </div>
                    </Card>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1 rounded-full" onClick={resetDraft}>
                      Đặt lại
                    </Button>
                    <Button className="flex-1 rounded-full" onClick={applyDraft}>
                      Áp dụng
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Button size="sm" className="rounded-xl h-9" onClick={onCreateMatch}>
              <Plus className="w-4 h-4 mr-1" />
              Tạo trận
            </Button>
          </div>
        </div>

        {activeFilterCount > 0 && (
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
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => removeFilter("matchType")}
                />
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
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => removeFilter("priceMax")}
                />
              </Badge>
            )}
          </div>
        )}
      </header>

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
    </div>
  )
}
