"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Shuffle, Plus, X, AlertTriangle, RotateCcw, Star, Mars, Venus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { SkillBadge } from "./skill-badge"
import { GenderIcon } from "./gender-icon"
import { sessionSkillStars, sessionSkillTier } from "@/lib/player-session-skill"
import { createMatch, updateMatch, type GamePlayer, type MatchSummary } from "@/lib/api"
import {
  balanceTeams,
  fillSlots,
  calcFairness,
  lineupSkillGap,
  type DoublesGenderMode,
} from "@/lib/balance"
import { compositeFairnessCounts } from "@/lib/match-stats"

interface CreateMatchSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameId: number
  players: GamePlayer[]
  matches: MatchSummary[]
  matchType: "singles" | "doubles"
  onCreated: () => void
  autoBalance?: boolean
  editingMatch?: MatchSummary | null
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
  editingMatch = null,
}: CreateMatchSheetProps) {
  const isEdit = editingMatch != null
  const [teamA, setTeamA] = useState<number[]>([])
  const [teamB, setTeamB] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const teamSize = matchType === "singles" ? 1 : 2

  const normalizeForSearch = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

  const matchCounts = useMemo(() => compositeFairnessCounts(players, matches), [players, matches])

  const sortByName = (a: GamePlayer, b: GamePlayer) =>
    (a.name || "").localeCompare(b.name || "", "vi")

  const assigned = new Set([...teamA, ...teamB])
  const searchQuery = normalizeForSearch(search.trim())
  const available = players
    .filter((p) => !assigned.has(p.id))
    .filter((p) => {
      if (!searchQuery) return true
      return normalizeForSearch(p.name || "").includes(searchQuery)
    })
    .sort(sortByName)
  const hasUnassigned = players.some((p) => !assigned.has(p.id))

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

  const genderModeError = (mode: DoublesGenderMode): string | null => {
    if (mode === "any") return null
    const eligible = players
    const males = eligible.filter((p) => p.gender === "male").length
    const females = eligible.filter((p) => p.gender === "female").length
    if (mode === "mens" && males < 4) return "Cần ít nhất 4 nam để chia đôi nam"
    if (mode === "womens" && females < 4) return "Cần ít nhất 4 nữ để chia đôi nữ"
    if (mode === "mixed" && (males < 2 || females < 2)) {
      return "Cần ít nhất 2 nam và 2 nữ để chia đôi nam/nữ"
    }
    return null
  }

  const autoAssign = (genderMode: DoublesGenderMode = "any") => {
    setError(null)
    if (matchType === "doubles" && genderMode !== "any") {
      const msg = genderModeError(genderMode)
      if (msg) {
        setError(msg)
        return
      }
    }

    const hasPartial = teamA.length > 0 || teamB.length > 0
    const isFull = teamA.length >= teamSize && teamB.length >= teamSize

    const current = { teamA, teamB }

    if (isFull || !hasPartial) {
      const eligible = players
      const result = balanceTeams(eligible, teamSize, matchCounts, genderMode, 0, current)
      if (result.teamA.length < teamSize || result.teamB.length < teamSize) {
        setError(genderModeError(genderMode) || "Không đủ người chơi phù hợp để chia đội")
        return
      }
      setTeamA(result.teamA)
      setTeamB(result.teamB)
    } else {
      const locked = new Set([...teamA, ...teamB])
      const candidates = players.filter((p) => !locked.has(p.id))
      const result = fillSlots(
        teamA,
        teamB,
        teamSize,
        candidates,
        players,
        matchCounts,
        genderMode,
        0,
        current,
      )
      if (result.teamA.length < teamSize || result.teamB.length < teamSize) {
        setError(genderModeError(genderMode) || "Không đủ người chơi phù hợp để hoàn thành đội")
        return
      }
      setTeamA(result.teamA)
      setTeamB(result.teamB)
    }

  }

  const fairness = useMemo(() => {
    if (teamA.length === 0 || teamB.length === 0) return null
    return calcFairness(teamA, teamB, players)
  }, [teamA, teamB, players])

  const lineupGap = useMemo(
    () => lineupSkillGap(teamA, teamB, players),
    [teamA, teamB, players],
  )

  useEffect(() => {
    if (!open) return
    setSearch("")
    if (editingMatch) {
      setTeamA(editingMatch.team_a.map((p) => p.id))
      setTeamB(editingMatch.team_b.map((p) => p.id))
      setError(null)
      return
    }
    setTeamA([])
    setTeamB([])
    setError(null)
    if (autoBalance) {
      autoAssign()
    }
  }, [open, editingMatch?.id, autoBalance])

  const reset = () => {
    setTeamA([])
    setTeamB([])
    setError(null)
    setLoading(false)
    setSearch("")
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
      if (isEdit && editingMatch) {
        await updateMatch(gameId, editingMatch.id, { team_a: teamA, team_b: teamB })
      } else {
        await createMatch(gameId, { team_a: teamA, team_b: teamB })
      }
      reset()
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : isEdit ? "Không thể cập nhật trận" : "Không thể tạo trận")
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
            {isEdit ? (
              <>Sửa trận {editingMatch.match_number}</>
            ) : (
              <>
                <Plus className="w-5 h-5 text-primary" />
                Tạo trận mới
              </>
            )}
          </SheetTitle>
          <SheetDescription className="text-left text-xs">
            Chọn {teamSize} người chơi cho mỗi đội ({matchType === "singles" ? "Đơn 1v1" : "Đôi 2v2"}).
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 pb-10 safe-bottom">
          <div className="flex flex-col gap-2">
            <div className="flex justify-end gap-2 flex-wrap">
              {(teamA.length > 0 || teamB.length > 0) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full text-xs h-7"
                  onClick={() => {
                    setTeamA([])
                    setTeamB([])
                    setError(null)
                  }}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Xoá
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="rounded-full text-xs h-7"
                onClick={() => autoAssign("any")}
              >
                <Shuffle className="w-3 h-3 mr-1" />
                Tự động chia đội
              </Button>
            </div>
            {matchType === "doubles" && (
              <div className="flex flex-wrap gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full text-xs h-7 gap-1 border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 hover:border-blue-500/50"
                  onClick={() => autoAssign("mens")}
                >
                  <Mars className="w-3.5 h-3.5 shrink-0" />
                  Đôi nam
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full text-xs h-7 gap-1 border-purple-500/40 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 hover:border-purple-500/50"
                  onClick={() => autoAssign("mixed")}
                >
                  <Mars className="w-3.5 h-3.5 shrink-0" />
                  <Venus className="w-3.5 h-3.5 shrink-0" />
                  Đôi nam/nữ
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full text-xs h-7 gap-1 border-pink-500/40 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 hover:text-pink-300 hover:border-pink-500/50"
                  onClick={() => autoAssign("womens")}
                >
                  <Venus className="w-3.5 h-3.5 shrink-0" />
                  Đôi nữ
                </Button>
              </div>
            )}
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

          {lineupGap.showWarning && (
            <Card className="p-2.5 rounded-xl bg-amber-500/10 border-amber-500/30">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-400 leading-snug">
                  Trong 4 người trận này chênh {lineupGap.tierSpread} bậc
                  {lineupGap.ratingSpread > 0 ? ` (~${lineupGap.ratingSpread} điểm)` : ""}.
                  {fairness && fairness.level !== "poor"
                    ? " Trung bình 2 đội vẫn gần nhau — cân nhắc đổi cặp."
                    : ""}
                </p>
              </div>
            </Card>
          )}

          {hasUnassigned && (teamA.length < teamSize || teamB.length < teamSize) && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Chọn người chơi:</p>
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm người chơi theo tên..."
                  className="pl-8 h-9 rounded-full"
                />
              </div>
              {available.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Không tìm thấy người chơi nào.</p>
              ) : (
                <div className="space-y-2">
                  {available.map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full text-sm h-10 min-w-10 px-3 flex-shrink-0"
                        onClick={() => addToTeam(p.id, "a")}
                        disabled={teamA.length >= teamSize}
                      >
                        A ←
                      </Button>
                      <div className="flex-1 min-w-0 flex items-center gap-1.5">
                        <span className="text-xs font-medium truncate">{p.name || `#${p.id}`}</span>
                        {p.gender && <GenderIcon gender={p.gender} size="sm" />}
                        <SkillBadge level={sessionSkillTier(p)} size="xs" compact />
                        {(() => {
                          const stars = sessionSkillStars(p)
                          if (stars == null) return null
                          return (
                            <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
                              {stars}<Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                            </span>
                          )
                        })()}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full text-sm h-10 min-w-10 px-3 flex-shrink-0"
                        onClick={() => addToTeam(p.id, "b")}
                        disabled={teamB.length >= teamSize}
                      >
                        → B
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : isEdit ? null : (
                <Plus className="w-4 h-4 mr-1" />
              )}
              {isEdit ? "Lưu thay đổi" : "Tạo trận"}
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
              <div className="flex items-center gap-1 min-w-0 flex-wrap">
                <span className="text-xs">{p?.name || `#${id}`}</span>
                {p?.gender && <GenderIcon gender={p.gender} size="sm" />}
                <SkillBadge level={sessionSkillTier(p)} size="xs" compact showIcon={false} />
                {(() => {
                  const stars = sessionSkillStars(p)
                  if (stars == null) return null
                  return (
                    <span className="flex items-center gap-0.5 text-[9px] text-amber-400">
                      {stars}<Star className="w-2 h-2 fill-amber-400 text-amber-400" />
                    </span>
                  )
                })()}
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
