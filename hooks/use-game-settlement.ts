"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { fetchGame, type GameDetail, type GamePlayer } from "@/lib/api"
import {
  fetchGameSettlement,
  publishGameSettlement,
  upsertGameSettlement,
  type SettlementResponse,
} from "@/lib/api/settlement"
import { useAuth } from "@/lib/auth-context"
import {
  computeSettlement,
  newExpenseLine,
  normalizeExpenseLine,
  type SettlementDraft,
  type SettlementComputed,
} from "@/lib/settlement/settlement-math"

function defaultDraft(game?: GameDetail | null): SettlementDraft {
  const suggest = game?.min_price && game.min_price > 0 ? game.min_price : 0
  return {
    mode: "split_evenly",
    expense_lines: [newExpenseLine("Sân")],
    gender_adjustment_steps: 0,
    fixed_male_price: suggest,
    fixed_female_price: suggest,
  }
}

function draftFromResponse(res: SettlementResponse, game?: GameDetail | null): SettlementDraft {
  if (!res.settlement) return defaultDraft(game)
  return {
    mode: res.settlement.mode,
    expense_lines: res.settlement.expense_lines.map((l) =>
      normalizeExpenseLine(l as Parameters<typeof normalizeExpenseLine>[0]),
    ),
    gender_adjustment_steps: res.settlement.gender_adjustment_steps,
    fixed_male_price: res.settlement.fixed_male_price,
    fixed_female_price: res.settlement.fixed_female_price,
  }
}

function playersForSettlement(players: GamePlayer[], hostId?: number) {
  return players.map((p) => ({
    id: p.id,
    name: p.name,
    gender: p.gender,
    arrived_at_court: p.arrived_at_court,
    isHost: p.id === hostId,
  }))
}

export function canManageGameSettlement(game: GameDetail, userId: number): boolean {
  if (game.host?.id === userId) return true
  return game.players?.some((p) => p.id === userId && p.role === "co_host") ?? false
}

/** Standalone settlement — loads game + settlement via REST only (no Action Cable). */
export function useGameSettlement(gameId: number | null, open: boolean) {
  const { user } = useAuth()
  const [game, setGame] = useState<GameDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [response, setResponse] = useState<SettlementResponse | null>(null)
  const [draft, setDraft] = useState<SettlementDraft>(() => defaultDraft())
  const [error, setError] = useState<string | null>(null)

  const canManage = useMemo(() => {
    if (!game || !user?.id) return false
    return response?.can_manage ?? canManageGameSettlement(game, user.id)
  }, [game, user?.id, response?.can_manage])

  const load = useCallback(async () => {
    if (!gameId) return
    setLoading(true)
    setError(null)
    try {
      const [gameData, res] = await Promise.all([
        fetchGame(gameId),
        fetchGameSettlement(gameId),
      ])
      setGame(gameData)
      setResponse(res)
      if (res.settlement && (res.editable || res.settlement.status === "published")) {
        setDraft(draftFromResponse(res, gameData))
      } else if (res.editable && !res.settlement) {
        setDraft(defaultDraft(gameData))
      }
    } catch (err) {
      setGame(null)
      setResponse(null)
      setError(err instanceof Error ? err.message : "Không tải được quyết toán")
    } finally {
      setLoading(false)
    }
  }, [gameId])

  useEffect(() => {
    if (open && gameId) {
      void load()
    } else if (!open) {
      setGame(null)
      setResponse(null)
      setError(null)
    }
  }, [open, gameId, load])

  const readOnly = !response?.editable
  const published = response?.settlement?.status === "published"
  const statusLabel =
    response?.settlement?.status === "published"
      ? "Đã công bố"
      : response?.settlement?.status === "draft"
        ? "Nháp"
        : "Chưa tính"

  const localComputed = useMemo((): SettlementComputed | null => {
    if (!game?.players?.length) return null
    return computeSettlement(playersForSettlement(game.players, game.host?.id), draft)
  }, [game, draft])

  const computed = readOnly && response?.computed ? response.computed : localComputed

  const saveDraft = useCallback(async () => {
    if (!gameId || readOnly) return
    setSaving(true)
    try {
      const res = await upsertGameSettlement(gameId, draft)
      setResponse(res)
      toast.success("Đã lưu nháp")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không lưu được")
    } finally {
      setSaving(false)
    }
  }, [gameId, draft, readOnly])

  const publish = useCallback(async () => {
    if (!gameId || readOnly) return
    setPublishing(true)
    try {
      await upsertGameSettlement(gameId, draft)
      const res = await publishGameSettlement(gameId)
      setResponse(res)
      toast.success("Đã công bố tính tiền")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không công bố được")
    } finally {
      setPublishing(false)
    }
  }, [gameId, draft, readOnly])

  return {
    game,
    loading,
    saving,
    publishing,
    error,
    response,
    draft,
    setDraft,
    computed,
    readOnly,
    published,
    statusLabel,
    canManage,
    reload: load,
    saveDraft,
    publish,
    hiddenMessage: response?.message,
  }
}
