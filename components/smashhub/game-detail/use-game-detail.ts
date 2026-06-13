"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  CheckCircle2,
  LogOut,
  Users,
  XCircle,
} from "lucide-react"
import {
  fetchGame,
  fetchMatches,
  updateGameSettings,
  joinGame,
  leaveGame,
  deleteMatch,
  deletePendingMatches,
  createMatch,
  startMatch,
  toggleMatchPriority,
  finishMatch,
  undoFinishMatch,
  promoteCoHost,
  kickPlayer,
  deletePlaceholder,
  ratePlayer,
  togglePlayerArrived,
  transitionGame,
  type GameDetail,
  type GamePlayer,
  type MatchSummary,
  type FinishMatchResponse,
  type Tier,
  type Game,
} from "@/lib/api"
import { useAuth, useRequireAuth } from "@/lib/auth-context"
import {
  matchCountsFromList,
  applyLiveMatchCountDeltas,
  maxSessionPlayed,
  computePlayerDisplayCounts,
  adjustSessionStatsForFinishedMatch,
} from "@/lib/match-stats"
import {
  canAddPendingMatch,
  pendingQueueFullMessage,
  pendingQueueStatusLabel,
} from "@/lib/match-queue-capacity"
import { sortPendingQueue } from "@/lib/match-queue-order"
import {
  getMatchStartBlockers,
  isMatchStartable,
  activeGamePlayerIds,
  canStartAnotherMatch,
  countOngoingMatches,
  getMaxCourts,
  getOngoingBusyIds,
  filterStartablePending,
  getPendingStartBlockReason,
  suggestNextMatch,
  getQueueLineupFromSuggestion,
  suggestPipelineQueueLineup,
} from "@/lib/suggest-next-match"
import { suggestPairDoublesMatch } from "@/lib/player-pairs"
import { useGameCable } from "@/hooks/use-game-cable"
import type { GameCableEvent } from "@/lib/game-cable"
import { reverseGeocode } from "@/lib/geocode"
import { getGamePrimaryActionKind } from "@/lib/game-primary-action"
import {
  hasEnoughArrivedPlayers,
  minPlayersForMatchType,
  playersArrivedAtCourt,
} from "@/lib/match-players"
import { ratingToStars } from "@/lib/rating-stars"
import {
  countPlayersByGender,
  formatPlayerGenderLabel,
  sortPlayersByGenderThenName,
} from "@/lib/player-gender-counts"
import { fitMeta } from "./meta"
import { COURT_OPTIONS, MAX_CO_HOSTS, UNDO_MS } from "@/components/smashhub/game-detail/constants"
import { useGamePlayerPairTap } from "@/components/smashhub/game-detail/game-player-pairs"

function toDatetimeLocalValue(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function mergePriorityIntoMatches(data: GameDetail): GameDetail {
  const matches = [...(data.matches ?? [])]
  const pm = data.priority_match
  if (pm && pm.status === "pending" && !matches.some((m) => m.id === pm.id)) {
    matches.push(pm)
  }
  return { ...data, matches }
}

export function useGameDetail(gameId: number | null, onClose: () => void) {
  const { user } = useAuth()
  const requireAuth = useRequireAuth()
  const currentUserId = user?.id ?? -1
  const [game, setGame] = useState<GameDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null)
  const [resolvingAddress, setResolvingAddress] = useState(false)
  const [showCreateMatch, setShowCreateMatch] = useState(false)
  const [showCreateMatchAutoBalance, setShowCreateMatchAutoBalance] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [copiedFbPost, setCopiedFbPost] = useState(false)
  const [fbPostExpanded, setFbPostExpanded] = useState(false)
  const [finishingMatch, setFinishingMatch] = useState<MatchSummary | null>(null)
  const [editingMatch, setEditingMatch] = useState<MatchSummary | null>(null)
  const [ratingPlayer, setRatingPlayer] = useState<GamePlayer | null>(null)
  const [rateTier, setRateTier] = useState<Tier>("newbie")
  const [rateStars, setRateStars] = useState(3)
  const [rateNote, setRateNote] = useState("")
  const [rateSaving, setRateSaving] = useState(false)
  const [showEditSettings, setShowEditSettings] = useState(false)
  const [editCourts, setEditCourts] = useState<number[]>([])
  const [editMaxPlayers, setEditMaxPlayers] = useState(8)
  const [editStartTime, setEditStartTime] = useState("")
  const [editEndTime, setEditEndTime] = useState("")
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [showPlaceholderSheet, setShowPlaceholderSheet] = useState(false)
  const [editingPlaceholder, setEditingPlaceholder] = useState<GamePlayer | null>(null)
  const [showGenderSheet, setShowGenderSheet] = useState(false)
  const [editingGenderPlayer, setEditingGenderPlayer] = useState<GamePlayer | null>(null)
  const open = gameId !== null
  const gameIdRef = useRef(gameId)
  gameIdRef.current = gameId

  const [matchTab, setMatchTab] = useState<"live" | "queue" | "done">("live")
  const [matchesLoaded, setMatchesLoaded] = useState({ pending: false, finished: false })
  const [tabMatchesLoading, setTabMatchesLoading] = useState(false)
  const matchesLoadedRef = useRef(matchesLoaded)
  matchesLoadedRef.current = matchesLoaded

  const syncGameMatches = useCallback((prev: GameDetail, matches: MatchSummary[]): GameDetail => {
    const prevMatches = prev.matches ?? []
    return {
      ...prev,
      matches,
      match_counts: applyLiveMatchCountDeltas(
        prev.match_counts,
        prevMatches,
        matches,
        matchesLoadedRef.current.finished,
      ),
    }
  }, [])

  const mergeMatchesByStatus = useCallback(
    (incoming: MatchSummary[], status: MatchSummary["status"]) => {
      setGame((prev) => {
        if (!prev) return prev
        const rest = (prev.matches ?? []).filter((m) => m.status !== status)
        const sorted = [...incoming].sort((a, b) =>
          status === "finished" ? b.match_number - a.match_number : a.match_number - b.match_number,
        )
        return syncGameMatches(prev, [...rest, ...sorted])
      })
    },
    [syncGameMatches],
  )

  const applyGameDetail = useCallback((data: GameDetail) => {
    const merged = mergePriorityIntoMatches(data)
    setGame(merged)
    const hasPending = (merged.matches ?? []).some((m) => m.status === "pending")
    const pendingCount = merged.match_counts?.pending ?? 0
    setMatchesLoaded((s) => ({
      ...s,
      pending: hasPending || pendingCount > 0,
    }))
  }, [])

  const lastLiveSyncRef = useRef(0)
  const liveSyncInFlightRef = useRef(false)

  /** Lightweight sync of ongoing + pending (no loading UI). */
  const reloadLiveSnapshot = useCallback(async () => {
    const id = gameIdRef.current
    if (id == null || liveSyncInFlightRef.current) return
    liveSyncInFlightRef.current = true
    try {
      const [{ matches: ongoing }, { matches: pending }] = await Promise.all([
        fetchMatches(id, "ongoing"),
        fetchMatches(id, "pending"),
      ])
      const live = [...ongoing, ...pending].sort((a, b) => {
        const order = (s: MatchSummary["status"]) => (s === "ongoing" ? 0 : 1)
        const d = order(a.status) - order(b.status)
        if (d !== 0) return d
        if (a.status === "pending" && b.status === "pending" && a.priority !== b.priority) {
          return a.priority ? -1 : 1
        }
        return a.match_number - b.match_number
      })
      const priority = pending.find((m) => m.priority) ?? null
      lastLiveSyncRef.current = Date.now()
      setGame((prev) => {
        if (!prev) return prev
        const finished = matchesLoadedRef.current.finished
          ? (prev.matches ?? []).filter((m) => m.status === "finished")
          : []
        return {
          ...syncGameMatches(prev, [...finished, ...live]),
          priority_match: priority,
        }
      })
    } catch {
      /* background sync — ignore */
    } finally {
      liveSyncInFlightRef.current = false
    }
  }, [syncGameMatches])

  const liveSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scheduleLiveSnapshot = useCallback(
    (delayMs = 0) => {
      if (gameIdRef.current == null) return
      if (liveSyncTimerRef.current) clearTimeout(liveSyncTimerRef.current)
      liveSyncTimerRef.current = setTimeout(() => {
        liveSyncTimerRef.current = null
        void reloadLiveSnapshot()
      }, delayMs)
    },
    [reloadLiveSnapshot],
  )

  const loadGame = useCallback(
    async (id: number) => {
      const reloadFinished = matchesLoadedRef.current.finished
      setLoading(true)
      setError(null)
      setWarning(null)
      try {
        const data = await fetchGame(id)
        applyGameDetail(data)
        if (reloadFinished) {
          const { matches } = await fetchMatches(id, "finished")
          mergeMatchesByStatus(matches, "finished")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được trận đấu")
      } finally {
        setLoading(false)
      }
    },
    [applyGameDetail, mergeMatchesByStatus],
  )

  const loadFinishedMatches = useCallback(async () => {
    if (!game?.id || matchesLoadedRef.current.finished) return

    setTabMatchesLoading(true)
    try {
      const { matches } = await fetchMatches(game.id, "finished")
      mergeMatchesByStatus(matches, "finished")
      setMatchesLoaded((s) => ({ ...s, finished: true }))
    } catch {
      toast.error("Không tải được trận đã xong")
    } finally {
      setTabMatchesLoading(false)
    }
  }, [game?.id, mergeMatchesByStatus])

  const loadPendingMatches = useCallback(async () => {
    if (!game?.id || matchesLoadedRef.current.pending) return

    setTabMatchesLoading(true)
    try {
      const { matches } = await fetchMatches(game.id, "pending")
      mergeMatchesByStatus(matches, "pending")
      setMatchesLoaded((s) => ({ ...s, pending: true }))
    } catch {
      toast.error("Không tải được hàng chờ")
    } finally {
      setTabMatchesLoading(false)
    }
  }, [game?.id, mergeMatchesByStatus])

  useEffect(() => {
    if (gameId === null) {
      setGame(null)
      setError(null)
      setWarning(null)
      setResolvedAddress(null)
      setActionLoading(false)
      setShowCreateMatch(false)
      setShowCreateMatchAutoBalance(false)
      setFinishingMatch(null)
      setMatchesLoaded({ pending: false, finished: false })
      return
    }
    setMatchesLoaded({ pending: false, finished: false })
    setMatchTab("live")
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      setWarning(null)
      try {
        const data = await fetchGame(gameId)
        if (cancelled) return
        applyGameDetail(data)
        const finishedCount = data.match_counts?.finished ?? 0
        if (finishedCount > 0) {
          const { matches } = await fetchMatches(gameId, "finished")
          if (cancelled) return
          mergeMatchesByStatus(matches, "finished")
          setMatchesLoaded((s) => ({ ...s, finished: true }))
        }
        const pendingCount = data.match_counts?.pending ?? 0
        if (pendingCount > 0 && !(data.matches ?? []).some((m) => m.status === "pending")) {
          const { matches } = await fetchMatches(gameId, "pending")
          if (cancelled) return
          mergeMatchesByStatus(matches, "pending")
          setMatchesLoaded((s) => ({ ...s, pending: true }))
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Không tải được trận đấu")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [gameId, applyGameDetail, mergeMatchesByStatus])

  useEffect(() => {
    if (matchTab === "done") void loadFinishedMatches()
  }, [matchTab, game?.id, loadFinishedMatches])

  useEffect(() => {
    if (matchTab === "queue") void loadPendingMatches()
  }, [matchTab, game?.id, loadPendingMatches])

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

  const MAX_CO_HOSTS = 4
  const isHost = game?.host?.id === currentUserId
  const coHostCount = useMemo(
    () => game?.players.filter((p) => p.role === "co_host").length ?? 0,
    [game?.players],
  )
  const isCoHost = useMemo(
    () => !!game?.players.some((p) => p.id === currentUserId && p.role === "co_host"),
    [game, currentUserId],
  )
  const canManage = isHost || isCoHost
  const canEditSettings =
    canManage &&
    game != null &&
    game.status !== "ongoing" &&
    game.status !== "finished" &&
    game.status !== "cancelled"
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

    const action = getGamePrimaryActionKind({ game, isHost, isParticipant, isPast })
    switch (action) {
      case "cancel":
        return {
          label: "Huỷ trận",
          icon: XCircle,
          variant: "destructive" as const,
          onClick: handleLeave,
        }
      case "leave":
        return {
          label: "Rời trận",
          icon: LogOut,
          variant: "outline" as const,
          onClick: handleLeave,
          destructive: true,
        }
      case "full":
        return {
          label: "Đã đầy",
          icon: Users,
          variant: "secondary" as const,
          disabled: true,
          onClick: () => {},
        }
      case "join":
        return {
          label: "Tham gia",
          icon: CheckCircle2,
          variant: "default" as const,
          onClick: handleJoin,
        }
      default:
        return null
    }
  }, [game, isHost, isParticipant, isPast, handleJoin, handleLeave])

  const openEditSettings = () => {
    if (!game) return
    setEditCourts(game.courts?.length ? [...game.courts] : [1])
    setEditMaxPlayers(game.max_players)
    setEditStartTime(toDatetimeLocalValue(game.start_time))
    setEditEndTime(toDatetimeLocalValue(game.end_time))
    setSettingsError(null)
    setShowEditSettings(true)
  }

  const toggleEditCourt = (court: number) => {
    setEditCourts((prev) =>
      prev.includes(court)
        ? prev.filter((c) => c !== court)
        : [...prev, court].sort((a, b) => a - b),
    )
  }

  const handleSaveSettings = async () => {
    if (!game) return
    const start = new Date(editStartTime)
    const end = new Date(editEndTime)
    if (!editStartTime || !editEndTime || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setSettingsError("Vui lòng chọn giờ bắt đầu và kết thúc")
      return
    }
    if (start >= end) {
      setSettingsError("Giờ bắt đầu phải trước giờ kết thúc")
      return
    }

    setSettingsSaving(true)
    setSettingsError(null)
    try {
      const updated = await updateGameSettings(game.id, {
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        courts: editCourts,
        max_players: editMaxPlayers,
      })
      setGame(updated)
      setShowEditSettings(false)
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Không thể lưu thay đổi")
    } finally {
      setSettingsSaving(false)
    }
  }

  const handleMatchCreated = () => {
    setShowCreateMatch(false)
    setShowCreateMatchAutoBalance(false)
    setEditingMatch(null)
    if (game) loadGame(game.id)
  }

  const openEditMatch = (match: MatchSummary) => {
    setShowCreateMatch(false)
    setShowCreateMatchAutoBalance(false)
    setEditingMatch(match)
  }

  const handleMatchFinished = (_res: FinishMatchResponse) => {
    setFinishingMatch(null)
    if (game) loadGame(game.id)
  }

  const [startingMatchId, setStartingMatchId] = useState<number | null>(null)
  const [transitionLoading, setTransitionLoading] = useState(false)
  const [suggestActionLoading, setSuggestActionLoading] = useState(false)
  const [pairArrangeLoading, setPairArrangeLoading] = useState(false)
  const [finishingMatchId, setFinishingMatchId] = useState<number | null>(null)
  const [togglingPriorityId, setTogglingPriorityId] = useState<number | null>(null)
  const [pendingUndo, setPendingUndo] = useState<{ matchId: number; label: string } | null>(null)
  const pendingUndoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const gameRef = useRef(game)
  gameRef.current = game
  const finishGenerationRef = useRef<Record<number, number>>({})
  const matchBeforeFinishRef = useRef<Record<number, MatchSummary>>({})
  const ignoreFinishedCableRef = useRef<Set<number>>(new Set())

  const bumpFinishGeneration = useCallback((matchId: number) => {
    const next = (finishGenerationRef.current[matchId] ?? 0) + 1
    finishGenerationRef.current[matchId] = next
    return next
  }, [])

  const clearPendingUndo = useCallback(() => {
    if (pendingUndoTimerRef.current) {
      clearTimeout(pendingUndoTimerRef.current)
      pendingUndoTimerRef.current = null
    }
    setPendingUndo(null)
  }, [])

  const showPendingUndo = useCallback(
    (matchId: number, label: string) => {
      clearPendingUndo()
      setPendingUndo({ matchId, label })
      pendingUndoTimerRef.current = setTimeout(() => {
        setPendingUndo(null)
        pendingUndoTimerRef.current = null
      }, UNDO_MS)
    },
    [clearPendingUndo],
  )

  useEffect(() => () => clearPendingUndo(), [clearPendingUndo])

  const patchMatchInGame = useCallback((updated: MatchSummary) => {
    setGame((prev) => {
      if (!prev) return prev
      const prevMatches = prev.matches ?? []
      const previousMatch = prevMatches.find((m) => m.id === updated.id)
      const hasMatch = prevMatches.some((m) => m.id === updated.id)
      const merged = hasMatch
        ? prevMatches.map((m) => {
            if (m.id === updated.id) return { ...m, ...updated }
            if (updated.priority && updated.status === "pending") return { ...m, priority: false }
            return m
          })
        : [...prevMatches, updated]
      const nextMatches =
        updated.priority && updated.status === "pending"
          ? merged.map((m) => (m.id === updated.id ? m : { ...m, priority: false }))
          : merged
      const next = syncGameMatches(prev, nextMatches)
      let nextPlayers = next.players
      if (previousMatch?.status === "finished" && updated.status !== "finished") {
        nextPlayers = adjustSessionStatsForFinishedMatch(nextPlayers, previousMatch, -1)
      } else if (previousMatch && previousMatch.status !== "finished" && updated.status === "finished") {
        nextPlayers = adjustSessionStatsForFinishedMatch(nextPlayers, updated, 1)
      } else if (
        previousMatch?.status === "finished" &&
        updated.status === "finished" &&
        previousMatch.winner_team !== updated.winner_team
      ) {
        nextPlayers = adjustSessionStatsForFinishedMatch(nextPlayers, previousMatch, -1)
        nextPlayers = adjustSessionStatsForFinishedMatch(nextPlayers, updated, 1)
      }
      return {
        ...next,
        players: nextPlayers,
        priority_match:
          updated.priority && updated.status === "pending"
            ? updated
            : prev.priority_match?.id === updated.id
              ? null
              : prev.priority_match,
      }
    })
  }, [syncGameMatches])

  const handleCableEvent = useCallback(
    (payload: GameCableEvent) => {
      if (payload.event === "game.refresh") {
        const id = gameIdRef.current
        if (id != null) void loadGame(id)
        return
      }
      if (payload.event === "match.deleted") {
        setGame((prev) => {
          if (!prev?.matches) return prev
          const nextMatches = prev.matches.filter((m) => m.id !== payload.match_id)
          return {
            ...syncGameMatches(prev, nextMatches),
            priority_match:
              prev.priority_match?.id === payload.match_id ? null : prev.priority_match,
          }
        })
        return
      }
      if ("match" in payload && payload.match) {
        if (
          (payload.event === "match.finished" || payload.event === "match.updated") &&
          ignoreFinishedCableRef.current.has(payload.match.id)
        ) {
          return
        }
        patchMatchInGame(payload.match)
      }
    },
    [loadGame, patchMatchInGame, syncGameMatches],
  )

  const cableEnabled =
    open &&
    gameId != null &&
    game != null &&
    game.status !== "finished" &&
    game.status !== "cancelled"

  const cableConnected = useGameCable(gameId, handleCableEvent, cableEnabled, {
    onConnected: () => scheduleLiveSnapshot(0),
    onRejected: () => scheduleLiveSnapshot(0),
    onDisconnected: () => scheduleLiveSnapshot(0),
  })

  useEffect(() => {
    if (!cableEnabled) return
    const pollMs = cableConnected ? 60_000 : 5_000
    const interval = window.setInterval(() => {
      void reloadLiveSnapshot()
    }, pollMs)
    return () => window.clearInterval(interval)
  }, [cableEnabled, cableConnected, reloadLiveSnapshot])

  useEffect(() => {
    if (!cableEnabled) return
    const onVisible = () => {
      if (document.visibilityState !== "visible") return
      if (Date.now() - lastLiveSyncRef.current < 2_500) return
      scheduleLiveSnapshot(0)
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [cableEnabled, scheduleLiveSnapshot])

  useEffect(
    () => () => {
      if (liveSyncTimerRef.current) clearTimeout(liveSyncTimerRef.current)
    },
    [],
  )

  const handleUndoFinish = useCallback(
    async (matchId: number) => {
      const g = gameRef.current
      if (!g) return
      clearPendingUndo()

      bumpFinishGeneration(matchId)
      ignoreFinishedCableRef.current.add(matchId)

      const revertOptimistic = () => {
        const snap = matchBeforeFinishRef.current[matchId] ?? g.matches?.find((m) => m.id === matchId)
        if (!snap) return false
        patchMatchInGame({
          ...snap,
          status: "ongoing",
          winner_team: null,
          team_a_score: null,
          team_b_score: null,
          finished_at: null,
        })
        delete matchBeforeFinishRef.current[matchId]
        return true
      }

      try {
        const res = await undoFinishMatch(g.id, matchId)
        patchMatchInGame(res.match as MatchSummary)
        delete matchBeforeFinishRef.current[matchId]
        toast.message("Đã hoàn tác")
      } catch (err) {
        const msg = err instanceof Error ? err.message : ""
        if (/undo window expired/i.test(msg)) {
          toast.error(msg)
          return
        }
        if (revertOptimistic()) {
          toast.message("Đã hoàn tác")
          return
        }
        toast.error(msg || "Không thể hoàn tác")
        await loadGame(g.id)
      } finally {
        ignoreFinishedCableRef.current.delete(matchId)
      }
    },
    [bumpFinishGeneration, clearPendingUndo, patchMatchInGame, loadGame],
  )

  const handleTapWinner = useCallback(
    async (match: MatchSummary, team: "team_a" | "team_b") => {
      const g = gameRef.current
      if (!g || finishingMatchId != null) return

      const previous = { ...match }
      matchBeforeFinishRef.current[match.id] = previous
      const finishGen = bumpFinishGeneration(match.id)

      const optimistic: MatchSummary = {
        ...match,
        status: "finished",
        winner_team: team,
        finished_at: new Date().toISOString(),
      }
      patchMatchInGame(optimistic)
      setFinishingMatchId(match.id)

      const teamLabel = team === "team_a" ? "Team A" : "Team B"

      try {
        const res = await finishMatch(g.id, match.id, { winner_team: team })
        if (finishGenerationRef.current[match.id] !== finishGen) return

        patchMatchInGame(res.match)
        showPendingUndo(match.id, teamLabel)
      } catch (err) {
        if (finishGenerationRef.current[match.id] === finishGen) {
          patchMatchInGame(previous)
          delete matchBeforeFinishRef.current[match.id]
        }
        toast.error(err instanceof Error ? err.message : "Không thể kết thúc trận")
      } finally {
        setFinishingMatchId(null)
      }
    },
    [bumpFinishGeneration, finishingMatchId, patchMatchInGame, showPendingUndo],
  )

  const handleTransition = async (targetStatus: Game["status"]) => {
    if (!game) return
    setTransitionLoading(true)
    try {
      const updated = await transitionGame(game.id, targetStatus)
      applyGameDetail(updated)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Không thể chuyển trạng thái")
    } finally {
      setTransitionLoading(false)
    }
  }

  const handleStartMatch = async (matchId: number) => {
    if (!game) return
    const match = game.matches?.find((m) => m.id === matchId)
    const allMatches = game.matches ?? []
    const ongoing = allMatches.filter((m) => m.status === "ongoing")
    const playersNeeded = game.match_type === "singles" ? 2 : 4
    const busyIds = new Set(
      ongoing.flatMap((m) => [...m.team_a, ...m.team_b].map((p) => p.id)),
    )
    if (match) {
      const blockReason = getPendingStartBlockReason(
        match,
        game,
        allMatches,
        busyIds,
        activePlayerIds,
        playersNeeded,
      )
      if (blockReason) {
        toast.error(blockReason)
        return
      }
    }
    setStartingMatchId(matchId)
    try {
      const updated = await startMatch(game.id, matchId)
      patchMatchInGame(updated as MatchSummary)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể bắt đầu trận")
    } finally {
      setStartingMatchId(null)
    }
  }

  const [deletingMatchId, setDeletingMatchId] = useState<number | null>(null)
  const [deletingAllPending, setDeletingAllPending] = useState(false)
  const handleDeleteMatch = async (matchId: number) => {
    if (!game) return
    setDeletingMatchId(matchId)
    try {
      await deleteMatch(game.id, matchId)
      setGame((prev) => {
        if (!prev?.matches) return prev
        const next = prev.matches.filter((m) => m.id !== matchId)
        const clearedPriority =
          prev.priority_match?.id === matchId ? null : prev.priority_match
        return {
          ...syncGameMatches(prev, next),
          priority_match: clearedPriority,
        }
      })
    } catch {
      // silently ignore
    } finally {
      setDeletingMatchId(null)
    }
  }

  const handlePromote = async (userId: number) => {
    if (!game) return
    try {
      await promoteCoHost(game.id, userId)
      loadGame(game.id)
    } catch {
      // silently ignore
    }
  }

  const handleKick = async (userId: number, name: string | null) => {
    if (!game) return
    if (!window.confirm(`Kick ${name || `#${userId}`} khỏi game?`)) return
    try {
      await kickPlayer(game.id, userId)
      loadGame(game.id)
    } catch {
      // silently ignore
    }
  }

  const openAddPlaceholder = () => {
    setEditingPlaceholder(null)
    setShowPlaceholderSheet(true)
  }

  const openEditPlaceholder = (player: GamePlayer) => {
    setEditingPlaceholder(player)
    setShowPlaceholderSheet(true)
  }

  const openEditPlayerGender = (player: GamePlayer) => {
    setEditingGenderPlayer(player)
    setShowGenderSheet(true)
  }

  const handleToggleArrived = async (player: GamePlayer) => {
    if (!game || !canManage) return
    const next = !player.arrived_at_court
    setGame((g) => {
      if (!g) return g
      return {
        ...g,
        players: g.players.map((p) =>
          p.id === player.id ? { ...p, arrived_at_court: next } : p,
        ),
      }
    })
    try {
      const { player: updated } = await togglePlayerArrived(game.id, player.id, next)
      setGame((g) =>
        g ? { ...g, players: g.players.map((p) => (p.id === player.id ? updated : p)) } : g,
      )
    } catch (err) {
      setGame((g) => {
        if (!g) return g
        return {
          ...g,
          players: g.players.map((p) =>
            p.id === player.id ? { ...p, arrived_at_court: !next } : p,
          ),
        }
      })
      toast.error(err instanceof Error ? err.message : "Không cập nhật được trạng thái")
    }
  }

  const handleDeletePlaceholder = async (userId: number, name: string | null) => {
    if (!game) return
    if (!window.confirm(`Xóa ${name || "người tạm"} khỏi danh sách?`)) return
    try {
      await deletePlaceholder(game.id, userId)
      loadGame(game.id)
    } catch {
      // silently ignore
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
      loadGame(game.id)
    } catch {
      // silently ignore
    } finally {
      setRateSaving(false)
    }
  }

  const minPlayersForMatch = minPlayersForMatchType(game?.match_type ?? "doubles")
  const joinedPlayerCount = Math.max(game?.players_count ?? 0, game?.players?.length ?? 0)
  const hasEnoughPlayers = joinedPlayerCount >= minPlayersForMatch
  const matchmakingPlayers = useMemo(
    () => playersArrivedAtCourt(game?.players),
    [game?.players],
  )
  const arrivedCount = matchmakingPlayers.length
  const playerGenderLabel = useMemo(
    () => formatPlayerGenderLabel(countPlayersByGender(game?.players ?? [])),
    [game?.players],
  )
  const hasEnoughArrived = hasEnoughArrivedPlayers(game?.players, game?.match_type ?? "doubles")
  const gameAllowsMatches =
    game?.status === "open" || game?.status === "full" || game?.status === "ongoing"
  const canPlanMatches = canManage && gameAllowsMatches && hasEnoughArrived
  const canAddToPendingQueue = useMemo(
    () => (game ? canAddPendingMatch(game, game.matches) : false),
    [game],
  )
  const pendingQueueLabel = useMemo(
    () => (game ? pendingQueueStatusLabel(game, game.matches) : ""),
    [game],
  )
  const canCreateMatch = canPlanMatches && canAddToPendingQueue
  const totalMatchCount = useMemo(() => {
    const c = matchCountsFromList(game?.matches, {
      fallbackFinished: game?.match_counts?.finished,
      finishedLoaded: matchesLoaded.finished,
    })
    return c.pending + c.ongoing + c.finished
  }, [game?.matches, game?.match_counts?.finished, matchesLoaded.finished])

  const showMatchesSection = gameAllowsMatches || totalMatchCount > 0

  const isGameTime = useMemo(() => {
    if (!game) return false
    return game.status === "ongoing"
  }, [game])

  const playerMatchCounts = useMemo(
    () => computePlayerDisplayCounts(game?.players ?? [], game?.matches),
    [game?.players, game?.matches],
  )
  const maxPlayed = useMemo(() => maxSessionPlayed(playerMatchCounts), [playerMatchCounts])

  const sortedPlayers = useMemo(
    () => sortPlayersByGenderThenName(game?.players ?? []),
    [game?.players],
  )

  const { ongoingMatches, pendingMatches, finishedMatches } = useMemo(() => {
    const all = game?.matches ?? []
    return {
      ongoingMatches: all.filter((m) => m.status === "ongoing"),
      pendingMatches: sortPendingQueue(all.filter((m) => m.status === "pending")),
      finishedMatches: all
        .filter((m) => m.status === "finished")
        .sort((a, b) => b.match_number - a.match_number),
    }
  }, [game?.matches])

  const handleDeleteAllPending = async () => {
    if (!game) return
    const count = pendingMatches.length
    if (count === 0) return
    if (
      !window.confirm(
        `Xóa tất cả ${count} trận trong hàng chờ? Không thể hoàn tác.`,
      )
    ) {
      return
    }
    setDeletingAllPending(true)
    try {
      await deletePendingMatches(game.id)
      setGame((prev) => {
        if (!prev) return prev
        const next = (prev.matches ?? []).filter((m) => m.status !== "pending")
        return {
          ...syncGameMatches(prev, next),
          priority_match:
            prev.priority_match?.status === "pending" ? null : prev.priority_match,
        }
      })
      toast.success(`Đã xóa ${count} trận trong hàng chờ`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không xóa được hàng chờ")
    } finally {
      setDeletingAllPending(false)
    }
  }

  const tabMatchCounts = useMemo(
    () =>
      matchCountsFromList(game?.matches, {
        fallbackFinished: game?.match_counts?.finished,
        finishedLoaded: matchesLoaded.finished,
      }),
    [game?.matches, game?.match_counts?.finished, matchesLoaded.finished],
  )

  const busyPlayerIds = useMemo(
    () =>
      new Set(
        ongoingMatches.flatMap((m) => [...m.team_a, ...m.team_b].map((p) => p.id)),
      ),
    [ongoingMatches],
  )

  const tabMatches =
    matchTab === "live"
      ? ongoingMatches
      : matchTab === "queue"
        ? pendingMatches
        : finishedMatches

  const matchListLimit =
    matchTab === "live" ? Math.max(1, game?.courts?.length ?? 4) : null

  const visibleTabMatches =
    matchListLimit != null ? tabMatches.slice(0, matchListLimit) : tabMatches

  const matchListScrollable = matchTab === "done" || matchTab === "queue"
  const showTabListLoading =
    tabMatchesLoading ||
    (matchTab === "queue" &&
      !matchesLoaded.pending &&
      pendingMatches.length === 0 &&
      (game?.match_counts?.pending ?? 0) > 0)

  const playersNeeded = game?.match_type === "singles" ? 2 : 4

  const activePlayerIds = useMemo(
    () => (game ? activeGamePlayerIds(game) : new Set<number>()),
    [game],
  )

  const priorityMatch = useMemo(() => {
    if (!game) return null
    if (game.priority_match?.status === "pending") return game.priority_match
    return game.matches?.find((m) => m.status === "pending" && m.priority) ?? null
  }, [game])

  const priorityCanStart = useMemo(() => {
    if (!priorityMatch || !isGameTime || !game) return false
    return (
      canStartAnotherMatch(game.matches ?? [], getMaxCourts(game)) &&
      isMatchStartable(priorityMatch, busyPlayerIds, activePlayerIds, playersNeeded)
    )
  }, [priorityMatch, busyPlayerIds, activePlayerIds, playersNeeded, isGameTime, game])

  const priorityReason = useMemo(() => {
    if (!priorityMatch || !game) return ""
    if (!isGameTime) return "Host đánh dấu — bắt đầu được khi tới giờ trận"
    if (priorityCanStart) return "Host đánh dấu — sẵn sàng lên sân"
    const ongoing = (game.matches ?? []).filter((m) => m.status === "ongoing")
    const blockers = getMatchStartBlockers(priorityMatch, ongoing)
    if (blockers.length === 0) return "Host đánh dấu — chờ đủ người rảnh"
    const who = [...new Set(blockers.map((b) => b.playerName))].join(", ")
    const on = [...new Set(blockers.map((b) => `#${b.ongoingMatchNumber}`))].join(", ")
    return `${who} đang đấu ${on}`
  }, [priorityMatch, priorityCanStart, game, isGameTime])

  const nextSuggestion = useMemo(() => {
    if (!game || !canPlanMatches) return null
    return suggestNextMatch(game, matchmakingPlayers, game.matches ?? [])
  }, [game, canPlanMatches, matchmakingPlayers])

  const nextPipelineLineup = useMemo(() => {
    if (!game || !canPlanMatches || !canAddToPendingQueue) return null
    return suggestPipelineQueueLineup(game, matchmakingPlayers, game.matches ?? [])
  }, [game, canPlanMatches, matchmakingPlayers, canAddToPendingQueue])

  const hideSuggestForPriority =
    priorityMatch &&
    nextSuggestion?.kind === "start" &&
    nextSuggestion.match.id === priorityMatch.id

  const showNextSuggestion = nextSuggestion && !hideSuggestForPriority

  const pairMatchPlan = useMemo(() => {
    if (!game || game.match_type !== "doubles" || !canPlanMatches) return null
    return suggestPairDoublesMatch(game, matchmakingPlayers, game.matches ?? [])
  }, [game, canPlanMatches, matchmakingPlayers])

  const showPairArrange =
    !!game && game.match_type === "doubles" && canPlanMatches && canManage

  const pairArrangeDisabled =
    !pairMatchPlan || ("error" in pairMatchPlan && !!pairMatchPlan.error)

  const suggestedMatchId =
    nextSuggestion?.kind === "start" ? nextSuggestion.match.id : priorityMatch?.id ?? null

  const handleTogglePriority = async (match: MatchSummary) => {
    if (!game) return
    setTogglingPriorityId(match.id)
    try {
      const updated = await toggleMatchPriority(game.id, match.id)
      patchMatchInGame({ ...updated, priority: !!updated.priority })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể đổi ưu tiên")
    } finally {
      setTogglingPriorityId(null)
    }
  }

  const handleStartSuggested = async () => {
    if (nextSuggestion?.kind !== "start") return
    await handleStartMatch(nextSuggestion.match.id)
    setMatchTab("live")
  }

  const handleCreateAndStartSuggested = async () => {
    if (!game || !nextSuggestion || nextSuggestion.kind !== "create") return
    const lineup = { teamA: nextSuggestion.teamA, teamB: nextSuggestion.teamB }
    setSuggestActionLoading(true)
    try {
      const matches = game.matches ?? []
      const maxCourts = getMaxCourts(game)
      const ongoingCount = countOngoingMatches(matches)
      if (!canStartAnotherMatch(matches, maxCourts)) {
        toast.error(`Sân đầy (${ongoingCount}/${maxCourts}) — kết thúc trận trên sân trước`)
        return
      }
      const busyIds = getOngoingBusyIds(matches)
      const pending = matches.filter((m) => m.status === "pending")
      const startable = filterStartablePending(pending, busyIds, activePlayerIds, playersNeeded)
      if (startable.length > 0) {
        toast.error("Còn trận chờ sẵn sàng — bắt đầu hàng chờ trước")
        return
      }
      const created = await createMatch(game.id, {
        team_a: lineup.teamA,
        team_b: lineup.teamB,
      })
      if (!canStartAnotherMatch(matches, maxCourts)) {
        await loadGame(game.id)
        setMatchTab("queue")
        toast.info(`Sân đầy (${ongoingCount}/${maxCourts}) — đã thêm hàng chờ`)
        return
      }
      await startMatch(game.id, created.id)
      await loadGame(game.id)
      setMatchTab("live")
      toast.success("Đã tạo và bắt đầu trận")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể tạo trận")
    } finally {
      setSuggestActionLoading(false)
    }
  }

  const handleQueueSuggested = async () => {
    if (!game) return
    if (!canAddPendingMatch(game, game.matches)) {
      toast.error(pendingQueueFullMessage(game))
      return
    }
    const lineup =
      getQueueLineupFromSuggestion(nextSuggestion) ??
      (nextPipelineLineup
        ? { teamA: nextPipelineLineup.teamA, teamB: nextPipelineLineup.teamB }
        : null)
    if (!lineup) return
    setSuggestActionLoading(true)
    try {
      await createMatch(game.id, {
        team_a: lineup.teamA,
        team_b: lineup.teamB,
      })
      await loadGame(game.id)
      setMatchTab("queue")
      toast.success("Đã thêm vào hàng chờ")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể thêm hàng chờ")
    } finally {
      setSuggestActionLoading(false)
    }
  }

  const handleArrangePairMatch = async () => {
    if (!game) return
    const plan = pairMatchPlan ?? suggestPairDoublesMatch(game, matchmakingPlayers, game.matches ?? [])
    if ("error" in plan) {
      toast.error(plan.error)
      return
    }
    const maxCourts = getMaxCourts(game)
    const willQueue =
      !isGameTime || !canStartAnotherMatch(game.matches ?? [], maxCourts)
    if (willQueue && !canAddPendingMatch(game, game.matches)) {
      toast.error(pendingQueueFullMessage(game))
      return
    }
    setPairArrangeLoading(true)
    try {
      const maxCourts = getMaxCourts(game)
      const ongoingCount = countOngoingMatches(game.matches ?? [])
      const created = await createMatch(game.id, {
        team_a: plan.teamA,
        team_b: plan.teamB,
        arranged_as_pairs: true,
      })
      if (isGameTime && canStartAnotherMatch(game.matches ?? [], maxCourts)) {
        await startMatch(game.id, created.id)
        await loadGame(game.id)
        setMatchTab("live")
        toast.success("Đã sắp xếp cặp đấu và bắt đầu trận")
      } else {
        await loadGame(game.id)
        setMatchTab("queue")
        toast.success(
          isGameTime
            ? `Sân đầy (${ongoingCount}/${maxCourts}) — đã thêm trận cặp vào hàng chờ`
            : "Đã thêm trận cặp vào hàng chờ",
        )
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể sắp xếp trận cặp")
    } finally {
      setPairArrangeLoading(false)
    }
  }

  const fitInfo = fitMeta(game?.fit_level)

  const reloadGame = useCallback(() => {
    if (gameId) void loadGame(gameId)
  }, [gameId, loadGame])

  const { pairPick, loading: pairTapLoading, onPlayerPairTap } = useGamePlayerPairTap(
    game,
    canManage,
    reloadGame,
  )

  return {
    gameId,
    onClose,
    user,
    currentUserId,
    game,
    loading,
    actionLoading,
    error,
    warning,
    resolvedAddress,
    resolvingAddress,
    showCreateMatch,
    setShowCreateMatch,
    showCreateMatchAutoBalance,
    setShowCreateMatchAutoBalance,
    copiedLink,
    setCopiedLink,
    copiedAddress,
    setCopiedAddress,
    copiedFbPost,
    setCopiedFbPost,
    fbPostExpanded,
    setFbPostExpanded,
    finishingMatch,
    setFinishingMatch,
    editingMatch,
    setEditingMatch,
    ratingPlayer,
    setRatingPlayer,
    rateTier,
    setRateTier,
    rateStars,
    setRateStars,
    rateNote,
    setRateNote,
    rateSaving,
    showEditSettings,
    setShowEditSettings,
    editCourts,
    editMaxPlayers,
    editStartTime,
    editEndTime,
    setEditStartTime,
    setEditEndTime,
    setEditMaxPlayers,
    settingsSaving,
    settingsError,
    showPlaceholderSheet,
    setShowPlaceholderSheet,
    editingPlaceholder,
    showGenderSheet,
    setShowGenderSheet,
    editingGenderPlayer,
    open,
    COURT_OPTIONS,
    matchTab,
    setMatchTab,
    matchesLoaded,
    tabMatchesLoading,
    loadGame,
    isHost,
    coHostCount,
    isCoHost,
    canManage,
    canEditSettings,
    canManagePlaceholders,
    isParticipant,
    isPast,
    primaryAction,
    openEditSettings,
    toggleEditCourt,
    handleSaveSettings,
    handleMatchCreated,
    openEditMatch,
    handleMatchFinished,
    startingMatchId,
    suggestActionLoading,
    finishingMatchId,
    deletingMatchId,
    deletingAllPending,
    handleCableEvent,
    pendingUndo,
    handleUndoFinish,
    handleTapWinner,
    handleStartMatch,
    handleDeleteMatch,
    handlePromote,
    handleKick,
    openAddPlaceholder,
    openEditPlaceholder,
    openEditPlayerGender,
    handleDeletePlaceholder,
    openRatingSheet,
    handleRatePlayer,
    handleToggleArrived,
    matchmakingPlayers,
    arrivedCount,
    playerGenderLabel,
    hasEnoughArrived,
    canCreateMatch,
    canPlanMatches,
    totalMatchCount,
    showMatchesSection,
    isGameTime,
    playerMatchCounts,
    maxPlayed,
    sortedPlayers,
    ongoingMatches,
    pendingMatches,
    finishedMatches,
    handleDeleteAllPending,
    tabMatchCounts,
    busyPlayerIds,
    tabMatches,
    visibleTabMatches,
    matchListScrollable,
    showTabListLoading,
    priorityMatch,
    priorityCanStart,
    priorityReason,
    nextSuggestion,
    nextPipelineLineup,
    canAddToPendingQueue,
    pendingQueueLabel,
    showNextSuggestion,
    suggestedMatchId,
    handleTogglePriority,
    handleStartSuggested,
    handleCreateAndStartSuggested,
    handleQueueSuggested,
    handleArrangePairMatch,
    showPairArrange,
    pairArrangeDisabled,
    pairArrangeLoading,
    togglingPriorityId,
    fitInfo,
    pairPick,
    pairTapLoading,
    onPlayerPairTap,
    reloadGame,
    handleTransition,
    transitionLoading,
  }
}

export type GameDetailViewModel = ReturnType<typeof useGameDetail>
