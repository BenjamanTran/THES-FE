"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sun, Moon, MapPin, Users, Clock, ChevronRight, Swords } from "lucide-react"
import { useAppTheme } from "@/lib/theme-provider"
import { cn } from "@/lib/utils"
import { UserAvatar } from "./user-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SkillBadge } from "./skill-badge"
import { fetchMyGames, fetchSuggestedVenues, type Game, type Venue } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { HomeStatsCard } from "./home-stats-card"
import type { AppTab } from "./bottom-nav"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

interface HomeScreenProps {
  onCreateMatch: (venue?: Venue) => void
  onNavigate: (tab: AppTab) => void
  onOpenGame?: (id: number) => void
}

const HOME_PREVIEW_LIMIT = 2

function venueAddressLabel(venue: Venue) {
  if (venue.address) return venue.address
  const parts = [venue.district, venue.city].filter(Boolean)
  return parts.length > 0 ? parts.join(", ") : "—"
}

function formatGameTime(game: Game) {
  const start = new Date(game.start_time)
  const end = new Date(game.end_time)
  return {
    date: format(start, "EEEE, dd/MM", { locale: vi }),
    time: `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`,
  }
}

export function HomeScreen({ onCreateMatch, onNavigate, onOpenGame }: HomeScreenProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { theme, setTheme } = useAppTheme()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [suggestedVenues, setSuggestedVenues] = useState<Venue[]>([])
  const [venuesLoading, setVenuesLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setGames([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetchMyGames("upcoming")
      .then((res) => {
        if (!cancelled) setGames(res.games.slice(0, HOME_PREVIEW_LIMIT))
      })
      .catch(() => {
        if (!cancelled) setGames([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    let cancelled = false
    setVenuesLoading(true)
    fetchSuggestedVenues()
      .then((res) => {
        if (!cancelled) setSuggestedVenues(res.venues)
      })
      .catch(() => {
        if (!cancelled) setSuggestedVenues([])
      })
      .finally(() => {
        if (!cancelled) setVenuesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex flex-col">
      <header className="glass-dark sticky top-0 z-40 px-4 pt-4 pb-3 safe-top border-b border-border/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar
              name={user?.name}
              avatarUrl={user?.avatar_url}
              className="w-11 h-11 ring-2 ring-primary/30"
            />
            <div>
              <p className="text-xs text-muted-foreground">
                {user ? "Xin chào," : "Chào bạn,"}
              </p>
              <h1 className="font-bold text-foreground">
                {user?.name || "guest"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-full",
                theme === "light" && "bg-primary/15 text-primary ring-1 ring-primary/30",
              )}
              onClick={() => setTheme("light")}
              title="Chế độ sáng"
              aria-pressed={theme === "light"}
            >
              <Sun className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-full",
                theme === "dark" && "bg-primary/15 text-primary ring-1 ring-primary/30",
              )}
              onClick={() => setTheme("dark")}
              title="Chế độ tối"
              aria-pressed={theme === "dark"}
            >
              <Moon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 pt-4">
        <HomeStatsCard user={user} />
      </div>

      <div className="px-4 pt-6">
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => onCreateMatch()}
            className="h-auto py-4 rounded-2xl bg-primary hover:bg-primary/90 flex flex-col items-center gap-2"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="font-semibold">Tạo trận đấu</span>
          </Button>
          <Button
            variant="secondary"
            className="h-auto py-4 rounded-2xl bg-secondary hover:bg-secondary/80 flex flex-col items-center gap-2"
            disabled
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <span className="font-semibold text-foreground">Đặt sân</span>
          </Button>
        </div>
      </div>

      <section className="px-4 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Trận đấu sắp tới</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary text-xs font-semibold"
            onClick={() => onNavigate("matches")}
          >
            Tìm trận khác
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3 animate-skeleton">
            <div className="h-24 rounded-2xl bg-muted/30" />
            <div className="h-24 rounded-2xl bg-muted/30" />
          </div>
        ) : !user ? (
          <Card className="p-6 rounded-2xl border-border/50 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Đăng nhập để theo dõi trận đấu của bạn
            </p>
            <div className="flex justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => onNavigate("matches")}
              >
                Khám phá trận
              </Button>
              <Button
                size="sm"
                className="rounded-full"
                onClick={() => router.push("/login?next=/")}
              >
                Đăng nhập
              </Button>
            </div>
          </Card>
        ) : games.length === 0 ? (
          <Card className="p-6 rounded-2xl border-border/50 text-center">
            <p className="text-sm text-muted-foreground mb-3">Bạn chưa có trận đấu nào sắp tới</p>
            <Button size="sm" className="rounded-full" onClick={() => onCreateMatch()}>
              Tạo trận mới
            </Button>
          </Card>
        ) : (
          <div className="flex flex-col gap-3 animate-stagger">
            {games.map((game) => {
              const { date, time } = formatGameTime(game)
              const isHost = game.host?.id === user?.id
              return (
                <Card
                  key={game.id}
                  onClick={() => onOpenGame?.(game.id)}
                  className="p-4 rounded-2xl border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate">
                          {game.title || `Game #${game.id} (${game.host?.name || "Host"})`}
                        </h3>
                        {isHost && (
                          <Badge className="bg-primary/20 text-primary border-0 text-[10px] px-1.5 py-0">
                            Host
                          </Badge>
                        )}
                      </div>
                      {game.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {game.location}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-1 text-xs">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{date}</span>
                          <span className="font-medium">{time}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {game.min_tier && <SkillBadge level={game.min_tier} size="xs" />}
                        {game.max_tier && game.max_tier !== game.min_tier && (
                          <SkillBadge level={game.max_tier} size="xs" />
                        )}
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {game.match_type === "singles" ? "Đơn" : "Đôi"}
                        </Badge>
                        {(game.matches_count ?? 0) > 0 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 flex items-center gap-0.5"
                          >
                            <Swords className="w-2.5 h-2.5" />
                            {game.matches_finished ?? 0}/{game.matches_count} trận
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-3">
                      <div className="flex items-center gap-1 bg-secondary rounded-full px-2 py-1">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs font-medium">
                          {game.players_count}/{game.max_players}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="rounded-full text-xs h-8 px-4"
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpenGame?.(game.id)
                        }}
                      >
                        Chi tiết
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      <section className="px-4 pt-6 pb-8">
        <h2 className="font-bold text-lg mb-4">Gợi ý sân</h2>
        {venuesLoading ? (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide animate-skeleton">
            <div className="h-[168px] w-40 flex-shrink-0 rounded-2xl bg-muted/30" />
            <div className="h-[168px] w-40 flex-shrink-0 rounded-2xl bg-muted/30" />
            <div className="h-[168px] w-40 flex-shrink-0 rounded-2xl bg-muted/30" />
          </div>
        ) : suggestedVenues.length === 0 ? (
          <Card className="p-4 rounded-2xl border-border/50 text-center">
            <p className="text-sm text-muted-foreground">Chưa có sân nào có trận đấu</p>
          </Card>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {suggestedVenues.map((venue) => (
              <Card
                key={venue.id}
                role="button"
                tabIndex={0}
                onClick={() => onCreateMatch(venue)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onCreateMatch(venue)
                  }
                }}
                className="flex-shrink-0 w-40 rounded-2xl overflow-hidden border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
              >
                <div className="h-24 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <div className="text-3xl">🏸</div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate">{venue.name}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-snug min-h-[2.5em]">
                    {venueAddressLabel(venue)}
                  </p>
                  <div className="flex items-center justify-between mt-1.5 gap-2">
                    <span className="text-xs font-medium text-primary">
                      {venue.games_count ?? 0} trận
                    </span>
                    {venue.verified && (
                      <span className="text-[10px] text-muted-foreground">Đã xác minh</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
