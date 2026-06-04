"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CheckCircle2, LogOut, Users, XCircle } from "lucide-react"
import {
  adjustSessionPlayed,
  deletePlaceholder,
  fetchGame,
  joinGame,
  kickPlayer,
  leaveGame,
  ratePlayer,
  type GameDetail,
  type GamePlayer,
  type Tier,
} from "@/lib/api"
import { ratingToStars } from "@/lib/rating-stars"
import { countPlayersByGender, formatPlayerGenderLabel } from "@/lib/player-gender-counts"
import { useAuth, useRequireAuth } from "@/lib/auth-context"
import { reverseGeocode } from "@/lib/geocode"
import { useGameCable } from "@/hooks/use-game-cable"
import type { GameCableEvent } from "@/lib/game-cable"

function playedCount(player: GamePlayer): number {
  return player.session_matches?.played ?? 0
}

export function useGameDetailSimple(gameId: number | null, onClose: () => void) {
  const { user } = useAuth()
  const requireAuth = useRequireAuth()
  const currentUserId = user?.id ?? -1
  const [game, setGame] = useState<GameDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [adjustingUserId, setAdjustingUserId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null)
  const [resolvingAddress, setResolvingAddress] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [showPlaceholderSheet, setShowPlaceholderSheet] = useState(false)
  const [editingPlaceholder, setEditingPlaceholder] = useState<GamePlayer | null>(null)
  const [ratingPlayer, setRatingPlayer] = useState<GamePlayer | null>(null)
  const [rateTier, setRateTier] = useState<Tier>("newbie")
  const [rateStars, setRateStars] = useState(3)
  const [rateNote, setRateNote] = useState("")
  const [rateSaving, setRateSaving] = useState(false)
  const open = gameId !== null
  const gameIdRef = useRef(gameId)
  gameIdRef.current = gameId

  const loadGame = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    setWarning(null)
    try {
      const data = await fetchGame(id)
      setGame(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được trận đấu")
    } finally {
      setLoading(false)
    }
  }, [])

  const reloadGameQuiet = useCallback(async (id: number) => {
    try {
      const data = await fetchGame(id)
      setGame(data)
    } catch {
      /* background sync */
    }
  }, [])

  useEffect(() => {
    if (gameId === null) {
      setGame(null)
      return
    }
    void loadGame(gameId)
  }, [gameId, loadGame])

  useEffect(() => {
    setResolvedAddress(null)
    if (!game || game.location) return

    const lat = typeof game.lat === "string" ? parseFloat(game.lat) : game.lat
    const lng = typeof game.lng === "string" ? parseFloat(game.lng) : game.lng
    if (lat === null || lng === null || !Number.isFinite(lat) || !Number.isFinite(lng)) return

    const controller = new AbortController()
    setResolvingAddress(true)
    reverseGeocode(lat, lng, controller.signal)
      .then((addr) => {
        if (!controller.signal.aborted) setResolvedAddress(addr)
      })
      .finally(() => {
        if (!controller.signal.aborted) setResolvingAddress(false)
      })

    return () => controller.abort()
  }, [game])

  const isHost = game?.host?.id === currentUserId
  const isCoHost = useMemo(
    () => !!game?.players.some((p) => p.id === currentUserId && p.role === "co_host"),
    [game, currentUserId],
  )
  const canManage = isHost || isCoHost
  const canManagePlaceholders =
    canManage &&
    game != null &&
    game.status !== "finished" &&
    game.status !== "cancelled"
  const isParticipant = useMemo(
    () => !!game?.players.some((p) => p.id === currentUserId),
    [game, currentUserId],
  )
  const isPast = useMemo(() => {
    if (!game) return false
    return new Date(game.end_time).getTime() < Date.now()
  }, [game])
  const gameActive = game != null && game.status !== "finished" && game.status !== "cancelled"

  const sortedPlayers = useMemo(() => {
    if (!game?.players) return []
    return [...game.players].sort((a, b) => playedCount(a) - playedCount(b))
  }, [game?.players])

  const minPlayed = useMemo(() => {
    if (sortedPlayers.length === 0) return 0
    return Math.min(...sortedPlayers.map(playedCount))
  }, [sortedPlayers])

  const playerGenderLabel = useMemo(
    () => formatPlayerGenderLabel(countPlayersByGender(game?.players ?? [])),
    [game?.players],
  )

  const handleJoin = async () => {
    if (!game) return
    if (!requireAuth()) return
    setActionLoading(true)
    setError(null)
    setWarning(null)
    try {
      const res = await joinGame(game.id)
      if (res.warning) setWarning(res.warning)
      await loadGame(game.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tham gia")
    } finally {
      setActionLoading(false)
    }
  }

  const handleLeave = async () => {
    if (!game) return
    if (!requireAuth()) return
    const confirmMsg = isHost
      ? "Huỷ trận này? Tất cả người chơi sẽ bị xoá khỏi trận."
      : "Bạn chắc chắn muốn rời trận?"
    if (!window.confirm(confirmMsg)) return

    setActionLoading(true)
    setError(null)
    try {
      await leaveGame(game.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể rời trận")
    } finally {
      setActionLoading(false)
    }
  }

  const primaryAction = useMemo(() => {
    if (!game) return null
    if (game.status === "cancelled" || game.status === "finished" || isPast) return null
    if (game.status === "ongoing") return null

    if (isHost) {
      return {
        label: "Huỷ trận",
        icon: XCircle,
        variant: "destructive" as const,
        onClick: handleLeave,
      }
    }
    if (isParticipant) {
      return {
        label: "Rời trận",
        icon: LogOut,
        variant: "outline" as const,
        onClick: handleLeave,
        destructive: true,
      }
    }
    if (game.status === "full") {
      return {
        label: "Đã đầy",
        icon: Users,
        variant: "secondary" as const,
        disabled: true,
        onClick: () => {},
      }
    }
    return {
      label: "Tham gia",
      icon: CheckCircle2,
      variant: "default" as const,
      onClick: handleJoin,
    }
  }, [game, isHost, isParticipant, isPast, handleJoin, handleLeave])

  const handleCableEvent = useCallback(
    (payload: GameCableEvent) => {
      if (payload.event === "game.refresh") {
        const id = gameIdRef.current
        if (id != null) void loadGame(id)
        return
      }
      if (payload.event === "player.session_played" && "player" in payload && payload.player) {
        setGame((g) => {
          if (!g) return g
          const exists = g.players.some((p) => p.id === payload.player.id)
          const players = exists
            ? g.players.map((p) => (p.id === payload.player.id ? payload.player : p))
            : [...g.players, payload.player]
          return { ...g, players }
        })
        return
      }
      if (
        payload.event === "match.created" ||
        payload.event === "match.updated" ||
        payload.event === "match.started" ||
        payload.event === "match.finished" ||
        payload.event === "match.undo" ||
        payload.event === "match.deleted"
      ) {
        const id = gameIdRef.current
        if (id != null) void reloadGameQuiet(id)
      }
    },
    [loadGame, reloadGameQuiet],
  )

  const cableEnabled =
    open &&
    gameId != null &&
    game != null &&
    game.status !== "finished" &&
    game.status !== "cancelled"

  const cableConnected = useGameCable(gameId, handleCableEvent, cableEnabled, {
    onConnected: () => {
      const id = gameIdRef.current
      if (id != null) void reloadGameQuiet(id)
    },
    onRejected: () => {
      const id = gameIdRef.current
      if (id != null) void reloadGameQuiet(id)
    },
  })

  useEffect(() => {
    if (!cableEnabled) return
    const pollMs = cableConnected ? 60_000 : 5_000
    const interval = window.setInterval(() => {
      const id = gameIdRef.current
      if (id != null) void reloadGameQuiet(id)
    }, pollMs)
    return () => window.clearInterval(interval)
  }, [cableEnabled, cableConnected, reloadGameQuiet])

  const reloadGame = useCallback(() => {
    if (gameIdRef.current != null) void loadGame(gameIdRef.current)
  }, [loadGame])

  const openAddPlaceholder = () => {
    setEditingPlaceholder(null)
    setShowPlaceholderSheet(true)
  }

  const openEditPlaceholder = (player: GamePlayer) => {
    setEditingPlaceholder(player)
    setShowPlaceholderSheet(true)
  }

  const handleKick = async (userId: number, name: string | null) => {
    if (!game) return
    if (!window.confirm(`Xóa ${name || `#${userId}`} khỏi danh sách?`)) return
    try {
      await kickPlayer(game.id, userId)
      await loadGame(game.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xóa được người chơi")
    }
  }

  const handleDeletePlaceholder = async (userId: number, name: string | null) => {
    if (!game) return
    if (!window.confirm(`Xóa ${name || "người tạm"} khỏi danh sách?`)) return
    try {
      await deletePlaceholder(game.id, userId)
      await loadGame(game.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xóa được người tạm")
    }
  }

  const openRatingSheet = (player: GamePlayer) => {
    setRatingPlayer(player)
    const declared = player.declared_rank
    setRateTier(player.host_rated_tier || declared?.tier || "newbie")
    setRateStars(
      player.host_rated_stars ??
        (declared ? ratingToStars(declared.tier, declared.rating) : 3),
    )
    setRateNote(player.host_rating_note || "")
  }

  const handleRatePlayer = async () => {
    if (!game || !ratingPlayer) return
    setRateSaving(true)
    try {
      await ratePlayer(game.id, {
        user_id: ratingPlayer.id,
        tier: rateTier,
        stars: rateStars,
        note: rateNote || undefined,
      })
      setRatingPlayer(null)
      await loadGame(game.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được đánh giá")
    } finally {
      setRateSaving(false)
    }
  }

  const handleAdjustPlayed = useCallback(
    async (playerId: number, delta: 1 | -1) => {
      if (!game || !canManage || !gameActive) return
      setAdjustingUserId(playerId)
      setError(null)
      const prev = game.players
      setGame({
        ...game,
        players: game.players.map((p) => {
          if (p.id !== playerId) return p
          const played = Math.max(0, playedCount(p) + delta)
          return {
            ...p,
            session_matches: { played, wins: 0, losses: 0 },
          }
        }),
      })
      try {
        const { player } = await adjustSessionPlayed(game.id, playerId, delta)
        setGame((g) =>
          g
            ? {
                ...g,
                players: g.players.map((p) => (p.id === playerId ? player : p)),
              }
            : g,
        )
      } catch (err) {
        setGame((g) => (g ? { ...g, players: prev } : g))
        setError(err instanceof Error ? err.message : "Không cập nhật được số trận")
      } finally {
        setAdjustingUserId(null)
      }
    },
    [game, canManage, gameActive],
  )

  return {
    gameId,
    onClose,
    currentUserId,
    game,
    loading,
    actionLoading,
    adjustingUserId,
    error,
    warning,
    resolvedAddress,
    resolvingAddress,
    copiedLink,
    setCopiedLink,
    open,
    loadGame,
    isHost,
    canManage,
    isParticipant,
    gameActive,
    primaryAction,
    sortedPlayers,
    minPlayed,
    playerGenderLabel,
    handleAdjustPlayed,
    canManagePlaceholders,
    reloadGame,
    showPlaceholderSheet,
    setShowPlaceholderSheet,
    editingPlaceholder,
    openAddPlaceholder,
    openEditPlaceholder,
    handleKick,
    handleDeletePlaceholder,
    ratingPlayer,
    setRatingPlayer,
    rateTier,
    setRateTier,
    rateStars,
    setRateStars,
    rateNote,
    setRateNote,
    rateSaving,
    openRatingSheet,
    handleRatePlayer,
  }
}

export type GameDetailSimpleViewModel = ReturnType<typeof useGameDetailSimple>
