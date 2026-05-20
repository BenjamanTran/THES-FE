"use client"

import { Loader2, Play, Pencil, Trash2, Star, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SKILL_LABELS, skillColors, type SkillLevel } from "./skill-badge"
import { GenderIcon } from "./gender-icon"
import { MatchStatusBadge, getMatchStatusMeta } from "./match-status-badge"
import { ratingToStars } from "@/lib/rating-stars"
import { cn } from "@/lib/utils"
import type { GameDetail, MatchSummary } from "@/lib/api"
import { isMatchStartable } from "@/lib/suggest-next-match"

export interface GameMatchCardProps {
  match: MatchSummary
  game: GameDetail
  canManage: boolean
  isGameTime: boolean
  isParticipant: boolean
  startingMatchId: number | null
  deletingMatchId: number | null
  finishingMatchId?: number | null
  onStartMatch: (matchId: number) => void
  onTapWinner?: (match: MatchSummary, team: "team_a" | "team_b") => void
  onOpenScoreEntry?: (match: MatchSummary) => void
  onEdit: (match: MatchSummary) => void
  onDelete: (matchId: number) => void
  highlighted?: boolean
  /** Players currently in an ongoing match — pending start disabled when overlap */
  busyPlayerIds?: Set<number>
  onTogglePriority?: (match: MatchSummary) => void
  togglingPriorityId?: number | null
}

function playerMeta(p: MatchSummary["team_a"][number], game: GameDetail) {
  const gp = game.players.find((pl) => pl.id === p.id)
  const gender = p.gender ?? gp?.gender
  const tier = gp?.host_rated_tier || p.rank?.tier
  const stars =
    gp?.host_rated_tier && gp?.host_rated_stars != null
      ? gp.host_rated_stars
      : p.rank
        ? ratingToStars(p.rank.tier, p.rank.rating)
        : null
  const tc = tier ? skillColors[tier] || skillColors.newbie : null
  return { gender, tier, stars, tc }
}

function CompactPlayer({
  p,
  game,
}: {
  p: MatchSummary["team_a"][number]
  game: GameDetail
}) {
  const { gender, tier, stars, tc } = playerMeta(p, game)
  return (
    <span
      className="flex flex-wrap items-center gap-x-0.5 gap-y-0 min-w-0 max-w-full text-[11px] leading-snug font-medium text-foreground break-words"
      title={
        tier && stars != null
          ? `${p.name} · ${SKILL_LABELS[tier as SkillLevel]} ${stars}`
          : p.name || undefined
      }
    >
      <span className="break-words">{p.name || `#${p.id}`}</span>
      {gender ? <GenderIcon gender={gender} size="sm" /> : null}
      {tier && stars != null && tc ? (
        <span className={cn("shrink-0 text-[9px] font-semibold tabular-nums", tc.text)}>
          {stars}
          <Star className="w-2 h-2 inline fill-current -mt-px" />
        </span>
      ) : null}
    </span>
  )
}

function TeamColumn({
  team,
  game,
  align,
}: {
  team: MatchSummary["team_a"]
  game: GameDetail
  align: "start" | "end"
}) {
  return (
    <div
      className={cn(
        "min-w-0 flex flex-col gap-0.5 flex-1",
        align === "end" ? "items-end" : "items-start",
      )}
    >
      {team.map((p) => (
        <CompactPlayer key={p.id} p={p} game={game} />
      ))}
    </div>
  )
}

function TeamsRow({
  match,
  game,
  center,
}: {
  match: MatchSummary
  game: GameDetail
  center: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-1.5 items-start min-w-0">
      <TeamColumn team={match.team_a} game={game} align="end" />
      <div className="shrink-0 px-0.5 text-center self-center">{center}</div>
      <TeamColumn team={match.team_b} game={game} align="start" />
    </div>
  )
}

export function GameMatchCard({
  match,
  game,
  canManage,
  isGameTime,
  isParticipant,
  startingMatchId,
  deletingMatchId,
  finishingMatchId,
  onStartMatch,
  onTapWinner,
  onOpenScoreEntry,
  onEdit,
  onDelete,
  highlighted,
  busyPlayerIds,
  onTogglePriority,
  togglingPriorityId,
}: GameMatchCardProps) {
  const isPending = match.status === "pending"
  const isOngoing = match.status === "ongoing"
  const isFinished = match.status === "finished"
  const canFinishThis = isParticipant && isOngoing && !!onTapWinner
  const statusMeta = getMatchStatusMeta(match.status, !!match.winner_team)
  const isFinishing = finishingMatchId === match.id
  const playersNeeded = game.match_type === "singles" ? 2 : 4
  const startBlocked =
    isPending &&
    busyPlayerIds != null &&
    !isMatchStartable(match, busyPlayerIds, playersNeeded)
  const hasScores =
    isFinished && match.team_a_score != null && match.team_b_score != null

  const tapBtnClass = cn(
    "flex-1 min-h-[48px] min-w-0 rounded-lg border-2 border-primary/50 bg-primary/15",
    "active:scale-[0.98] transition-transform touch-manipulation",
    "flex items-center justify-center px-2 py-2 text-center",
    "hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    isFinishing && "opacity-60 pointer-events-none",
  )

  const teamTapNames = (team: MatchSummary["team_a"]) =>
    team.map((p) => p.name?.split(/\s+/).pop() || "?").join(" - ")

  const centerContent = hasScores ? (
    <div className="flex flex-col items-center gap-0 leading-none">
      <span
        className={cn(
          "text-xl font-bold tabular-nums",
          match.winner_team === "team_a" ? "text-amber-400" : "text-muted-foreground",
        )}
      >
        {match.team_a_score}
      </span>
      <span className="text-[10px] text-muted-foreground">–</span>
      <span
        className={cn(
          "text-xl font-bold tabular-nums",
          match.winner_team === "team_b" ? "text-amber-400" : "text-muted-foreground",
        )}
      >
        {match.team_b_score}
      </span>
    </div>
  ) : (
    <span className="text-[10px] font-semibold text-muted-foreground">vs</span>
  )

  return (
    <div
      className={cn(
        "min-w-0 overflow-hidden rounded-lg border px-2 py-1.5",
        statusMeta.cardClass,
        highlighted && "ring-2 ring-primary ring-offset-1 ring-offset-background",
        match.priority && isPending && "ring-1 ring-amber-500/60",
      )}
    >
      <div className="flex items-center gap-1.5 mb-1 min-h-8">
        <span className="text-xs font-bold text-foreground tabular-nums shrink-0">
          #{match.match_number}
        </span>
        {match.priority && isPending ? (
          <Star className="w-3 h-3 shrink-0 fill-amber-500 text-amber-500" aria-label="Ưu tiên" />
        ) : null}
        <MatchStatusBadge status={match.status} hasWinner={!!match.winner_team} compact />
        <div className="flex-1 min-w-0" />
        <div className="flex items-center gap-0.5 shrink-0">
          {canManage && isPending && isGameTime ? (
            <Button
              size="sm"
              className="rounded-full h-8 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
              onClick={() => onStartMatch(match.id)}
              disabled={startingMatchId === match.id || startBlocked}
              title={
                startBlocked
                  ? "Có người trong trận này đang đấu trên sân khác"
                  : undefined
              }
            >
              {startingMatchId === match.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 mr-0.5" />
                  Bắt đầu
                </>
              )}
            </Button>
          ) : null}
          {canManage && isPending && isGameTime && onTogglePriority ? (
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "h-8 w-8 rounded-full",
                match.priority && "text-amber-500 hover:text-amber-600",
              )}
              onClick={() => onTogglePriority(match)}
              disabled={togglingPriorityId === match.id}
              title={match.priority ? "Bỏ ưu tiên" : "Đánh dấu ưu tiên"}
            >
              {togglingPriorityId === match.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Star className={cn("w-3.5 h-3.5", match.priority && "fill-current")} />
              )}
            </Button>
          ) : null}
          {canManage && !isFinished ? (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full"
                onClick={() => onEdit(match)}
                title="Sửa trận"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full"
                onClick={() => onDelete(match.id)}
                disabled={deletingMatchId === match.id}
                title="Xóa trận"
              >
                {deletingMatchId === match.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {canFinishThis ? (
        <div className="space-y-1">
          <div className="flex gap-1.5 items-stretch">
            <button
              type="button"
              disabled={isFinishing}
              onClick={() => onTapWinner!(match, "team_a")}
              className={tapBtnClass}
            >
              <span className="text-[13px] font-bold leading-snug text-foreground break-words whitespace-normal w-full">
                {teamTapNames(match.team_a)}{" "}
                <span className="text-[11px] font-bold text-primary tracking-wide">(THẮNG)</span>
              </span>
            </button>
            <button
              type="button"
              disabled={isFinishing}
              onClick={() => onTapWinner!(match, "team_b")}
              className={tapBtnClass}
            >
              <span className="text-[13px] font-bold leading-snug text-foreground break-words whitespace-normal w-full">
                {teamTapNames(match.team_b)}{" "}
                <span className="text-[11px] font-bold text-primary tracking-wide">(THẮNG)</span>
              </span>
            </button>
          </div>
          {onOpenScoreEntry ? (
            <button
              type="button"
              className="w-full text-center text-[10px] text-muted-foreground hover:underline py-0.5"
              onClick={() => onOpenScoreEntry(match)}
            >
              Ghi điểm
            </button>
          ) : null}
        </div>
      ) : (
        <TeamsRow match={match} game={game} center={centerContent} />
      )}

      {isFinished && match.winner_team && !hasScores ? (
        <div className="flex items-center justify-center gap-1 mt-1 text-[10px] text-amber-400 font-semibold">
          <Trophy className="w-3 h-3" />
          {match.winner_team === "team_a" ? "A" : "B"} thắng
        </div>
      ) : null}
    </div>
  )
}
