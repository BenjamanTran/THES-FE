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
  type SettlementDraft,
  type SettlementComputed,
} from "@/lib/settlement/settlement-math"
import {
  defaultSettlementDraft,
  draftFromSettlementRecordOrDefault,
  draftToUpsertParams,
  settlementDraftSnapshot,
} from "@/lib/settlement/settlement-draft"

function playersForSettlement(players: GamePlayer[], hostId?: number) {
  return players.map((p) => ({
    id: p.id,
    name: p.name,
    gender: p.gender,
    arrived_at_court: p.arrived_at_court,
    isHost: p.id === hostId,
  }))
}

function arrivedIds(game: GameDetail | null): number[] {
  if (!game?.players) return []
  return game.players.filter((p) => p.arrived_at_court).map((p) => p.id)
}

export function canManageGameSettlement(game: GameDetail, userId: number): boolean {
  if (game.host?.id === userId) return true
  return game.players?.some((p) => p.id === userId && p.role === "co_host") ?? false
}

/** Standalone settlement — REST only, no Action Cable. */
export function useGameSettlement(gameId: number | null, open: boolean) {
  const { user } = useAuth()
  const [game, setGame] = useState<GameDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [response, setResponse] = useState<SettlementResponse | null>(null)
  const [draft, setDraft] = useState<SettlementDraft>(() => defaultSettlementDraft())
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canManage = useMemo(() => {
    if (!game || !user?.id) return false
    return response?.can_manage ?? canManageGameSettlement(game, user.id)
  }, [game, user?.id, response?.can_manage])

  const applyLoadedState = useCallback((gameData: GameDetail, res: SettlementResponse) => {
    setGame(gameData)
    setResponse(res)

    const canEditDraft =
      res.can_manage &&
      (res.editable || res.settlement?.status === "published" || !res.settlement)

    if (!canEditDraft && res.message) return

    const nextDraft = draftFromSettlementRecordOrDefault(res.settlement, arrivedIds(gameData))
    setDraft(nextDraft)
    setSavedSnapshot(res.settlement ? settlementDraftSnapshot(nextDraft) : null)
  }, [])

  const load = useCallback(async () => {
    if (!gameId) return
    setLoading(true)
    setError(null)
    try {
      const [gameData, res] = await Promise.all([
        fetchGame(gameId),
        fetchGameSettlement(gameId),
      ])
      applyLoadedState(gameData, res)
    } catch (err) {
      setGame(null)
      setResponse(null)
      setSavedSnapshot(null)
      setError(err instanceof Error ? err.message : "Không tải được quyết toán")
    } finally {
      setLoading(false)
    }
  }, [gameId, applyLoadedState])

  useEffect(() => {
    if (open && gameId) {
      void load()
    } else if (!open) {
      setGame(null)
      setResponse(null)
      setSavedSnapshot(null)
      setError(null)
    }
  }, [open, gameId, load])

  const readOnly = !(response?.can_manage && response?.editable)
  const published = response?.settlement?.status === "published"
  const statusLabel =
    response?.settlement?.status === "published"
      ? "Đã công bố"
      : response?.settlement?.status === "draft"
        ? "Nháp"
        : "Chưa tính"

  const hasUnsavedChanges = useMemo(() => {
    if (readOnly || !response?.settlement) return false
    if (savedSnapshot === null) return true
    return settlementDraftSnapshot(draft) !== savedSnapshot
  }, [draft, savedSnapshot, readOnly, response?.settlement])

  const localComputed = useMemo((): SettlementComputed | null => {
    if (!game?.players?.length) return null
    return computeSettlement(playersForSettlement(game.players, game.host?.id), draft)
  }, [game, draft])

  const computed =
    readOnly && response?.computed && !hasUnsavedChanges ? response.computed : localComputed

  const refreshPlayers = useCallback(async () => {
    if (!gameId) return
    try {
      const gameData = await fetchGame(gameId)
      setGame(gameData)
    } catch {
      toast.error("Không tải lại được danh sách người chơi")
    }
  }, [gameId])

  /** Lưu nháp hoặc cập nhật bản đã công bố — host/co-host, mọi lúc. */
  const persistSettlement = useCallback(
    async (options?: { silent?: boolean }): Promise<boolean> => {
      if (!gameId || readOnly) return false

      if (localComputed?.errors.length) {
        toast.error(localComputed.errors[0])
        return false
      }

      setSaving(true)
      try {
        const res = await upsertGameSettlement(gameId, draftToUpsertParams(draft))
        const gameData = await fetchGame(gameId)
        applyLoadedState(gameData, res)
        if (!options?.silent) {
          toast.success(published ? "Đã cập nhật tính tiền" : "Đã lưu nháp")
        }
        return true
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Không lưu được")
        return false
      } finally {
        setSaving(false)
      }
    },
    [gameId, readOnly, localComputed, draft, published, applyLoadedState],
  )

  const saveSettlement = useCallback(() => persistSettlement(), [persistSettlement])

  const publish = useCallback(async () => {
    if (!gameId || readOnly) return

    if (localComputed?.errors.length) {
      toast.error(localComputed.errors[0])
      return
    }

    setPublishing(true)
    try {
      if (hasUnsavedChanges || !response?.settlement) {
        const saved = await persistSettlement({ silent: true })
        if (!saved) return
      }
      const res = await publishGameSettlement(gameId)
      const gameData = await fetchGame(gameId)
      applyLoadedState(gameData, res)
      toast.success("Đã công bố tính tiền")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không công bố được")
    } finally {
      setPublishing(false)
    }
  }, [
    gameId,
    readOnly,
    localComputed,
    hasUnsavedChanges,
    response?.settlement,
    persistSettlement,
    applyLoadedState,
  ])

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
    hasUnsavedChanges,
    reload: load,
    refreshPlayers,
    saveSettlement,
    publish,
    hiddenMessage: response?.message,
  }
}
