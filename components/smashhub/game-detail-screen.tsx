"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Swords,
  MessageCircle,
  AlertTriangle,
  LogOut,
  Loader2,
  XCircle,
  Crown,
  FileText,
  CheckCircle2,
  Wallet,
  Trophy,
  Plus,
  Flag,
  Scale,
  Trash2,
  Shield,
  UserMinus,
  Share2,
  Check,
  Star,
  Play,
  Pencil,
  Copy,
  Minus,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { SkillBadge, SKILL_LABELS, skillColors, type SkillLevel } from "./skill-badge"
import { GenderIcon } from "./gender-icon"
import { CreateMatchSheet } from "./create-match-sheet"
import { PlaceholderPlayerSheet } from "./placeholder-player-sheet"
import { ScoreEntryModal } from "./score-entry-modal"
import {
  fetchGame,
  updateGameSettings,
  joinGame,
  leaveGame,
  deleteMatch,
  startMatch,
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth, useRequireAuth } from "@/lib/auth-context"
import { reverseGeocode } from "@/lib/geocode"
import { formatPriceRange } from "@/lib/format"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

interface GameDetailScreenProps {
  gameId: number | null
  onClose: () => void
  onChanged?: () => void
}

function statusMeta(status: GameDetail["status"]) {
  switch (status) {
    case "open":
      return { label: "Đang mở", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" }
    case "full":
      return { label: "Đã đầy", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" }
    case "ongoing":
      return { label: "Đang diễn ra", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" }
    case "finished":
      return { label: "Đã kết thúc", className: "bg-neutral-500/20 text-neutral-300 border-neutral-500/30" }
    case "cancelled":
      return { label: "Đã huỷ", className: "bg-red-500/20 text-red-400 border-red-500/30" }
  }
}

function fitMeta(fit: GameDetail["fit_level"]) {
  switch (fit) {
    case "good":
      return { label: "Phù hợp với trình độ", className: "text-emerald-400", Icon: CheckCircle2 }
    case "warning":
      return { label: "Có thể chưa phù hợp", className: "text-amber-400", Icon: AlertTriangle }
    case "hard":
      return { label: "Trình độ chênh lệch lớn", className: "text-red-400", Icon: AlertTriangle }
    default:
      return null
  }
}

import { ratingToStars } from "@/lib/rating-stars"

function generateFbPost(game: GameDetail): string {
  const start = new Date(game.start_time)
  const end = new Date(game.end_time)
  const timeRange = `${start.getHours()}h-${end.getHours()}h`
  const dateStr = format(start, "dd/MM/yyyy")

  const locationParts = game.location?.split(" - ") || []
  const locationLine = locationParts.length > 1
    ? `📍 Địa điểm: ${locationParts.slice(1).join(" - ")}\n(${locationParts[0]})`
    : game.location
      ? `📍 Địa điểm: ${game.location}`
      : ""

  const levelLabels: string[] = []
  if (game.min_tier) levelLabels.push(SKILL_LABELS[game.min_tier as SkillLevel] || game.min_tier)
  if (game.max_tier && game.max_tier !== game.min_tier) levelLabels.push(SKILL_LABELS[game.max_tier as SkillLevel] || game.max_tier)
  const levelLine = levelLabels.length > 0 ? `🏸 Trình độ: ${levelLabels.join(" + ")}` : ""

  const courts = game.courts?.length || 1
  const courtLine = `🏟️ ${courts} sân — tối đa ${game.max_players} người`
  const currentLine = game.players_count > 0 ? `📌 Hiện tại đã có ${game.players_count} người` : ""

  let priceLine = ""
  const minP = game.min_price ?? 0
  const maxP = game.max_price ?? 0
  if (minP > 0 || maxP > 0) {
    const fmtK = (v: number) => `${Math.round(v / 1000)}k`
    if (minP === maxP) priceLine = `💰 Phí: ${fmtK(maxP)}/buổi`
    else if (minP <= 0) priceLine = `💰 Phí: ~${fmtK(maxP)}/buổi`
    else priceLine = `💰 Phí dao động: ${fmtK(minP)} - ${fmtK(maxP)}/buổi`
  }

  const gameTitle = game.title || `Kèo cầu lông vãng lai ${dateStr}`
  const inviteUrl = game.invite_code
    ? `\n🔗 Tham gia ngay: ${typeof window !== "undefined" ? window.location.origin : ""}/join/${game.invite_code}`
    : ""

  const lines = [
    `🏸 ${gameTitle.toUpperCase()} ${timeRange} ${dateStr} 🏸`,
    "",
    locationLine,
    "👫 Nam nữ đều welcome",
    levelLine,
    "🪶 Cầu thay thoải mái",
    courtLine,
    currentLine,
    priceLine,
    "",
    "Không khí vui vẻ, ưu tiên giao lưu thoải mái, đánh vui là chính 😄",
    "Ai muốn tham gia ib mình nhé!",
    inviteUrl,
  ]

  return lines.filter(l => l !== "").join("\n")
}

function avatarLabel(name: string | null) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  const last = parts[parts.length - 1] || name
  return last.charAt(0).toUpperCase()
}

export function GameDetailScreen({ gameId, onClose, onChanged }: GameDetailScreenProps) {
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

  const COURT_OPTIONS = useMemo(() => Array.from({ length: 16 }, (_, i) => i + 1), [])

  const loadGame = useCallback(
    async (id: number) => {
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
    },
    [],
  )

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
      return
    }
    loadGame(gameId)
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
      onChanged?.()
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
      onChanged?.()
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
      onChanged?.()
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
    onChanged?.()
  }

  const openEditMatch = (match: MatchSummary) => {
    setShowCreateMatch(false)
    setShowCreateMatchAutoBalance(false)
    setEditingMatch(match)
  }

  const handleMatchFinished = (_res: FinishMatchResponse) => {
    setFinishingMatch(null)
    if (game) loadGame(game.id)
    onChanged?.()
  }

  const [startingMatchId, setStartingMatchId] = useState<number | null>(null)
  const handleStartMatch = async (matchId: number) => {
    if (!game) return
    setStartingMatchId(matchId)
    try {
      await startMatch(game.id, matchId)
      loadGame(game.id)
      onChanged?.()
    } catch {
      // silently ignore
    } finally {
      setStartingMatchId(null)
    }
  }

  const [deletingMatchId, setDeletingMatchId] = useState<number | null>(null)
  const handleDeleteMatch = async (matchId: number) => {
    if (!game) return
    setDeletingMatchId(matchId)
    try {
      await deleteMatch(game.id, matchId)
      loadGame(game.id)
      onChanged?.()
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
      onChanged?.()
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
      onChanged?.()
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
  const canCreateMatch = canManage && gameAllowsMatches && hasEnoughPlayers
  const showMatchesSection =
    gameAllowsMatches || (game?.matches != null && game.matches.length > 0)

  const isGameTime = useMemo(() => {
    if (!game) return false
    if (game.status === "cancelled") return false
    if (game.status === "ongoing" || game.status === "finished") return true
    const now = Date.now()
    const start = new Date(game.start_time).getTime()
    const end = new Date(game.end_time).getTime()
    return now >= start && now <= end
  }, [game])

  const playerMatchCounts = useMemo(() => {
    const counts: Record<number, { played: number; wins: number; losses: number }> = {}
    if (!game?.matches) return counts
    for (const match of game.matches) {
      const allPlayers = [...(match.team_a || []), ...(match.team_b || [])]
      for (const p of allPlayers) {
        if (!counts[p.id]) counts[p.id] = { played: 0, wins: 0, losses: 0 }
        counts[p.id].played += 1
        if (match.status === "finished" && match.winner_team) {
          const inTeamA = match.team_a.some((t) => t.id === p.id)
          const inTeamB = match.team_b.some((t) => t.id === p.id)
          const won = (match.winner_team === "team_a" && inTeamA) || (match.winner_team === "team_b" && inTeamB)
          if (won) counts[p.id].wins += 1
          else counts[p.id].losses += 1
        }
      }
    }
    return counts
  }, [game?.matches])

  const fitInfo = fitMeta(game?.fit_level)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md mx-auto h-[100dvh] sm:h-[90dvh] flex flex-col p-0 gap-0 rounded-none sm:rounded-3xl"
      >
        <DialogTitle className="sr-only">
          {game?.description || (gameId !== null ? `Chi tiết trận #${gameId}` : "Chi tiết trận đấu")}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Thông tin chi tiết về trận đấu, danh sách người chơi và các hành động tham gia hoặc rời trận.
        </DialogDescription>

        <header className="glass-dark px-4 pt-4 pb-3 border-b border-border/20 flex-shrink-0 safe-top z-50 relative">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" className="rounded-full -ml-2" onClick={onClose}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="font-bold text-base">Chi tiết trận đấu</h2>
            <div className="w-9" />
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading && !game ? (
            <div className="px-4 py-4 space-y-4 animate-skeleton">
              <div className="h-32 rounded-2xl bg-muted/30" />
              <div className="h-48 rounded-2xl bg-muted/30" />
              <div className="h-24 rounded-2xl bg-muted/30" />
            </div>
          ) : error && !game ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 rounded-full"
                onClick={() => gameId !== null && loadGame(gameId)}
              >
                Thử lại
              </Button>
            </div>
          ) : game ? (
            <div className="px-4 py-4 flex flex-col gap-4 animate-stagger">
              <Card className="order-0 p-4 rounded-2xl border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="font-bold text-lg leading-snug">
                      {game.title || `Game #${game.id} (${game.host?.name || "Host"})`}
                    </h1>
                    {game.host?.name && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          Host: <span className="text-foreground font-medium">{game.host.name}</span>
                          {isHost && " (bạn)"}
                        </span>
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className={`rounded-full text-[10px] flex-shrink-0 ${statusMeta(game.status).className}`}>
                    {statusMeta(game.status).label}
                  </Badge>
                </div>

                {fitInfo && !canManage && !isParticipant && (
                  <div className={`flex items-center gap-1.5 mt-3 pt-3 border-t border-border/30 text-xs ${fitInfo.className}`}>
                    <fitInfo.Icon className="w-4 h-4" />
                    <span>{fitInfo.label}</span>
                  </div>
                )}
              </Card>

              <Card className="order-10 p-4 rounded-2xl border-border/50">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="font-medium capitalize">
                    {format(new Date(game.start_time), "EEEE, dd/MM/yyyy", { locale: vi })}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm mt-2">
                  <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="font-medium">
                    {format(new Date(game.start_time), "HH:mm")} –{" "}
                    {format(new Date(game.end_time), "HH:mm")}
                  </span>
                </div>
              </Card>

              {(game.location || game.lat !== null || game.courts) && (
                <Card className="order-10 p-4 rounded-2xl border-border/50">
                  {(game.location || game.lat !== null) && (() => {
                    const displayAddress = game.location || resolvedAddress || (game.lat != null ? `${game.lat}, ${game.lng}` : null)
                    return (
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        {game.location ? (
                          <p className="font-medium">{game.location}</p>
                        ) : resolvingAddress ? (
                          <p className="font-medium text-muted-foreground flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Đang tải địa chỉ…
                          </p>
                        ) : resolvedAddress ? (
                          <p className="font-medium leading-snug">{resolvedAddress}</p>
                        ) : (
                          <p className="font-medium">
                            {game.lat}, {game.lng}
                          </p>
                        )}
                        {resolvedAddress && game.lat !== null && game.lng !== null && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {Number(game.lat).toFixed(5)}, {Number(game.lng).toFixed(5)}
                          </p>
                        )}
                      </div>
                      {displayAddress && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(displayAddress)
                            setCopiedAddress(true)
                            setTimeout(() => setCopiedAddress(false), 2000)
                          }}
                          className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Copy địa chỉ"
                        >
                          {copiedAddress ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                    )
                  })()}
                  {(game.courts?.length || canEditSettings) && (
                    <div className="flex items-start justify-between gap-2 mt-3">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="text-xs text-muted-foreground">Sân:</span>
                        {game.courts && game.courts.length > 0 ? (
                          game.courts.map((c) => (
                            <Badge key={c} variant="outline" className="text-[10px] px-2 py-0.5">
                              Sân {c}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">Chưa chọn sân</span>
                        )}
                      </div>
                      {canEditSettings && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 rounded-lg text-[10px] gap-1 flex-shrink-0"
                          onClick={openEditSettings}
                        >
                          <Pencil className="w-3 h-3" />
                          Sửa
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              )}

              <Card className="order-10 p-4 rounded-2xl border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Swords className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">Thể thức</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {game.match_type === "singles" ? "Đơn (1v1)" : "Đôi (2v2)"}
                  </Badge>
                  {game.min_tier && <SkillBadge level={game.min_tier} size="xs" />}
                  {game.max_tier && game.max_tier !== game.min_tier && (
                    <>
                      <span className="text-xs text-muted-foreground">→</span>
                      <SkillBadge level={game.max_tier} size="xs" />
                    </>
                  )}
                </div>
              </Card>

              <Card className="order-10 p-4 rounded-2xl border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Giá / slot</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {formatPriceRange(game.min_price ?? 0, game.max_price ?? 0)}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Cho toàn bộ thời gian chơi
                </p>
              </Card>

              {canManage && game.invite_code && (
                <Card className="order-10 p-3 rounded-2xl border-blue-500/20 bg-blue-500/5">
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setFbPostExpanded(!fbPostExpanded)}
                  >
                    <span className="text-sm">📋</span>
                    <p className="flex-1 text-xs text-muted-foreground truncate">
                      {generateFbPost(game).split("\n")[0]}
                    </p>
                    <Button
                      size="sm"
                      variant={copiedFbPost ? "default" : "outline"}
                      className="rounded-full h-7 px-2.5 gap-1 text-[10px] flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigator.clipboard.writeText(generateFbPost(game))
                        setCopiedFbPost(true)
                        setTimeout(() => setCopiedFbPost(false), 2000)
                      }}
                    >
                      {copiedFbPost ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedFbPost ? "Đã copy" : "Copy bài FB"}
                    </Button>
                  </div>
                  {fbPostExpanded && (
                    <div className="mt-3 pt-3 border-t border-border/20">
                      <div className="bg-secondary rounded-xl p-3 text-xs whitespace-pre-wrap leading-relaxed">
                        {generateFbPost(game)}
                      </div>
                    </div>
                  )}
                </Card>
              )}

              <Card className={`p-4 rounded-2xl border-border/50 ${isGameTime ? "order-2" : "order-10"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Người chơi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManage && game.invite_code && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full text-[10px] h-6 px-2.5 gap-1"
                        onClick={() => {
                          const url = `${window.location.origin}/join/${game.invite_code}`
                          navigator.clipboard.writeText(url)
                          setCopiedLink(true)
                          setTimeout(() => setCopiedLink(false), 2000)
                        }}
                      >
                        {copiedLink ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                        {copiedLink ? "Đã copy" : "Chia sẻ link"}
                      </Button>
                    )}
                    <Badge variant="secondary" className="rounded-full text-xs">
                      {game.players_count}/{game.max_players}
                    </Badge>
                    {canEditSettings && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 rounded-full"
                        onClick={openEditSettings}
                        title="Sửa sân & số người"
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {canManagePlaceholders && game.players_count < game.max_players && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-full rounded-full text-xs mb-3 gap-1.5"
                    onClick={openAddPlaceholder}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm người
                  </Button>
                )}

                <div className="space-y-2">
                  {game.players.map((player) => {
                    const isThisHost = player.id === game.host?.id
                    const isThisCoHost = player.role === "co_host"
                    const isPlaceholder = !!player.placeholder
                    const isMe = player.id === currentUserId
                    const stats = playerMatchCounts[player.id]
                    const canKickThis = canManage && !isThisHost && !isMe && !isPlaceholder
                      && (isHost || !isThisCoHost)
                    const canPromoteThis = isHost && !isThisHost && !isMe && !isPlaceholder
                    const canEditPlaceholder = canManagePlaceholders && isPlaceholder
                    const gameActive = game.status !== "finished" && game.status !== "cancelled"
                    return (
                      <div key={player.id} className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-9 h-9">
                            <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                              {avatarLabel(player.name)}
                            </AvatarFallback>
                          </Avatar>
                          {player.gender && (
                            <span className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5">
                              <GenderIcon gender={player.gender} size="sm" />
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {player.name || `User #${player.id}`}
                            {isMe && <span className="text-xs text-muted-foreground"> (bạn)</span>}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <SkillBadge level={player.host_rated_tier || player.rank?.tier || null} size="xs" compact />
                            {(() => {
                              const tier = player.host_rated_tier || player.rank?.tier
                              const stars = player.host_rated_tier
                                ? player.host_rated_stars
                                : player.rank ? ratingToStars(player.rank.tier, player.rank.rating) : null
                              if (!tier || stars == null) return null
                              return (
                                <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
                                  {stars}<Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                </span>
                              )
                            })()}
                            {canManage && gameActive && (
                              <button
                                type="button"
                                onClick={() => openRatingSheet(player)}
                                className="p-0.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                title="Đánh giá trình độ"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <div className="flex flex-col items-end gap-0.5">
                            {isThisHost && (
                              <Badge className="bg-amber-500/20 text-amber-400 border-0 text-[10px] px-1.5">
                                <Crown className="w-3 h-3 mr-1" />
                                Host
                              </Badge>
                            )}
                            {isThisCoHost && !isThisHost && (
                              <Badge className="bg-blue-500/20 text-blue-400 border-0 text-[10px] px-1.5">
                                <Shield className="w-3 h-3 mr-1" />
                                Co-host
                              </Badge>
                            )}
                            {isPlaceholder && (
                              <Badge variant="outline" className="text-[10px] px-1.5 border-muted-foreground/40">
                                Tạm
                              </Badge>
                            )}
                            {canManage && stats && stats.played > 0 && (
                              <span className="text-[10px] font-semibold">
                                <span className="text-muted-foreground">{stats.played} trận</span>
                                {stats.wins > 0 && <span className="text-emerald-400"> {stats.wins}W</span>}
                                {stats.losses > 0 && <span className="text-red-400"> {stats.losses}L</span>}
                              </span>
                            )}
                          </div>
                          {gameActive && (canPromoteThis || canKickThis || canEditPlaceholder) && (
                            <div className="flex items-center gap-0.5 ml-1">
                              {canEditPlaceholder && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openEditPlaceholder(player)}
                                    className="p-1 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                    title="Sửa thông tin"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePlaceholder(player.id, player.name)}
                                    className="p-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    title="Xóa người tạm"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                              {canPromoteThis && (
                                <button
                                  type="button"
                                  onClick={() => handlePromote(player.id)}
                                  className={`p-1 rounded-full transition-colors ${
                                    isThisCoHost
                                      ? "text-blue-400 hover:bg-blue-500/20"
                                      : "text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10"
                                  }`}
                                  title={isThisCoHost ? "Gỡ co-host" : "Chỉ định co-host"}
                                >
                                  <Shield className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {canKickThis && (
                                <button
                                  type="button"
                                  onClick={() => handleKick(player.id, player.name)}
                                  className="p-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                  title="Kick"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {Array.from({ length: Math.max(0, game.max_players - game.players_count) }).map(
                    (_, i) => (
                      <div key={`empty-${i}`} className="flex items-center gap-3 opacity-50">
                        <div className="w-9 h-9 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                          <Users className="w-4 h-4 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm text-muted-foreground">Đang chờ người chơi…</p>
                      </div>
                    ),
                  )}

                  {canCreateMatch && (
                    <div className="pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full rounded-full text-xs"
                        onClick={() => {
                          setShowCreateMatchAutoBalance(true)
                          setShowCreateMatch(true)
                        }}
                      >
                        <Scale className="w-3.5 h-3.5 mr-1.5" />
                        Cân bằng đội
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              {showMatchesSection && (
                <Card
                  className={`gap-3 min-w-0 overflow-hidden p-4 rounded-2xl border-border/50 ${isGameTime ? "order-1" : "order-20"}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Swords className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm font-semibold">Các trận đấu</span>
                      {game.matches && game.matches.length > 0 && (
                        <Badge variant="secondary" className="rounded-full text-[10px]">
                          {game.matches.length}
                        </Badge>
                      )}
                    </div>
                    {canCreateMatch && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full text-xs h-7 px-2.5"
                        onClick={() => setShowCreateMatch(true)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Tạo trận
                      </Button>
                    )}
                  </div>

                  {(!game.matches || game.matches.length === 0) ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Chưa có trận đấu nào. Host có thể tạo trận mới.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {game.matches.map((match) => {
                        const isPending = match.status === "pending"
                        const isOngoing = match.status === "ongoing"
                        const isFinished = match.status === "finished"
                        const canFinishThis = isParticipant && isOngoing
                        const statusBadge = isFinished
                          ? { label: "Kết thúc", cls: "bg-neutral-500/20 text-neutral-300 border-neutral-500/30" }
                          : isOngoing
                            ? { label: "Đang chơi", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" }
                            : { label: "Chờ bắt đầu", cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" }
                        return (
                          <div
                            key={match.id}
                            className={`min-w-0 overflow-hidden p-3 rounded-xl border ${
                              isFinished
                                ? "border-border/30 bg-secondary/30"
                                : isOngoing
                                  ? "border-emerald-500/20 bg-emerald-500/5"
                                  : "border-amber-500/20 bg-amber-500/5"
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-semibold text-muted-foreground">
                                  Trận {match.match_number}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 rounded-full shrink-0 ${statusBadge.cls}`}
                                >
                                  {statusBadge.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {canManage && isPending && isGameTime && (
                                  <Button
                                    size="sm"
                                    className="rounded-full text-xs h-7 px-3 bg-emerald-500 hover:bg-emerald-600 text-white"
                                    onClick={() => handleStartMatch(match.id)}
                                    disabled={startingMatchId === match.id}
                                  >
                                    {startingMatchId === match.id
                                      ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                      : <Play className="w-3.5 h-3.5 mr-1" />
                                    }
                                    Bắt đầu
                                  </Button>
                                )}
                                {canFinishThis && (
                                  <Button
                                    size="sm"
                                    className="rounded-full text-xs h-7 px-3 bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/30"
                                    onClick={() => setFinishingMatch(match)}
                                  >
                                    <Flag className="w-3.5 h-3.5 mr-1" />
                                    Kết thúc
                                  </Button>
                                )}
                                {canManage && !isFinished && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="rounded-full h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                    onClick={() => openEditMatch(match)}
                                    title="Sửa trận"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                                {canManage && !isFinished && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="rounded-full h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteMatch(match.id)}
                                    disabled={deletingMatchId === match.id}
                                  >
                                    {deletingMatchId === match.id
                                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      : <Trash2 className="w-3.5 h-3.5" />
                                    }
                                  </Button>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2 min-w-0">
                              <div className="min-w-0">
                                <p className="text-[10px] text-muted-foreground mb-1 text-center">Team A</p>
                                <div className="flex flex-wrap gap-1 justify-center">
                                  {match.team_a.map((p) => {
                                    const gp = game.players.find((pl) => pl.id === p.id)
                                    const gender = p.gender ?? gp?.gender
                                    const displayTier = gp?.host_rated_tier || p.rank?.tier
                                    const displayStars = gp?.host_rated_tier && gp?.host_rated_stars
                                      ? gp.host_rated_stars
                                      : p.rank ? ratingToStars(p.rank.tier, p.rank.rating) : null
                                    const tc = displayTier ? skillColors[displayTier] || skillColors.newbie : null
                                    return (
                                      <div key={p.id} className="flex flex-col items-center min-w-0 max-w-full">
                                        <Badge
                                          variant="secondary"
                                          className="text-[10px] px-1.5 py-0 rounded-b-none max-w-[10rem] truncate text-center inline-flex items-center justify-center gap-0.5"
                                          title={p.name || `#${p.id}`}
                                        >
                                          {p.name || `#${p.id}`}
                                          {gender && <GenderIcon gender={gender} size="sm" />}
                                        </Badge>
                                        {displayTier && tc && (
                                          <span className={`text-[9px] px-1.5 py-0 rounded-b-md ${tc.bg} ${tc.text} flex items-center justify-center gap-0.5 max-w-[10rem] truncate`}>
                                            {SKILL_LABELS[displayTier as SkillLevel]} {displayStars}<Star className="w-2 h-2 fill-current shrink-0" />
                                          </span>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>

                              {isFinished && match.team_a_score != null && match.team_b_score != null ? (
                                <div className="flex items-center justify-center gap-2 py-0.5">
                                  <span className={`text-lg font-bold ${match.winner_team === "team_a" ? "text-amber-400" : "text-muted-foreground"}`}>
                                    {match.team_a_score}
                                  </span>
                                  <span className="text-xs text-muted-foreground">–</span>
                                  <span className={`text-lg font-bold ${match.winner_team === "team_b" ? "text-amber-400" : "text-muted-foreground"}`}>
                                    {match.team_b_score}
                                  </span>
                                </div>
                              ) : (
                                <p className="text-center text-xs text-muted-foreground font-medium py-0.5">vs</p>
                              )}

                              <div className="min-w-0">
                                <p className="text-[10px] text-muted-foreground mb-1 text-center">Team B</p>
                                <div className="flex flex-wrap gap-1 justify-center">
                                  {match.team_b.map((p) => {
                                    const gp = game.players.find((pl) => pl.id === p.id)
                                    const gender = p.gender ?? gp?.gender
                                    const displayTier = gp?.host_rated_tier || p.rank?.tier
                                    const displayStars = gp?.host_rated_tier && gp?.host_rated_stars
                                      ? gp.host_rated_stars
                                      : p.rank ? ratingToStars(p.rank.tier, p.rank.rating) : null
                                    const tc = displayTier ? skillColors[displayTier] || skillColors.newbie : null
                                    return (
                                      <div key={p.id} className="flex flex-col items-center min-w-0 max-w-full">
                                        <Badge
                                          variant="secondary"
                                          className="text-[10px] px-1.5 py-0 rounded-b-none max-w-[10rem] truncate text-center inline-flex items-center justify-center gap-0.5"
                                          title={p.name || `#${p.id}`}
                                        >
                                          {p.name || `#${p.id}`}
                                          {gender && <GenderIcon gender={gender} size="sm" />}
                                        </Badge>
                                        {displayTier && tc && (
                                          <span className={`text-[9px] px-1.5 py-0 rounded-b-md ${tc.bg} ${tc.text} flex items-center justify-center gap-0.5 max-w-[10rem] truncate`}>
                                            {SKILL_LABELS[displayTier as SkillLevel]} {displayStars}<Star className="w-2 h-2 fill-current shrink-0" />
                                          </span>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>

                            {isFinished && match.winner_team && (
                              <div className="flex items-center justify-center gap-1 mt-2 pt-2 border-t border-border/20">
                                <Trophy className="w-3 h-3 text-amber-400" />
                                <span className="text-[10px] text-amber-400 font-medium">
                                  {match.winner_team === "team_a" ? "Team A" : "Team B"} thắng
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Card>
              )}

              {game.description && (
                <Card className="order-30 p-4 rounded-2xl border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Mô tả</span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {game.description}
                  </p>
                </Card>
              )}

              {warning && (
                <Card className="order-30 p-3 rounded-2xl bg-amber-500/10 border-amber-500/30">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-400">{warning}</p>
                  </div>
                </Card>
              )}

              {error && (
                <Card className="order-30 p-3 rounded-2xl bg-destructive/10 border-destructive/30">
                  <p className="text-sm text-destructive">{error}</p>
                </Card>
              )}
            </div>
          ) : null}
        </div>

        <footer className="px-4 py-4 border-t border-border/20 flex-shrink-0 safe-bottom">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-full" disabled>
              <MessageCircle className="w-4 h-4 mr-1" />
              Chat nhóm
            </Button>
            {primaryAction ? (
              <Button
                variant={primaryAction.variant}
                className={`flex-1 rounded-full ${
                  primaryAction.destructive
                    ? "border-destructive/40 text-destructive hover:bg-destructive/10"
                    : ""
                }`}
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled || actionLoading || loading || !game}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <primaryAction.icon className="w-4 h-4 mr-1" />
                )}
                {primaryAction.label}
              </Button>
            ) : (
              <Button variant="secondary" className="flex-1 rounded-full" disabled>
                {game?.status === "cancelled"
                  ? "Đã huỷ"
                  : game?.status === "finished"
                    ? "Đã kết thúc"
                    : game?.status === "ongoing"
                      ? "Đang diễn ra"
                      : "Đã kết thúc"}
              </Button>
            )}
          </div>
        </footer>
      </DialogContent>

      {game && (
        <CreateMatchSheet
          open={showCreateMatch || editingMatch != null}
          onOpenChange={(v) => {
            if (!v) {
              setShowCreateMatch(false)
              setShowCreateMatchAutoBalance(false)
              setEditingMatch(null)
            }
          }}
          gameId={game.id}
          players={game.players}
          matches={game.matches || []}
          matchType={game.match_type}
          onCreated={handleMatchCreated}
          autoBalance={showCreateMatchAutoBalance}
          editingMatch={editingMatch}
        />
      )}

      {game && finishingMatch && (
        <ScoreEntryModal
          open={!!finishingMatch}
          onOpenChange={(v) => !v && setFinishingMatch(null)}
          gameId={game.id}
          matchId={finishingMatch.id}
          matchNumber={finishingMatch.match_number}
          onFinished={handleMatchFinished}
        />
      )}

      {game && (
        <PlaceholderPlayerSheet
          open={showPlaceholderSheet}
          onOpenChange={setShowPlaceholderSheet}
          gameId={game.id}
          player={editingPlaceholder}
          onSaved={() => {
            loadGame(game.id)
            onChanged?.()
          }}
        />
      )}

      <Sheet open={showEditSettings} onOpenChange={setShowEditSettings}>
        <SheetContent side="bottom" className="rounded-t-3xl max-w-md mx-auto">
          <SheetHeader>
            <SheetTitle className="text-base">Sửa sân & số người</SheetTitle>
          </SheetHeader>
          <div className="space-y-5 pt-4 pb-6">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Chọn sân (bấm để bật/tắt)</Label>
              <div className="grid grid-cols-4 gap-2">
                {COURT_OPTIONS.map((court) => {
                  const selected = editCourts.includes(court)
                  return (
                    <Button
                      key={court}
                      type="button"
                      variant={selected ? "default" : "outline"}
                      size="sm"
                      className="rounded-xl h-9 text-xs"
                      onClick={() => toggleEditCourt(court)}
                    >
                      Sân {court}
                    </Button>
                  )
                })}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Bỏ chọn sân cũ rồi chọn sân mới (VD: tắt 1, 2 → bật 3, 4)
              </p>
              {editCourts.length === 0 && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400">
                  Chọn ít nhất 1 sân trước khi lưu
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Số người tối đa</Label>
              <div className="flex items-center justify-between bg-secondary rounded-2xl p-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full w-10 h-10"
                  disabled={editMaxPlayers <= Math.max(2, game?.players_count ?? 2)}
                  onClick={() =>
                    setEditMaxPlayers((n) => Math.max(game?.players_count ?? 2, n - 1))
                  }
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-xl font-bold">{editMaxPlayers} người</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full w-10 h-10"
                  onClick={() => setEditMaxPlayers((n) => n + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {game && (
                <p className="text-[10px] text-muted-foreground">
                  Hiện có {game.players_count} người — không thể đặt dưới mức này
                </p>
              )}
            </div>

            {settingsError && (
              <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {settingsError}
              </p>
            )}

            <Button
              className="w-full rounded-full"
              onClick={handleSaveSettings}
              disabled={settingsSaving || editCourts.length === 0}
            >
              {settingsSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Lưu thay đổi
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!ratingPlayer} onOpenChange={(v) => !v && setRatingPlayer(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl max-w-md mx-auto">
          <SheetHeader>
            <SheetTitle className="text-base">
              Đánh giá trình độ – {ratingPlayer?.name || ""}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pt-4 pb-6">
            {ratingPlayer?.declared_rank && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Tự khai:</span>
                <SkillBadge level={ratingPlayer.declared_rank.tier} size="xs" compact />
                <span className="flex items-center gap-0.5 text-amber-400">
                  {ratingToStars(ratingPlayer.declared_rank.tier, ratingPlayer.declared_rank.rating)}
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Trình độ thực tế</Label>
              <Select value={rateTier} onValueChange={(v) => setRateTier(v as Tier)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(SKILL_LABELS) as [SkillLevel, string][]).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Số sao (1–5)</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRateStars(s)}
                    className="p-1 transition-colors"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        s <= rateStars
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/40"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Ghi chú (tuỳ chọn)</Label>
              <Input
                value={rateNote}
                onChange={(e) => setRateNote(e.target.value)}
                maxLength={200}
                placeholder="VD: Chơi tốt hơn trình tự khai…"
                className="rounded-xl text-sm"
              />
            </div>

            <Button
              className="w-full rounded-full"
              onClick={handleRatePlayer}
              disabled={rateSaving}
            >
              {rateSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Lưu đánh giá
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </Dialog>
  )
}
