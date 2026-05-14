"use client"

import { useState } from "react"
import { Trophy, Loader2, AlertTriangle, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { finishMatch, type FinishMatchResponse } from "@/lib/api"

interface ScoreEntryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameId: number
  matchId: number
  matchNumber: number
  onFinished: (res: FinishMatchResponse) => void
}

type Step = "score" | "confirm"

export function ScoreEntryModal({ open, onOpenChange, gameId, matchId, matchNumber, onFinished }: ScoreEntryModalProps) {
  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)
  const [winnerOverride, setWinnerOverride] = useState<"team_a" | "team_b" | null>(null)
  const [step, setStep] = useState<Step>("score")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isTied = scoreA === scoreB && scoreA > 0
  const autoWinner = scoreA > scoreB ? "team_a" : scoreB > scoreA ? "team_b" : null
  const effectiveWinner = winnerOverride ?? autoWinner

  const reset = () => {
    setScoreA(0)
    setScoreB(0)
    setWinnerOverride(null)
    setStep("score")
    setError(null)
    setLoading(false)
  }

  const handleClose = (v: boolean) => {
    if (!v) reset()
    onOpenChange(v)
  }

  const handleSubmitWithScores = async () => {
    if (!effectiveWinner) return
    setLoading(true)
    setError(null)
    try {
      const res = await finishMatch(gameId, matchId, {
        team_a_score: scoreA,
        team_b_score: scoreB,
        winner_team: effectiveWinner,
      })
      onFinished(res)
      handleClose(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể kết thúc trận")
      setStep("score")
    } finally {
      setLoading(false)
    }
  }

  const handleEndWithoutScores = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await finishMatch(gameId, matchId)
      onFinished(res)
      handleClose(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể kết thúc trận")
    } finally {
      setLoading(false)
    }
  }

  const clamp = (v: number) => Math.max(0, Math.min(31, v))

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm mx-auto rounded-3xl p-0 gap-0">
        <DialogTitle className="sr-only">Kết thúc trận {matchNumber}</DialogTitle>
        <DialogDescription className="sr-only">
          Nhập điểm và chọn đội thắng để kết thúc trận đấu.
        </DialogDescription>

        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-lg">Kết thúc trận {matchNumber}</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Nhập điểm cuối cùng hoặc kết thúc không ghi điểm.
          </p>
        </div>

        {step === "score" && (
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <ScoreInput
                label="Team A"
                value={scoreA}
                onChange={(v) => { setScoreA(clamp(v)); setWinnerOverride(null) }}
                isWinner={effectiveWinner === "team_a"}
                onForceWin={isTied ? () => setWinnerOverride("team_a") : undefined}
              />
              <ScoreInput
                label="Team B"
                value={scoreB}
                onChange={(v) => { setScoreB(clamp(v)); setWinnerOverride(null) }}
                isWinner={effectiveWinner === "team_b"}
                onForceWin={isTied ? () => setWinnerOverride("team_b") : undefined}
              />
            </div>

            {isTied && !winnerOverride && (
              <Card className="p-3 rounded-2xl bg-amber-500/10 border-amber-500/30">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-400">
                    Điểm hòa — hãy chọn đội thắng bằng cách bấm vào tên team.
                  </p>
                </div>
              </Card>
            )}

            {error && (
              <Card className="p-3 rounded-2xl bg-destructive/10 border-destructive/30">
                <p className="text-xs text-destructive">{error}</p>
              </Card>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <Button
                className="rounded-full"
                disabled={!effectiveWinner || loading}
                onClick={() => setStep("confirm")}
              >
                Xác nhận điểm
              </Button>
              <Button
                variant="ghost"
                className="rounded-full text-muted-foreground text-xs"
                onClick={() => {
                  if (window.confirm("Kết thúc trận không ghi điểm? Rating sẽ không thay đổi.")) {
                    handleEndWithoutScores()
                  }
                }}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Kết thúc không ghi điểm
              </Button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="px-6 py-4 space-y-4">
            <Card className="p-4 rounded-2xl border-border/50 text-center">
              <p className="text-sm font-medium mb-3">Kết quả trận {matchNumber}</p>
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Team A</p>
                  <p className={`text-3xl font-bold ${effectiveWinner === "team_a" ? "text-amber-400" : "text-muted-foreground"}`}>
                    {scoreA}
                  </p>
                  {effectiveWinner === "team_a" && (
                    <Badge className="mt-1 bg-amber-500/20 text-amber-400 border-0 text-[10px]">
                      <Trophy className="w-3 h-3 mr-0.5" />
                      Thắng
                    </Badge>
                  )}
                </div>
                <span className="text-2xl font-bold text-muted-foreground">–</span>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Team B</p>
                  <p className={`text-3xl font-bold ${effectiveWinner === "team_b" ? "text-amber-400" : "text-muted-foreground"}`}>
                    {scoreB}
                  </p>
                  {effectiveWinner === "team_b" && (
                    <Badge className="mt-1 bg-amber-500/20 text-amber-400 border-0 text-[10px]">
                      <Trophy className="w-3 h-3 mr-0.5" />
                      Thắng
                    </Badge>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-3 rounded-2xl bg-amber-500/10 border-amber-500/30">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-400">
                  Kết thúc trận? Hành động này không thể hoàn tác.
                </p>
              </div>
            </Card>

            {error && (
              <Card className="p-3 rounded-2xl bg-destructive/10 border-destructive/30">
                <p className="text-xs text-destructive">{error}</p>
              </Card>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-full"
                onClick={() => setStep("score")}
                disabled={loading}
              >
                Quay lại
              </Button>
              <Button
                className="flex-1 rounded-full"
                onClick={handleSubmitWithScores}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trophy className="w-4 h-4 mr-1" />}
                Kết thúc
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ScoreInput({
  label,
  value,
  onChange,
  isWinner,
  onForceWin,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  isWinner: boolean
  onForceWin?: () => void
}) {
  return (
    <div className="text-center">
      <button
        type="button"
        className={`text-xs font-semibold mb-2 px-2 py-0.5 rounded-full transition-colors ${
          isWinner
            ? "bg-amber-500/20 text-amber-400"
            : onForceWin
              ? "text-muted-foreground hover:text-foreground cursor-pointer"
              : "text-muted-foreground"
        }`}
        onClick={onForceWin}
        disabled={!onForceWin}
      >
        {label} {isWinner && "👑"}
      </button>
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => onChange(value - 1)}
          disabled={value <= 0}
        >
          <Minus className="w-3 h-3" />
        </Button>
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={String(value)}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, "").replace(/^0+(\d)/, "$1")
            const num = raw === "" ? 0 : Math.min(31, parseInt(raw, 10))
            onChange(num)
          }}
          className="w-14 h-12 text-center text-2xl font-bold bg-secondary rounded-xl border-0 focus:ring-2 focus:ring-primary"
        />
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => onChange(value + 1)}
          disabled={value >= 31}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}
