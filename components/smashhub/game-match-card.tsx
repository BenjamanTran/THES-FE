"use client"

import { Loader2, Play, Flag, Pencil, Trash2, Star, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SKILL_LABELS, skillColors, type SkillLevel } from "./skill-badge"
import { GenderIcon } from "./gender-icon"
import { ratingToStars } from "@/lib/rating-stars"
import type { GameDetail, MatchSummary } from "@/lib/api"

export interface GameMatchCardProps {
  match: MatchSummary
  game: GameDetail
  canManage: boolean
  isGameTime: boolean
  isParticipant: boolean
  startingMatchId: number | null
  deletingMatchId: number | null
  onStartMatch: (matchId: number) => void
  onFinish: (match: MatchSummary) => void
  onEdit: (match: MatchSummary) => void
  onDelete: (matchId: number) => void
}

export function GameMatchCard({
  match,
  game,
  canManage,
  isGameTime,
  isParticipant,
  startingMatchId,
  deletingMatchId,
  onStartMatch,
  onFinish,
  onEdit,
  onDelete,
}: GameMatchCardProps) {
  const isPending = match.status === "pending"
  const isOngoing = match.status === "ongoing"
  const isFinished = match.status === "finished"
  const canFinishThis = isParticipant && isOngoing
  const statusBadge = isFinished
    ? { label: "Kết thúc", cls: "bg-neutral-500/20 text-neutral-300 border-neutral-500/30" }
    : isOngoing
      ? { label: "Đang chơi", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" }
      : { label: "Chờ bắt đầu", cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" }

  return (
    <div
      className={`min-w-0 overflow-hidden p-3 rounded-xl border ${
        isFinished
          ? "border-border/30 bg-secondary/30"
          : isOngoing
            ? "border-emerald-500/20 bg-emerald-500/5"
            : "border-amber-500/20 bg-amber-500/5"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-muted-foreground">
            Trận {match.match_number}
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 rounded-full shrink-0 ${statusBadge.cls}`}
          >
            {statusBadge.label}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {canManage && isPending && isGameTime && (
            <Button
              size="sm"
              className="rounded-full text-xs h-7 px-3 bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={() => onStartMatch(match.id)}
              disabled={startingMatchId === match.id}
            >
              {startingMatchId === match.id ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 mr-1" />
              )}
              Bắt đầu
            </Button>
          )}
          {canFinishThis && (
            <Button
              size="sm"
              className="rounded-full text-xs h-7 px-3 bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/30"
              onClick={() => onFinish(match)}
            >
              <Flag className="w-3.5 h-3.5 mr-1" />
              Kết thúc
            </Button>
          )}
          {canManage && !isFinished && (
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={() => onEdit(match)}
              title="Sửa trận"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
          {canManage && !isFinished && (
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(match.id)}
              disabled={deletingMatchId === match.id}
            >
              {deletingMatchId === match.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2 min-w-0">
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground mb-1 text-center">Team A</p>
          <div className="flex flex-wrap gap-1 justify-center">
            {match.team_a.map((p) => {
              const gp = game.players.find((pl) => pl.id === p.id)
              const gender = p.gender ?? gp?.gender
              const displayTier = gp?.host_rated_tier || p.rank?.tier
              const displayStars =
                gp?.host_rated_tier && gp?.host_rated_stars
                  ? gp.host_rated_stars
                  : p.rank
                    ? ratingToStars(p.rank.tier, p.rank.rating)
                    : null
              const tc = displayTier ? skillColors[displayTier] || skillColors.newbie : null
              return (
                <div key={p.id} className="flex flex-col items-center min-w-0 max-w-full">
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 rounded-b-none max-w-[10rem] truncate text-center inline-flex items-center justify-center gap-0.5"
                    title={p.name || `#${p.id}`}
                  >
                    {p.name || `#${p.id}`}
                    {gender && <GenderIcon gender={gender} size="sm" />}
                  </Badge>
                  {displayTier && tc && (
                    <span
                      className={`text-[9px] px-1.5 py-0 rounded-b-md ${tc.bg} ${tc.text} flex items-center justify-center gap-0.5 max-w-[10rem] truncate`}
                    >
                      {SKILL_LABELS[displayTier as SkillLevel]} {displayStars}
                      <Star className="w-2 h-2 fill-current shrink-0" />
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {isFinished && match.team_a_score != null && match.team_b_score != null ? (
          <div className="flex items-center justify-center gap-2 py-0.5">
            <span
              className={`text-lg font-bold ${match.winner_team === "team_a" ? "text-amber-400" : "text-muted-foreground"}`}
            >
              {match.team_a_score}
            </span>
            <span className="text-xs text-muted-foreground">–</span>
            <span
              className={`text-lg font-bold ${match.winner_team === "team_b" ? "text-amber-400" : "text-muted-foreground"}`}
            >
              {match.team_b_score}
            </span>
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground font-medium py-0.5">vs</p>
        )}

        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground mb-1 text-center">Team B</p>
          <div className="flex flex-wrap gap-1 justify-center">
            {match.team_b.map((p) => {
              const gp = game.players.find((pl) => pl.id === p.id)
              const gender = p.gender ?? gp?.gender
              const displayTier = gp?.host_rated_tier || p.rank?.tier
              const displayStars =
                gp?.host_rated_tier && gp?.host_rated_stars
                  ? gp.host_rated_stars
                  : p.rank
                    ? ratingToStars(p.rank.tier, p.rank.rating)
                    : null
              const tc = displayTier ? skillColors[displayTier] || skillColors.newbie : null
              return (
                <div key={p.id} className="flex flex-col items-center min-w-0 max-w-full">
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 rounded-b-none max-w-[10rem] truncate text-center inline-flex items-center justify-center gap-0.5"
                    title={p.name || `#${p.id}`}
                  >
                    {p.name || `#${p.id}`}
                    {gender && <GenderIcon gender={gender} size="sm" />}
                  </Badge>
                  {displayTier && tc && (
                    <span
                      className={`text-[9px] px-1.5 py-0 rounded-b-md ${tc.bg} ${tc.text} flex items-center justify-center gap-0.5 max-w-[10rem] truncate`}
                    >
                      {SKILL_LABELS[displayTier as SkillLevel]} {displayStars}
                      <Star className="w-2 h-2 fill-current shrink-0" />
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {isFinished && match.winner_team && (
        <div className="flex items-center justify-center gap-1 mt-2 pt-2 border-t border-border/20">
          <Trophy className="w-3 h-3 text-amber-400" />
          <span className="text-[10px] text-amber-400 font-medium">
            {match.winner_team === "team_a" ? "Team A" : "Team B"} thắng
          </span>
        </div>
      )}
    </div>
  )
}
