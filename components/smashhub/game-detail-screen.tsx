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
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { SkillBadge } from "./skill-badge"
import {
  fetchGame,
  joinGame,
  leaveGame,
  type GameDetail,
} from "@/lib/api"
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

  const open = gameId !== null

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

        <header className="glass-dark px-4 pt-4 pb-3 border-b border-border/20 flex-shrink-0 safe-top">
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
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
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
            <div className="px-4 py-4 space-y-4">
              <Card className="p-4 rounded-2xl border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="font-bold text-lg leading-snug">
                      {game.description || `Trận #${game.id}`}
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

                {fitInfo && !isHost && !isParticipant && (
                  <div className={`flex items-center gap-1.5 mt-3 pt-3 border-t border-border/30 text-xs ${fitInfo.className}`}>
                    <fitInfo.Icon className="w-4 h-4" />
                    <span>{fitInfo.label}</span>
                  </div>
                )}
              </Card>

              <Card className="p-4 rounded-2xl border-border/50">
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
                <Card className="p-4 rounded-2xl border-border/50">
                  {(game.location || game.lat !== null) && (
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
                    </div>
                  )}
                  {game.courts && game.courts.length > 0 && (
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className="text-xs text-muted-foreground">Sân:</span>
                      {game.courts.map((c) => (
                        <Badge key={c} variant="outline" className="text-[10px] px-2 py-0.5">
                          Sân {c}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              <Card className="p-4 rounded-2xl border-border/50">
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

              <Card className="p-4 rounded-2xl border-border/50">
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

              <Card className="p-4 rounded-2xl border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Người chơi</span>
                  </div>
                  <Badge variant="secondary" className="rounded-full text-xs">
                    {game.players_count}/{game.max_players}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {game.players.map((player) => {
                    const isThisHost = player.id === game.host?.id
                    const isMe = player.id === currentUserId
                    return (
                      <div key={player.id} className="flex items-center gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                            {avatarLabel(player.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {player.name || `User #${player.id}`}
                            {isMe && <span className="text-xs text-muted-foreground"> (bạn)</span>}
                          </p>
                        </div>
                        {isThisHost && (
                          <Badge className="bg-amber-500/20 text-amber-400 border-0 text-[10px] px-1.5">
                            <Crown className="w-3 h-3 mr-1" />
                            Host
                          </Badge>
                        )}
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
                </div>
              </Card>

              {game.description && (
                <Card className="p-4 rounded-2xl border-border/50">
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
                <Card className="p-3 rounded-2xl bg-amber-500/10 border-amber-500/30">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-400">{warning}</p>
                  </div>
                </Card>
              )}

              {error && (
                <Card className="p-3 rounded-2xl bg-destructive/10 border-destructive/30">
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
    </Dialog>
  )
}
