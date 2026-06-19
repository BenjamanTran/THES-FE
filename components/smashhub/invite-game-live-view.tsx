"use client"

import { Swords, Users, Clock, MapPin, Trophy, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GenderIcon } from "./gender-icon"
import { SkillBadge } from "./skill-badge"
import { UserAvatar } from "./user-avatar"
import { sessionSkillStars, sessionSkillTier } from "@/lib/player-session-skill"
import type { InviteGameInfo, InviteLiveMatch, InviteLivePlayer } from "@/lib/api"
import { playerDisplayName } from "@/lib/player-display-name"
import { resolveDisplayCourtNumber } from "@/lib/match-court-display"
import { cn } from "@/lib/utils"
import { formatStars } from "./star-rating"

interface InviteGameLiveViewProps {
  game: InviteGameInfo
  players: InviteLivePlayer[]
  matches: InviteLiveMatch[]
  matchCounts: { pending: number; ongoing: number; finished: number }
  onGoHome: () => void
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  })
}

function teamLine(match: InviteLiveMatch, side: "team_a" | "team_b") {
  const team = side === "team_a" ? match.team_a : match.team_b
  const won = match.status === "finished" && match.winner_team === side
  const alignRight = side === "team_b"
  return (
    <div
      className={cn(
        "min-w-0 space-y-0.5",
        alignRight && "text-right",
        won && "text-primary font-semibold",
      )}
    >
      {team.map((p) => (
        <div
          key={p.id}
          className={cn(
            "flex w-full min-w-0 items-center gap-1.5",
            alignRight ? "flex-row-reverse justify-start" : "justify-start",
          )}
        >
          <UserAvatar
            name={p.name}
            avatarUrl={p.avatar_url}
            className="size-5 shrink-0"
            fallbackClassName="text-[8px]"
          />
          <span
            className={cn(
              "min-w-0 flex-1 truncate leading-tight",
              alignRight ? "text-right" : "text-left",
            )}
          >
            {playerDisplayName(p.name, p.id)}
          </span>
        </div>
      ))}
      {won ? (
        <div className="text-[10px] font-semibold leading-none pt-0.5">(THẮNG)</div>
      ) : null}
    </div>
  )
}

function MatchRow({
  match,
  allMatches,
  gameCourts,
}: {
  match: InviteLiveMatch
  allMatches: InviteLiveMatch[]
  gameCourts?: number[] | null
}) {
  const displayCourt = resolveDisplayCourtNumber(match, allMatches, gameCourts)
  const hasScore =
    match.team_a_score != null &&
    match.team_b_score != null &&
    (match.team_a_score > 0 || match.team_b_score > 0)

  return (
    <li
      className={cn(
        "rounded-lg border px-3 py-2 text-xs",
        match.status === "ongoing" && "border-emerald-500/30 bg-emerald-500/10",
        match.status === "pending" &&
          (match.priority
            ? "border-amber-500/40 bg-amber-500/10"
            : "border-border/50 bg-secondary/30"),
        match.status === "finished" && "border-border/50 bg-secondary/20",
      )}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-muted-foreground font-medium">#{match.match_number}</span>
        {displayCourt != null && (
          <span
            className={cn(
              "text-[10px] font-semibold tabular-nums",
              match.status === "ongoing"
                ? "text-emerald-700 dark:text-emerald-400"
                : match.status === "pending"
                  ? "text-amber-700/90 dark:text-amber-400/90"
                  : "text-muted-foreground",
            )}
          >
            Sân {displayCourt}
          </span>
        )}
        {match.priority && match.status === "pending" && (
          <span className="text-[10px] text-amber-600 font-semibold">★</span>
        )}
        {hasScore && (
          <span className="ml-auto tabular-nums font-semibold text-muted-foreground">
            {match.team_a_score} – {match.team_b_score}
          </span>
        )}
      </div>
      <div className="font-medium leading-snug grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-2 gap-y-0 items-start">
        <div className="min-w-0 text-left">{teamLine(match, "team_a")}</div>
        <span className="text-muted-foreground font-normal shrink-0 self-center px-0.5">vs</span>
        <div className="min-w-0 text-right">{teamLine(match, "team_b")}</div>
      </div>
    </li>
  )
}

export function InviteGameLiveView({
  game,
  players,
  matches,
  matchCounts,
  onGoHome,
}: InviteGameLiveViewProps) {
  const isClosed = game.mode === "closed"
  const isLive = game.mode === "live"
  const ongoing = matches.filter((m) => m.status === "ongoing")
  const pending = matches
    .filter((m) => m.status === "pending")
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority ? -1 : 1
      return a.match_number - b.match_number
    })
  const finished = matches
    .filter((m) => m.status === "finished")
    .sort((a, b) => b.match_number - a.match_number)

  const statusBadge = (() => {
    if (game.status === "cancelled") {
      return { text: "Đã huỷ", className: "bg-destructive/10 text-destructive" }
    }
    if (isClosed) {
      return { text: "Đã kết thúc", className: "bg-muted text-muted-foreground" }
    }
    return { text: "Đang diễn ra", className: "bg-primary/10 text-primary" }
  })()

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-secondary/40 border border-border/30 p-4 space-y-2">
        {game.description && <p className="text-sm font-medium">{game.description}</p>}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {game.host_name && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              Host: {game.host_name}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {game.players_count}/{game.max_players}
          </span>
          {game.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {game.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(game.start_time)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className={cn("rounded-full text-[10px]", statusBadge.className)}>
            {statusBadge.text}
          </Badge>
          {isLive && (
            <span className="text-[10px] text-muted-foreground">
              Tự động cập nhật
            </span>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Người chơi ({players.length})
        </p>
        <ul className="space-y-1.5 max-h-48 overflow-y-auto rounded-xl border border-border/40 divide-y divide-border/30">
          {players.map((p) => {
            const s = p.session_matches
            const tier = sessionSkillTier(p)
            const stars = sessionSkillStars(p)
            return (
              <li key={p.id} className="flex items-center gap-2.5 px-3 py-2 text-sm">
                <UserAvatar
                  name={p.name}
                  avatarUrl={p.avatar_url}
                  className="h-9 w-9 shrink-0"
                  fallbackClassName="text-xs"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-medium truncate">
                      {playerDisplayName(p.name, p.id)}
                    </span>
                    {p.gender ? <GenderIcon gender={p.gender} size="sm" /> : null}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <SkillBadge level={tier ?? null} size="xs" compact />
                    {tier && stars != null ? (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-semibold tabular-nums">
                        {formatStars(stars)}
                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                      </span>
                    ) : null}
                  </div>
                </div>
                <span className="text-xs font-semibold tabular-nums shrink-0 text-right">
                  <span className="text-primary">{s?.played ?? 0} trận</span>
                  {isClosed && s && s.played > 0 && (
                    <>
                      <span className="text-emerald-600 ml-1">{s.wins}W</span>
                      <span className="text-red-500 ml-0.5">{s.losses}L</span>
                    </>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <Swords className="w-4 h-4 text-primary" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Trận đấu
          </p>
          <div className="flex gap-1 ml-auto flex-wrap justify-end">
            {matchCounts.ongoing > 0 && (
              <Badge className="rounded-full text-[10px] bg-emerald-500/15 text-emerald-600 border-0">
                {matchCounts.ongoing} đang đấu
              </Badge>
            )}
            {matchCounts.pending > 0 && (
              <Badge className="rounded-full text-[10px] bg-amber-500/15 text-amber-600 border-0">
                {matchCounts.pending} chờ
              </Badge>
            )}
            {matchCounts.finished > 0 && (
              <Badge className="rounded-full text-[10px] bg-muted text-muted-foreground border-0">
                {matchCounts.finished} xong
              </Badge>
            )}
          </div>
        </div>

        {matches.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Chưa có trận nào.</p>
        ) : (
          <div className="space-y-3">
            {ongoing.length > 0 && (
              <div>
                <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mb-1.5">
                  Đang đấu
                </p>
                <ul className="space-y-1.5">
                  {ongoing.map((m) => (
                    <MatchRow
                      key={m.id}
                      match={m}
                      allMatches={matches}
                      gameCourts={game.courts}
                    />
                  ))}
                </ul>
              </div>
            )}
            {(isLive || pending.length > 0) && (
              <div>
                <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 mb-1.5">
                  Hàng chờ ({matchCounts.pending > 0 ? matchCounts.pending : pending.length})
                </p>
                {pending.length > 0 ? (
                  <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                    {pending.map((m) => (
                      <MatchRow
                        key={m.id}
                        match={m}
                        allMatches={matches}
                        gameCourts={game.courts}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground py-2 px-1">
                    Chưa có trận trong hàng chờ. Host xếp trận mới sẽ hiện ở đây.
                  </p>
                )}
              </div>
            )}
            {finished.length > 0 && (
              <div>
                <p className="text-[11px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  Đã xong
                </p>
                <ul
                  className={cn(
                    "space-y-1.5",
                    isClosed && finished.length > 6 && "max-h-64 overflow-y-auto pr-0.5",
                  )}
                >
                  {finished.map((m) => (
                    <MatchRow
                      key={m.id}
                      match={m}
                      allMatches={matches}
                      gameCourts={game.courts}
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <Button variant="outline" className="w-full rounded-full" onClick={onGoHome}>
        Về trang chủ
      </Button>
    </div>
  )
}
