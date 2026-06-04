"use client"

import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Crown,
  Loader2,
  MapPin,
  Minus,
  Pencil,
  Plus,
  Share2,
  Trash2,
  UserMinus,
  Sun,
  Moon,
  Users,
} from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { UserAvatar } from "../user-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { SkillBadge } from "../skill-badge"
import { GenderIcon } from "../gender-icon"
import { PlaceholderPlayerSheet } from "../placeholder-player-sheet"
import { GameRatingSheet } from "./game-rating-sheet"
import { useAppTheme } from "@/lib/theme-provider"
import { cn } from "@/lib/utils"
import type { GamePlayer, Gender } from "@/lib/api"
import { statusMeta } from "./meta"
import type { GameDetailSimpleViewModel } from "./use-game-detail-simple"

function playerTier(player: GamePlayer): string | null {
  return player.host_rated_tier || player.rank?.tier || null
}

function playedCount(player: GamePlayer): number {
  return player.session_matches?.played ?? 0
}

export function GameDetailSimpleView({ vm }: { vm: GameDetailSimpleViewModel }) {
  const { theme, setTheme } = useAppTheme()
  const {
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
    handleKick,
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
  } = vm

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md mx-auto h-[100dvh] sm:h-[90dvh] flex flex-col p-0 gap-0 rounded-none sm:rounded-3xl"
      >
        <DialogTitle className="sr-only">
          {game?.title || (gameId !== null ? `Chi tiết trận #${gameId}` : "Chi tiết trận đấu")}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Danh sách người chơi và số trận trong buổi chơi.
        </DialogDescription>

        <header className="glass-dark px-4 pt-4 pb-3 border-b border-border/20 flex-shrink-0 safe-top z-50 relative">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" className="rounded-full -ml-2" onClick={onClose}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="font-bold text-base">Buổi chơi</h2>
            <div className="flex items-center gap-1 -mr-2">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-full h-9 w-9",
                  theme === "light" && "bg-primary/15 text-primary ring-1 ring-primary/30",
                )}
                onClick={() => setTheme("light")}
                title="Chế độ sáng"
                aria-pressed={theme === "light"}
              >
                <Sun className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-full h-9 w-9",
                  theme === "dark" && "bg-primary/15 text-primary ring-1 ring-primary/30",
                )}
                onClick={() => setTheme("dark")}
                title="Chế độ tối"
                aria-pressed={theme === "dark"}
              >
                <Moon className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading && !game ? (
            <div className="px-4 py-4 space-y-4 animate-skeleton">
              <div className="h-24 rounded-2xl bg-muted/30" />
              <div className="h-64 rounded-2xl bg-muted/30" />
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
            <div className="px-4 py-4 flex flex-col gap-4">
              <Card className="p-4 rounded-2xl border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="font-bold text-lg leading-snug">
                      {game.title || `Game #${game.id}`}
                    </h1>
                    {game.host?.name && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          Host:{" "}
                          <span className="text-foreground font-medium">{game.host.name}</span>
                        </span>
                      </div>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={`rounded-full text-[10px] flex-shrink-0 ${statusMeta(game.status).className}`}
                  >
                    {statusMeta(game.status).label}
                  </Badge>
                </div>
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
                {(game.location || resolvedAddress || resolvingAddress) && (
                  <div className="flex items-start gap-3 text-sm mt-2">
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      {game.location ||
                        (resolvingAddress ? "Đang tải địa chỉ…" : resolvedAddress)}
                    </span>
                  </div>
                )}
              </Card>

              {warning && (
                <p className="text-xs text-amber-400 bg-amber-500/10 rounded-xl px-3 py-2">{warning}</p>
              )}
              {error && (
                <p className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2">{error}</p>
              )}

              <Card className="p-4 rounded-2xl border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <Users className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-semibold">Người chơi</span>
                    {playerGenderLabel && (
                      <span className="text-[10px] text-muted-foreground font-normal">
                        ({playerGenderLabel})
                      </span>
                    )}
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
                        {copiedLink ? "Đã copy" : "Chia sẻ"}
                      </Button>
                    )}
                    <Badge variant="secondary" className="rounded-full text-xs">
                      {game.players_count}/{game.max_players}
                    </Badge>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground mb-3">
                  Sắp xếp nữ → nam, trong mỗi nhóm theo tên. Viền xanh = ít trận nhất (ưu tiên lên sân).
                </p>

                <div className="space-y-2">
                  {sortedPlayers.map((player, playerIndex) => {
                    const count = playedCount(player)
                    const isPriority =
                      sortedPlayers.length > 0 && count === minPlayed
                    const isThisHost = player.id === game.host?.id
                    const isThisCoHost = player.role === "co_host"
                    const isMe = player.id === currentUserId
                    const tier = playerTier(player)
                    const gender: Gender = player.gender ?? "unspecified"
                    const busy = adjustingUserId === player.id
                    const isPlaceholder = !!player.placeholder
                    const canRate =
                      canManage && gameActive && !isPlaceholder && !isThisHost
                    const canEditPlaceholderRow =
                      canManagePlaceholders && isPlaceholder
                    const canKick =
                      canManage &&
                      gameActive &&
                      !isThisHost &&
                      !isMe &&
                      !isPlaceholder &&
                      (isHost || !isThisCoHost)

                    return (
                      <div
                        key={player.id}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border p-3 transition-colors",
                          isPriority
                            ? "border-emerald-500/40 bg-emerald-500/10"
                            : "border-border/40 bg-secondary/20",
                        )}
                      >
                        <span className="w-5 shrink-0 text-center text-xs font-semibold text-muted-foreground tabular-nums">
                          {playerIndex + 1}
                        </span>
                        <UserAvatar
                          name={player.name}
                          avatarUrl={player.avatar_url}
                          className="w-11 h-11 flex-shrink-0"
                          fallbackClassName="text-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold truncate">
                              {player.name || `User #${player.id}`}
                            </p>
                            {isThisHost && (
                              <Badge className="bg-amber-500/20 text-amber-400 border-0 text-[10px] px-1.5">
                                Host
                              </Badge>
                            )}
                            {isThisCoHost && !isThisHost && (
                              <Badge className="bg-blue-500/20 text-blue-400 border-0 text-[10px] px-1.5">
                                Co-host
                              </Badge>
                            )}
                            {isPriority && (
                              <Badge className="bg-emerald-500/25 text-emerald-300 border-0 text-[10px] px-1.5">
                                Ưu tiên
                              </Badge>
                            )}
                            {isPlaceholder && (
                              <Badge variant="outline" className="text-[10px] px-1.5 border-muted-foreground/40">
                                Tạm
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <GenderIcon gender={gender} size="md" showLabel />
                            {tier ? (
                              <SkillBadge level={tier} size="xs" compact />
                            ) : (
                              <span className="text-[10px] text-muted-foreground">Chưa xếp hạng</span>
                            )}
                            {canRate && (
                              <button
                                type="button"
                                onClick={() => openRatingSheet(player)}
                                className="p-0.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                title="Sửa trình độ"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canEditPlaceholderRow && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openEditPlaceholder(player)}
                                  className="p-0.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                  title="Sửa người tạm"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleDeletePlaceholder(player.id, player.name)
                                  }
                                  className="p-0.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                  title="Xóa người tạm"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            {canKick && (
                              <button
                                type="button"
                                onClick={() => void handleKick(player.id, player.name)}
                                className="p-0.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                title="Xóa khỏi danh sách"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                          <span className="text-2xl font-bold tabular-nums leading-none">
                            {count}
                          </span>
                          <span className="text-[10px] text-muted-foreground">trận</span>
                          {canManage && gameActive && (
                            <div className="flex items-center gap-0.5 mt-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                disabled={busy || count <= 0 || actionLoading}
                                onClick={() => void handleAdjustPlayed(player.id, -1)}
                                aria-label={`Giảm trận ${player.name}`}
                              >
                                {busy ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Minus className="w-3.5 h-3.5" />
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="default"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                disabled={busy || actionLoading}
                                onClick={() => void handleAdjustPlayed(player.id, 1)}
                                aria-label={`Tăng trận ${player.name}`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {canManage && gameActive && (
                  <div className="pt-3 mt-3 border-t border-border/30 space-y-2">
                    {canManagePlaceholders && game.players_count < game.max_players && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full rounded-full text-xs gap-1.5"
                        onClick={openAddPlaceholder}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Thêm người tạm
                      </Button>
                    )}
                    <p className="text-[10px] text-muted-foreground text-center px-1">
                      Bút: sửa trình độ · Dấu trừ người: xóa khỏi buổi chơi (người tạm dùng thùng rác).
                    </p>
                  </div>
                )}
              </Card>
            </div>
          ) : null}
        </div>

        {game && (
          <PlaceholderPlayerSheet
            open={showPlaceholderSheet}
            onOpenChange={setShowPlaceholderSheet}
            gameId={game.id}
            player={editingPlaceholder}
            onSaved={reloadGame}
          />
        )}

        <GameRatingSheet
          open={!!ratingPlayer}
          onOpenChange={(v) => !v && setRatingPlayer(null)}
          player={ratingPlayer}
          rateTier={rateTier}
          onRateTierChange={setRateTier}
          rateStars={rateStars}
          onRateStarsChange={setRateStars}
          rateNote={rateNote}
          onRateNoteChange={setRateNote}
          rateSaving={rateSaving}
          onSave={() => void handleRatePlayer()}
        />

        {primaryAction && game && (
          <footer className="flex-shrink-0 px-4 py-3 border-t border-border/20 safe-bottom">
            <Button
              className="w-full rounded-full"
              variant={primaryAction.variant}
              disabled={primaryAction.disabled || actionLoading}
              onClick={() => void primaryAction.onClick()}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <primaryAction.icon className="w-4 h-4 mr-2" />
              )}
              {primaryAction.label}
            </Button>
          </footer>
        )}
      </DialogContent>
    </Dialog>
  )
}
