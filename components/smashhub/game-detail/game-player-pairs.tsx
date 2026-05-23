"use client"

import { useEffect, useState } from "react"
import { Link2, Loader2, Unlink } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  createPlayerPair,
  deletePlayerPair,
  updateGameSettings,
  type GameDetail,
  type GamePlayer,
} from "@/lib/api"
import {
  canArrangePairMatch,
  pairLabel,
  pairQuotaLabel,
  pairsFromGame,
  partnerIdFor,
} from "@/lib/player-pairs"

interface GamePlayerPairsProps {
  game: GameDetail
  players: GamePlayer[]
  canManage: boolean
  pairPick: number | null
  pairLoading?: boolean
  onUpdated: () => void
}

type LimitMode = "unlimited" | "limited"

function limitModeFromGame(game: GameDetail): LimitMode {
  return game.pair_matches_limit == null ? "unlimited" : "limited"
}

export function GamePlayerPairs({
  game,
  players,
  canManage,
  pairPick,
  pairLoading,
  onUpdated,
}: GamePlayerPairsProps) {
  const [loading, setLoading] = useState(false)
  const [limitSaving, setLimitSaving] = useState(false)
  const [limitMode, setLimitMode] = useState<LimitMode>(() => limitModeFromGame(game))
  const [limitInput, setLimitInput] = useState(() => String(game.pair_matches_limit ?? 5))

  useEffect(() => {
    setLimitMode(limitModeFromGame(game))
    setLimitInput(String(game.pair_matches_limit ?? 5))
  }, [game.id, game.pair_matches_limit])

  if (game.match_type !== "doubles") return null

  const pairs = pairsFromGame(game.player_pairs)
  const gameActive = game.status !== "finished" && game.status !== "cancelled"
  const limit = game.pair_matches_limit
  const quotaLabel =
    limit == null
      ? "Không giới hạn / cặp"
      : `Tối đa ${limit} trận giữ cặp / mỗi cặp${
          !canArrangePairMatch(game) ? " · mọi cặp đã hết" : ""
        }`

  const saveLimit = async (mode: LimitMode, customLimit?: number) => {
    setLimitSaving(true)
    try {
      const value =
        mode === "unlimited"
          ? ("unlimited" as const)
          : (customLimit ?? (parseInt(limitInput, 10) || 5))
      await updateGameSettings(game.id, { pair_matches_limit: value })
      onUpdated()
      toast.success("Đã cập nhật giới hạn trận giữ cặp")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể lưu")
    } finally {
      setLimitSaving(false)
    }
  }

  const handleRemovePair = async (pairId: number) => {
    setLoading(true)
    try {
      await deletePlayerPair(game.id, pairId)
      onUpdated()
      toast.success("Đã gỡ cặp")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể gỡ cặp")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-3 space-y-2 rounded-xl border border-border/40 bg-secondary/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <Link2 className="w-3.5 h-3.5 text-primary" />
          Cặp đánh chung
        </div>
        <span className="text-[10px] text-muted-foreground">{quotaLabel}</span>
      </div>

      {canManage && gameActive && (
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={limitMode}
            onValueChange={(v) => {
              const mode = v as LimitMode
              setLimitMode(mode)
              if (mode === "unlimited") {
                void saveLimit("unlimited")
              }
            }}
            disabled={limitSaving}
          >
            <SelectTrigger className="h-7 w-[130px] text-[10px] rounded-full">
              <SelectValue placeholder="Giới hạn trận cặp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unlimited">Mọi trận cặp</SelectItem>
              <SelectItem value="limited">Giới hạn số trận</SelectItem>
            </SelectContent>
          </Select>
          {limitMode === "limited" && (
            <>
              <Input
                type="number"
                min={1}
                max={99}
                className="h-7 w-14 text-xs rounded-full px-2"
                value={limitInput}
                onChange={(e) => setLimitInput(e.target.value)}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 rounded-full text-[10px] px-2"
                disabled={limitSaving}
                onClick={() => void saveLimit("limited", parseInt(limitInput, 10) || 5)}
              >
                Lưu
              </Button>
            </>
          )}
        </div>
      )}

      {pairs.length > 0 ? (
        <ul className="space-y-1.5">
          {pairs.map((pair) => {
            const quota = pairQuotaLabel(pair, limit)
            return (
            <li
              key={pair.id ?? `${pair.userA}-${pair.userB}`}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <Badge variant="secondary" className="rounded-full font-normal gap-1">
                <Link2 className="w-3 h-3" />
                {pairLabel(pair, players)}
                {quota != null && (
                  <span className="text-muted-foreground tabular-nums">
                    · {quota}
                  </span>
                )}
              </Badge>
              {canManage && gameActive && pair.id != null && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[10px] gap-1"
                  disabled={loading}
                  onClick={() => handleRemovePair(pair.id!)}
                >
                  <Unlink className="w-3 h-3" />
                  Gỡ
                </Button>
              )}
            </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          {canManage && gameActive
            ? "Chọn hai người trong danh sách bên dưới để ghép cặp."
            : "Chưa có cặp nào."}
        </p>
      )}

      {canManage && gameActive && (
        <p className="text-[10px] text-muted-foreground">
          {pairPick != null
            ? "Chọn người thứ hai để ghép cặp (bấm lại để hủy)."
            : "Gợi ý trận thường vẫn có thể tách cặp. Dùng nút «Sắp xếp cặp đấu» khi muốn giữ cặp cùng phe."}
          {(loading || pairLoading) && (
            <Loader2 className="inline w-3 h-3 ml-1 animate-spin" />
          )}
        </p>
      )}
    </div>
  )
}

export function useGamePlayerPairTap(
  game: GameDetail | null,
  canManage: boolean,
  onUpdated: () => void,
) {
  const [pairPick, setPairPick] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  if (!game || game.match_type !== "doubles") {
    return { pairPick: null as number | null, loading: false, onPlayerPairTap: undefined }
  }

  const pairs = pairsFromGame(game.player_pairs)
  const gameActive = game.status !== "finished" && game.status !== "cancelled"

  const onPlayerPairTap = async (playerId: number) => {
    if (!canManage || !gameActive) return
    if (partnerIdFor(playerId, pairs)) return

    if (pairPick == null) {
      setPairPick(playerId)
      return
    }
    if (pairPick === playerId) {
      setPairPick(null)
      return
    }

    setLoading(true)
    try {
      await createPlayerPair(game.id, pairPick, playerId)
      setPairPick(null)
      onUpdated()
      toast.success("Đã ghép cặp")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể ghép cặp")
    } finally {
      setLoading(false)
    }
  }

  return { pairPick, loading, onPlayerPairTap }
}
