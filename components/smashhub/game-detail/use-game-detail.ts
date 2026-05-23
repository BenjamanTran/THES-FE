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
  type GameDetail,
  type GamePlayer,
  type MatchSummary,
  type FinishMatchResponse,
  type Tier,
} from "@/lib/api"
import { useAuth, useRequireAuth } from "@/lib/auth-context"
import {
  adjustSessionStatsForFinishedMatch,
  matchCountsFromList,
  maxSessionPlayed,
  computePlayerDisplayCounts,
} from "@/lib/match-stats"
import {
  getMatchStartBlockers,
  isMatchStartable,
  canStartAnotherMatch,
  countOngoingMatches,
  getMaxCourts,
  getPendingStartBlockReason,
  suggestNextMatch,
} from "@/lib/suggest-next-match"
import { generateMatchBatchFair } from "@/lib/generate-match-batch"
import { PAIR_ARRANGE_MAX_SPREAD, sessionPlayedSpread } from "@/lib/match-stats"
import {
  canArrangePairMatch,
  pairsFromGame,
  suggestPairDoublesMatch,
} from "@/lib/player-pairs"
import { useGameCable } from "@/hooks/use-game-cable"
import type { GameCableEvent } from "@/lib/game-cable"
import { reverseGeocode } from "@/lib/geocode"
import { ratingToStars } from "@/lib/rating-stars"
import { fitMeta } from "./meta"
import { COURT_OPTIONS, MAX_CO_HOSTS, UNDO_MS } from "@/components/smashhub/game-detail/constants"
import { useGamePlayerPairTap } from "@/components/smashhub/game-detail/game-player-pairs"

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
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [showPlaceholderSheet, setShowPlaceholderSheet] = useState(false)
  const [editingPlaceholder, setEditingPlaceholder] = useState<GamePlayer | null>(null)
  const open = gameId !== null

  function mergePriorityIntoMatches(data: GameDetail): GameDetail {
    const matches = [...(data.matches ?? [])]
    const pm = data.priority_match
    if (pm && pm.status === "pending" && !matches.some((m) => m.id === pm.id)) {
      matches.push(pm)
    }
    return { ...data, matches }
  }

  const [matchTab, setMatchTab] = useState<"live" | "queue" | "done">("live")
  const [matchesLoaded, setMatchesLoaded] = useState({ pending: false, finished: false })
  const [tabMatchesLoading, setTabMatchesLoading] = useState(false)
  const matchesLoadedRef = useRef(matchesLoaded)
  matchesLoadedRef.current = matchesLoaded

  const syncGameMatches = useCallback(
    (prev: GameDetail, matches: MatchSummary[]): GameDetail => ({
      ...prev,
      matches,
      match_counts: matchCountsFromList(matches, {
        fallbackFinished: prev.match_counts?.finished,
        finishedLoaded: matchesLoadedRef.current.finished,
      }),
    }),
    [],
  )

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
  }, [gameId, applyGameDetail])

  useEffect(() => {
    if (matchTab === "done") void loadFinishedMatches()
  }, [matchTab, game?.id, loadFinishedMatches])

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
  }, [game, isHost, isParticipant, isPast])

  const openEditSettings = () => {
    if (!game) return
    setEditCourts(game.courts?.length ? [...game.courts] : [1])
    setEditMaxPlayers(game.max_players)
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
    setSettingsSaving(true)
    setSettingsError(null)
    try {
      const updated = await updateGameSettings(game.id, {
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
  const [suggestActionLoading, setSuggestActionLoading] = useState(false)
  const [batchLoading, setBatchLoading] = useState(false)
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
      const prevMatch = (prev.matches ?? []).find((m) => m.id === updated.id)
      let players = prev.players ?? []

      if (
        prevMatch?.status === "finished" &&
        updated.status !== "finished" &&
        prevMatch.winner_team
      ) {
        players = adjustSessionStatsForFinishedMatch(players, prevMatch, -1)
      } else if (
        updated.status === "finished" &&
        prevMatch?.status !== "finished" &&
        updated.winner_team
      ) {
        players = adjustSessionStatsForFinishedMatch(players, updated, 1)
      } else if (
        prevMatch?.status === "finished" &&
        updated.status === "finished" &&
        prevMatch.winner_team &&
        updated.winner_team &&
        prevMatch.winner_team !== updated.winner_team
      ) {
        players = adjustSessionStatsForFinishedMatch(players, prevMatch, -1)
        players = adjustSessionStatsForFinishedMatch(players, updated, 1)
      }

      const matches = (prev.matches ?? []).map((m) => {
        if (m.id === updated.id) return { ...m, ...updated }
        if (updated.priority && updated.status === "pending") return { ...m, priority: false }
        return m
      })
      const hasMatch = matches.some((m) => m.id === updated.id)
      const nextMatches =
        hasMatch || updated.status !== "pending"
          ? matches
          : [...matches, updated]
      const next = syncGameMatches(prev, nextMatches)
      return {
        ...next,
        players,
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
      if (payload.event === "match.deleted") {
        setGame((prev) => {
          if (!prev?.matches) return prev
          return syncGameMatches(
            prev,
            prev.matches.filter((m) => m.id !== payload.match_id),
          )
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
    [patchMatchInGame, syncGameMatches],
  )

  const cableEnabled =
    open &&
    gameId != null &&
    game != null &&
    game.status !== "finished" &&
    game.status !== "cancelled"

  useGameCable(gameId, handleCableEvent, cableEnabled)

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

  const minPlayersForMatch = game?.match_type === "doubles" ? 4 : 2
  const joinedPlayerCount = Math.max(game?.players_count ?? 0, game?.players?.length ?? 0)
  const hasEnoughPlayers = joinedPlayerCount >= minPlayersForMatch
  const gameAllowsMatches =
    game?.status === "open" || game?.status === "full" || game?.status === "ongoing"
  const canPlanMatches = canManage && gameAllowsMatches && hasEnoughPlayers
  const canCreateMatch = canPlanMatches
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
    if (game.status === "cancelled") return false
    if (game.status === "ongoing" || game.status === "finished") return true
    const now = Date.now()
    const start = new Date(game.start_time).getTime()
    const end = new Date(game.end_time).getTime()
    return now >= start && now <= end
  }, [game])

  const playerMatchCounts = useMemo(
    () => computePlayerDisplayCounts(game?.players ?? [], game?.matches),
    [game?.players, game?.matches],
  )
  const maxPlayed = useMemo(() => maxSessionPlayed(playerMatchCounts), [playerMatchCounts])

  const sortedPlayers = useMemo(() => {
    if (!game?.players) return []
    return [...game.players].sort((a, b) => {
      const ca = playerMatchCounts[a.id]?.played ?? 0
      const cb = playerMatchCounts[b.id]?.played ?? 0
      if (ca !== cb) return cb - ca
      return (a.name || "").localeCompare(b.name || "", "vi")
    })
  }, [game?.players, playerMatchCounts])

  const { ongoingMatches, pendingMatches, finishedMatches } = useMemo(() => {
    const all = game?.matches ?? []
    return {
      ongoingMatches: all.filter((m) => m.status === "ongoing"),
      pendingMatches: all
        .filter((m) => m.status === "pending")
        .sort((a, b) => a.match_number - b.match_number),
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

  const priorityMatch = useMemo(() => {
    if (!game) return null
    if (game.priority_match?.status === "pending") return game.priority_match
    return game.matches?.find((m) => m.status === "pending" && m.priority) ?? null
  }, [game])

  const priorityCanStart = useMemo(() => {
    if (!priorityMatch || !isGameTime || !game) return false
    return (
      canStartAnotherMatch(game.matches ?? [], getMaxCourts(game)) &&
      isMatchStartable(priorityMatch, busyPlayerIds, playersNeeded)
    )
  }, [priorityMatch, busyPlayerIds, playersNeeded, isGameTime, game])

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
    return suggestNextMatch(game, game.players ?? [], game.matches ?? [])
  }, [game, canPlanMatches])

  const hideSuggestForPriority =
    priorityMatch &&
    nextSuggestion?.kind === "start" &&
    nextSuggestion.match.id === priorityMatch.id

  const showNextSuggestion = nextSuggestion && !hideSuggestForPriority

  const pairMatchPlan = useMemo(() => {
    if (!game || game.match_type !== "doubles" || !canPlanMatches) return null
    return suggestPairDoublesMatch(game, game.players ?? [], game.matches ?? [])
  }, [game, canPlanMatches])

  const pairSessionSpread = useMemo(() => {
    if (!game?.players?.length) return 0
    return sessionPlayedSpread(game.players, game.matches)
  }, [game?.players, game?.matches])

  const showPairArrange =
    !!game &&
    game.match_type === "doubles" &&
    canPlanMatches &&
    canManage &&
    canArrangePairMatch(game) &&
    pairsFromGame(game.player_pairs).length > 0 &&
    pairSessionSpread < PAIR_ARRANGE_MAX_SPREAD

  const pairArrangeHint =
    pairMatchPlan && "error" in pairMatchPlan
      ? pairMatchPlan.error
      : pairMatchPlan && "label" in pairMatchPlan
        ? pairMatchPlan.reason
        : undefined

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
    if (!game || !nextSuggestion) return
    const lineup =
      nextSuggestion.kind === "create"
        ? { teamA: nextSuggestion.teamA, teamB: nextSuggestion.teamB }
        : nextSuggestion.kind === "start" && nextSuggestion.altCreate
          ? {
              teamA: nextSuggestion.altCreate.teamA,
              teamB: nextSuggestion.altCreate.teamB,
            }
          : null
    if (!lineup) return
    setSuggestActionLoading(true)
    try {
      const maxCourts = getMaxCourts(game)
      const ongoingCount = countOngoingMatches(game.matches ?? [])
      const created = await createMatch(game.id, {
        team_a: lineup.teamA,
        team_b: lineup.teamB,
      })
      if (!canStartAnotherMatch(game.matches ?? [], maxCourts)) {
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
    if (!game || nextSuggestion?.kind !== "queue") return
    setSuggestActionLoading(true)
    try {
      await createMatch(game.id, {
        team_a: nextSuggestion.teamA,
        team_b: nextSuggestion.teamB,
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
    const plan = suggestPairDoublesMatch(game, game.players ?? [], game.matches ?? [])
    if ("error" in plan) {
      toast.error(plan.error)
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

  const handleGenerateBatch = async (count: 10 = 10) => {
    if (!game) return
    setBatchLoading(true)
    try {
      const { created, errors } = await generateMatchBatchFair(
        game,
        game.players ?? [],
        game.matches ?? [],
        count,
      )
      await loadGame(game.id)
      if (created > 0) {
        setMatchTab("queue")
        toast.success(`Đã xếp ${created} trận — chia lượt đều trong hàng chờ`)
      }
      if (errors.length > 0) {
        toast.error(errors[0])
      } else if (created === 0) {
        toast.error("Không thể xếp thêm trận")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể xếp trận")
    } finally {
      setBatchLoading(false)
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
    setEditMaxPlayers,
    settingsSaving,
    settingsError,
    showPlaceholderSheet,
    setShowPlaceholderSheet,
    editingPlaceholder,
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
    batchLoading,
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
    handleDeletePlaceholder,
    openRatingSheet,
    handleRatePlayer,
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
    showNextSuggestion,
    suggestedMatchId,
    handleTogglePriority,
    handleStartSuggested,
    handleCreateAndStartSuggested,
    handleQueueSuggested,
    handleGenerateBatch,
    handleArrangePairMatch,
    showPairArrange,
    pairArrangeHint,
    pairArrangeDisabled,
    pairArrangeLoading,
    togglingPriorityId,
    fitInfo,
    pairPick,
    pairTapLoading,
    onPlayerPairTap,
    reloadGame,
  }
}

export type GameDetailViewModel = ReturnType<typeof useGameDetail>
