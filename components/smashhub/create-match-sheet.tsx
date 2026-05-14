"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Shuffle, Plus, X, AlertTriangle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { SkillBadge } from "./skill-badge"
import { createMatch, type GamePlayer, type MatchSummary } from "@/lib/api"
import { balanceTeams, calcFairness, hasWideSkillGap } from "@/lib/balance"

interface CreateMatchSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameId: number
  players: GamePlayer[]
  matches: MatchSummary[]
  matchType: "singles" | "doubles"
  onCreated: () => void
  autoBalance?: boolean
}

export function CreateMatchSheet({
  open,
  onOpenChange,
  gameId,
  players,
  matches,
  matchType,
  onCreated,
  autoBalance,
}: CreateMatchSheetProps) {
  const [teamA, setTeamA] = useState<number[]>([])
  const [teamB, setTeamB] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const playerStats = useMemo(() => {
    const stats: Record<number, { played: number; wins: number; losses: number }> = {}
    for (const m of matches) {
      const allPlayers = [...(m.team_a || []), ...(m.team_b || [])]
      for (const p of allPlayers) {
        if (!stats[p.id]) stats[p.id] = { played: 0, wins: 0, losses: 0 }
        stats[p.id].played += 1
        if (m.status === "finished" && m.winner_team) {
          const inTeamA = m.team_a.some((t) => t.id === p.id)
          const inTeamB = m.team_b.some((t) => t.id === p.id)
          const won = (m.winner_team === "team_a" && inTeamA) || (m.winner_team === "team_b" && inTeamB)
          if (won) stats[p.id].wins += 1
          else stats[p.id].losses += 1
        }
      }
    }
    return stats
  }, [matches])

  const teamSize = matchType === "singles" ? 1 : 2
  const assigned = new Set([...teamA, ...teamB])
  const available = players
    .filter((p) => !assigned.has(p.id))
    .sort((a, b) => (playerStats[a.id]?.played ?? 0) - (playerStats[b.id]?.played ?? 0))

  const addToTeam = (playerId: number, team: "a" | "b") => {
    if (team === "a" && teamA.length < teamSize) {
      setTeamA((prev) => [...prev, playerId])
    } else if (team === "b" && teamB.length < teamSize) {
      setTeamB((prev) => [...prev, playerId])
    }
  }

  const removeFromTeam = (playerId: number, team: "a" | "b") => {
    if (team === "a") setTeamA((prev) => prev.filter((id) => id !== playerId))
    else setTeamB((prev) => prev.filter((id) => id !== playerId))
  }

  const matchCounts = useMemo(() => {
    const counts: Record<number, number> = {}
    for (const p of players) counts[p.id] = playerStats[p.id]?.played ?? 0
    return counts
  }, [players, playerStats])

  const autoAssign = () => {
    const result = balanceTeams(players, teamSize, matchCounts)
    setTeamA(result.teamA)
    setTeamB(result.teamB)
  }

  const fairness = useMemo(() => {
    if (teamA.length === 0 || teamB.length === 0) return null
    return calcFairness(teamA, teamB, players)
  }, [teamA, teamB, players])

  const wideGap = useMemo(() => hasWideSkillGap(players), [players])

  useEffect(() => {
    if (open && autoBalance && teamA.length === 0 && teamB.length === 0) {
      autoAssign()
    }
  }, [open, autoBalance])

  const reset = () => {
    setTeamA([])
    setTeamB([])
    setError(null)
    setLoading(false)
  }

  const handleClose = (v: boolean) => {
    if (!v) reset()
    onOpenChange(v)
  }

  const canSubmit = teamA.length === teamSize && teamB.length === teamSize && !loading

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      await createMatch(gameId, { team_a: teamA, team_b: teamB })
      reset()
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo trận")
    } finally {
      setLoading(false)
    }
  }

  const playerName = (id: number) => players.find((p) => p.id === id)?.name || `#${id}`

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85dvh] overflow-y-auto px-4 sm:px-6">
        <SheetHeader className="px-0 pb-4">
          <SheetTitle className="text-left flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Tạo trận mới
          </SheetTitle>
          <SheetDescription className="text-left text-xs">
            Chọn {teamSize} người chơi cho mỗi đội ({matchType === "singles" ? "Đơn 1v1" : "Đôi 2v2"}).
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 pb-10 safe-bottom">
          <div className="flex justify-end gap-2">
            {(teamA.length > 0 || teamB.length > 0) && (
              <Button size="sm" variant="outline" className="rounded-full text-xs h-7" onClick={() => { setTeamA([]); setTeamB([]) }}>
                <RotateCcw className="w-3 h-3 mr-1" />
                Xoá
              </Button>
            )}
            <Button size="sm" variant="outline" className="rounded-full text-xs h-7" onClick={autoAssign}>
              <Shuffle className="w-3 h-3 mr-1" />
              Tự động chia đội
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TeamColumn
              label="Team A"
              ids={teamA}
              players={players}
              teamSize={teamSize}
              onRemove={(id) => removeFromTeam(id, "a")}
              highlight="text-blue-400"
            />
            <TeamColumn
              label="Team B"
              ids={teamB}
              players={players}
              teamSize={teamSize}
              onRemove={(id) => removeFromTeam(id, "b")}
              highlight="text-red-400"
            />
          </div>

          {fairness && (
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] text-muted-foreground">
                Avg: <span className="text-foreground font-semibold">{fairness.avgA}</span>
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  fairness.level === "good"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : fairness.level === "moderate"
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                }`}
              >
                {fairness.level === "good"
                  ? "Cân bằng"
                  : fairness.level === "moderate"
                    ? `Chênh lệch nhẹ (${fairness.diff})`
                    : `Chênh lệch lớn (${fairness.diff})`}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                Avg: <span className="text-foreground font-semibold">{fairness.avgB}</span>
              </span>
            </div>
          )}

          {wideGap && (
            <Card className="p-2.5 rounded-xl bg-amber-500/10 border-amber-500/30">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <p className="text-[10px] text-amber-400">
                  Trình độ chênh lệch lớn giữa các người chơi
                </p>
              </div>
            </Card>
          )}

          {available.length > 0 && (teamA.length < teamSize || teamB.length < teamSize) && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Chọn người chơi:</p>
              <div className="space-y-2">
                {available.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full text-xs h-7 px-2 flex-shrink-0"
                      onClick={() => addToTeam(p.id, "a")}
                      disabled={teamA.length >= teamSize}
                    >
                      A ←
                    </Button>
                    <div className="flex-1 min-w-0 flex items-center gap-1.5">
                      <span className="text-xs font-medium truncate">{p.name || `#${p.id}`}</span>
                      <SkillBadge level={p.rank?.tier ?? null} size="xs" compact />
                      {(() => {
                        const s = playerStats[p.id]
                        const played = s?.played || 0
                        return (
                          <span className="text-[10px] font-semibold">
                            <span className="text-muted-foreground">{played} trận</span>
                            {s && s.wins > 0 && <span className="text-emerald-400"> {s.wins}W</span>}
                            {s && s.losses > 0 && <span className="text-red-400"> {s.losses}L</span>}
                          </span>
                        )
                      })()}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full text-xs h-7 px-2 flex-shrink-0"
                      onClick={() => addToTeam(p.id, "b")}
                      disabled={teamB.length >= teamSize}
                    >
                      → B
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <Card className="p-3 rounded-2xl bg-destructive/10 border-destructive/30">
              <p className="text-xs text-destructive">{error}</p>
            </Card>
          )}

          <div className="flex gap-3 pt-4 pb-6">
            <Button variant="outline" className="flex-1 rounded-full" onClick={() => handleClose(false)} disabled={loading}>
              Huỷ
            </Button>
            <Button className="flex-1 rounded-full" onClick={handleSubmit} disabled={!canSubmit}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              Tạo trận
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function TeamColumn({
  label,
  ids,
  players,
  teamSize,
  onRemove,
  highlight,
}: {
  label: string
  ids: number[]
  players: GamePlayer[]
  teamSize: number
  onRemove: (id: number) => void
  highlight: string
}) {
  return (
    <Card className="p-3 rounded-xl border-border/50">
      <p className={`text-xs font-semibold mb-2 ${highlight}`}>{label}</p>
      <div className="space-y-1.5 min-h-[48px]">
        {ids.map((id) => {
          const p = players.find((pl) => pl.id === id)
          return (
            <div key={id} className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-xs truncate">{p?.name || `#${id}`}</span>
                <SkillBadge level={p?.rank?.tier ?? null} size="xs" compact showIcon={false} />
              </div>
              <button type="button" onClick={() => onRemove(id)} className="text-muted-foreground hover:text-destructive flex-shrink-0">
                <X className="w-3 h-3" />
              </button>
            </div>
          )
        })}
        {Array.from({ length: teamSize - ids.length }).map((_, i) => (
          <div key={`empty-${i}`} className="h-5 rounded border border-dashed border-muted-foreground/20 flex items-center justify-center">
            <span className="text-[10px] text-muted-foreground/40">trống</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
