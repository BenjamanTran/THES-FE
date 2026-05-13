"use client"

import { useState } from "react"
import { Loader2, Shuffle, Plus, X } from "lucide-react"
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
import { createMatch, type GamePlayer } from "@/lib/api"

interface CreateMatchSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameId: number
  players: GamePlayer[]
  matchType: "singles" | "doubles"
  onCreated: () => void
}

export function CreateMatchSheet({
  open,
  onOpenChange,
  gameId,
  players,
  matchType,
  onCreated,
}: CreateMatchSheetProps) {
  const [teamA, setTeamA] = useState<number[]>([])
  const [teamB, setTeamB] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const teamSize = matchType === "singles" ? 1 : 2
  const assigned = new Set([...teamA, ...teamB])
  const available = players.filter((p) => !assigned.has(p.id))

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

  const autoAssign = () => {
    const sorted = [...players].sort((a, b) => {
      const rA = a.rank?.rating ?? 1000
      const rB = b.rank?.rating ?? 1000
      return rB - rA
    })

    const newA: number[] = []
    const newB: number[] = []

    for (const p of sorted) {
      if (newA.length < teamSize) newA.push(p.id)
      else if (newB.length < teamSize) newB.push(p.id)
      else break
    }

    setTeamA(newA)
    setTeamB(newB)
  }

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

        <div className="space-y-4 pb-6 safe-bottom">
          <div className="flex justify-end">
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

          {available.length > 0 && (teamA.length < teamSize || teamB.length < teamSize) && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Chọn người chơi:</p>
              <div className="flex flex-wrap gap-2">
                {available.map((p) => (
                  <div key={p.id} className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full text-xs h-7 px-2"
                      onClick={() => addToTeam(p.id, "a")}
                      disabled={teamA.length >= teamSize}
                    >
                      A ←
                    </Button>
                    <Badge variant="secondary" className="text-xs px-2 py-1">
                      {p.name || `#${p.id}`}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full text-xs h-7 px-2"
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

          <div className="flex gap-3 pt-2">
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
            <div key={id} className="flex items-center justify-between">
              <span className="text-xs truncate">{p?.name || `#${id}`}</span>
              <button type="button" onClick={() => onRemove(id)} className="text-muted-foreground hover:text-destructive">
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
