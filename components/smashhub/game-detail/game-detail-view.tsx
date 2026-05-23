"use client"

import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Swords,
  MessageCircle,
  AlertTriangle,
  Loader2,
  Crown,
  FileText,
  Wallet,
  Plus,
  Scale,
  Trash2,
  Shield,
  UserMinus,
  Share2,
  Check,
  Star,
  Pencil,
  Copy,
  Minus,
  Sun,
  Moon,
  Undo2,
  Link2,
} from "lucide-react"
import { UserAvatar } from "../user-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { SkillBadge } from "../skill-badge"
import { GenderIcon } from "../gender-icon"
import { CreateMatchSheet } from "../create-match-sheet"
import { GameMatchCard } from "../game-match-card"
import { NextMatchSuggest } from "../next-match-suggest"
import { PriorityMatchBanner } from "../priority-match-banner"
import { SuggestStickyPanel } from "../suggest-sticky-panel"
import { suggestionAnimateKey } from "@/lib/suggest-next-match"
import { PlaceholderPlayerSheet } from "../placeholder-player-sheet"
import { ScoreEntryModal } from "../score-entry-modal"
import { useAppTheme } from "@/lib/theme-provider"
import { formatPriceRange } from "@/lib/format"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { ratingToStars } from "@/lib/rating-stars"
import { generateFbPost, statusMeta } from "./meta"
import { MAX_CO_HOSTS } from "@/components/smashhub/game-detail/constants"
import type { GameDetailViewModel } from "@/components/smashhub/game-detail/use-game-detail"
import { GameEditSettingsSheet } from "@/components/smashhub/game-detail/game-edit-settings-sheet"
import { GameRatingSheet } from "@/components/smashhub/game-detail/game-rating-sheet"
import { GamePlayerPairs } from "@/components/smashhub/game-detail/game-player-pairs"
import { partnerIdFor, pairsFromGame } from "@/lib/player-pairs"

export type { GameDetailViewModel }

export function GameDetailView({ vm }: { vm: GameDetailViewModel }) {
  const { theme, setTheme } = useAppTheme()

  const {
    gameId,
    onClose,
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
    loadGame,
    isHost,
    coHostCount,
    canManage,
    canEditSettings,
    canManagePlaceholders,
    isParticipant,
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
    pendingMatches,
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
  } = vm

  const showStickySuggest =
    canPlanMatches &&
    !!(priorityMatch || showNextSuggestion || showPairArrange)
  const stickyContentKey = priorityMatch
    ? `priority-${priorityMatch.id}`
    : showNextSuggestion && nextSuggestion
      ? suggestionAnimateKey(nextSuggestion)
      : showPairArrange
        ? "pair-arrange"
        : "idle"

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

                {game.match_type === "doubles" && (
                  <GamePlayerPairs
                    game={game}
                    players={game.players}
                    canManage={canManage}
                    pairPick={pairPick}
                    pairLoading={pairTapLoading}
                    onUpdated={reloadGame}
                  />
                )}

                <div className="space-y-2">
                  {sortedPlayers.map((player) => {
                    const isThisHost = player.id === game.host?.id
                    const isThisCoHost = player.role === "co_host"
                    const isPlaceholder = !!player.placeholder
                    const isMe = player.id === currentUserId
                    const stats = playerMatchCounts[player.id]
                    const canKickThis = canManage && !isThisHost && !isMe && !isPlaceholder
                      && (isHost || !isThisCoHost)
                    const canPromoteThis = isHost && !isThisHost && !isMe && !isPlaceholder
                      && (isThisCoHost || coHostCount < MAX_CO_HOSTS)
                    const canEditPlaceholder = canManagePlaceholders && isPlaceholder
                    const gameActive = game.status !== "finished" && game.status !== "cancelled"
                    const sessionPairs = pairsFromGame(game.player_pairs)
                    const partnerId = partnerIdFor(player.id, sessionPairs)
                    const partnerName = partnerId
                      ? game.players.find((p) => p.id === partnerId)?.name
                      : null
                    const isPairPickTarget = pairPick === player.id
                    return (
                      <div
                        key={player.id}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-1 -mx-1",
                          isPairPickTarget && "ring-1 ring-primary/50 bg-primary/5",
                        )}
                      >
                        <div className="relative flex-shrink-0">
                          <UserAvatar
                            name={player.name}
                            avatarUrl={player.avatar_url}
                            className="w-9 h-9"
                            fallbackClassName="text-xs"
                          />
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
                            {partnerName && (
                              <span className="text-[10px] text-primary font-normal ml-1">
                                <Link2 className="inline w-3 h-3 mr-0.5" />
                                {partnerName}
                              </span>
                            )}
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
                            {stats != null && (
                              <span className="text-[11px] font-bold tabular-nums">
                                <span
                                  className={
                                    maxPlayed > 0 && stats.played < maxPlayed
                                      ? "text-emerald-400"
                                      : "text-foreground"
                                  }
                                >
                                  {stats.played} trận
                                </span>
                                {canManage && stats.wins > 0 && (
                                  <span className="text-emerald-400 font-semibold"> {stats.wins}W</span>
                                )}
                                {canManage && stats.losses > 0 && (
                                  <span className="text-red-400 font-semibold"> {stats.losses}L</span>
                                )}
                              </span>
                            )}
                          </div>
                          {gameActive &&
                            canManage &&
                            game.match_type === "doubles" &&
                            !partnerId &&
                            onPlayerPairTap && (
                              <button
                                type="button"
                                onClick={() => onPlayerPairTap(player.id)}
                                className="p-1 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                title="Ghép cặp"
                              >
                                <Link2 className="w-3.5 h-3.5" />
                              </button>
                            )}
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
                  className={`min-w-0 p-0 gap-0 rounded-2xl border-border/50 ${isGameTime || canPlanMatches ? "order-1" : "order-20"}`}
                >
                  <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Swords className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm font-semibold">Các trận đấu</span>
                      {totalMatchCount > 0 && (
                        <Badge variant="secondary" className="rounded-full text-[10px]">
                          {totalMatchCount}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
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
                  </div>

                  {canPlanMatches ? (
                    <div
                      className={cn(
                        "sticky top-0 z-20 px-4 bg-card/95 backdrop-blur-sm transition-[border-color,padding-bottom] duration-300 ease-out",
                        showStickySuggest
                          ? "pb-2 border-b border-border/30"
                          : "pb-0 border-b border-transparent",
                      )}
                    >
                      <SuggestStickyPanel open={showStickySuggest}>
                        <div key={stickyContentKey} className="animate-suggest-enter">
                          {priorityMatch ? (
                            <PriorityMatchBanner
                              match={priorityMatch}
                              reason={priorityReason}
                              canStart={priorityCanStart}
                              loading={
                                startingMatchId === priorityMatch.id ||
                                suggestActionLoading
                              }
                              onStart={() => void handleStartMatch(priorityMatch.id)}
                            />
                          ) : null}
                          {(showNextSuggestion && nextSuggestion) || showPairArrange ? (
                            <NextMatchSuggest
                              suggestion={showNextSuggestion ? nextSuggestion : null}
                              isGameTime={isGameTime}
                              loading={suggestActionLoading || startingMatchId != null}
                              batchLoading={batchLoading}
                              showBatchActions={pendingMatches.length <= 2}
                              showPairArrange={showPairArrange}
                              pairArrangeHint={pairArrangeHint}
                              pairArrangeDisabled={pairArrangeDisabled}
                              pairArrangeLoading={pairArrangeLoading}
                              onArrangePair={() => void handleArrangePairMatch()}
                              onStart={handleStartSuggested}
                              onCreateAndStart={handleCreateAndStartSuggested}
                              onQueue={handleQueueSuggested}
                              onGenerateBatch={() => void handleGenerateBatch(10)}
                            />
                          ) : null}
                        </div>
                      </SuggestStickyPanel>
                    </div>
                  ) : null}

                  {totalMatchCount > 0 && (
                    <div className="flex gap-1 mx-4 mb-2 p-0.5 rounded-lg bg-secondary/30">
                      {(
                        [
                          { id: "live" as const, label: "Đang đấu", count: tabMatchCounts.ongoing },
                          { id: "queue" as const, label: "Chờ", count: tabMatchCounts.pending },
                          { id: "done" as const, label: "Xong", count: tabMatchCounts.finished },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setMatchTab(tab.id)}
                          className={cn(
                            "flex-1 rounded-md py-1.5 text-[11px] font-medium transition-colors",
                            matchTab === tab.id
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {tab.label}
                          {tab.count > 0 ? ` (${tab.count})` : ""}
                        </button>
                      ))}
                    </div>
                  )}

                  {canManage && matchTab === "queue" && pendingMatches.length > 0 && (
                    <div className="px-4 pb-2 flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => void handleDeleteAllPending()}
                        disabled={deletingAllPending || deletingMatchId != null}
                      >
                        {deletingAllPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        Xóa tất cả ({pendingMatches.length})
                      </Button>
                    </div>
                  )}

                  <div
                    className={cn(
                      "px-4 pb-4",
                      matchListScrollable &&
                        "max-h-[min(50vh,22rem)] overflow-y-auto overscroll-contain",
                    )}
                  >
                  {totalMatchCount === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Chưa có trận đấu nào. Host có thể tạo trận mới hoặc xếp hàng loạt.
                    </p>
                  ) : showTabListLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : tabMatches.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      {matchTab === "live"
                        ? "Chưa có trận đang đấu."
                        : matchTab === "queue"
                          ? tabMatchCounts.pending > 0
                            ? "Đang tải hàng chờ…"
                            : "Hàng chờ trống — dùng gợi ý hoặc Xếp 10 trận."
                          : tabMatchCounts.finished > 0
                            ? "Đang tải trận đã xong…"
                            : "Chưa có trận đã kết thúc."}
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {visibleTabMatches.map((match) => (
                        <GameMatchCard
                          key={match.id}
                          match={match}
                          game={game}
                          canManage={canManage}
                          isGameTime={isGameTime}
                          isParticipant={isParticipant}
                          startingMatchId={startingMatchId}
                          deletingMatchId={deletingMatchId}
                          onStartMatch={handleStartMatch}
                          onTapWinner={handleTapWinner}
                          onOpenScoreEntry={setFinishingMatch}
                          finishingMatchId={finishingMatchId}
                          onEdit={openEditMatch}
                          onDelete={handleDeleteMatch}
                          highlighted={suggestedMatchId === match.id}
                          allMatches={game.matches ?? []}
                          busyPlayerIds={busyPlayerIds}
                          onTogglePriority={canManage ? handleTogglePriority : undefined}
                          togglingPriorityId={togglingPriorityId}
                        />
                      ))}
                    </div>
                  )}
                  </div>
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

        {pendingUndo && (
          <div className="flex-shrink-0 px-4 pb-2 z-[60]">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/40 bg-primary/10 px-3 py-2.5 shadow-md">
              <p className="text-sm font-medium text-foreground">
                <span className="text-primary font-semibold">{pendingUndo.label}</span> thắng
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full h-8 shrink-0 border-primary/50 text-primary hover:bg-primary/15"
                onClick={() => void handleUndoFinish(pendingUndo.matchId)}
              >
                <Undo2 className="w-3.5 h-3.5 mr-1" />
                Hoàn tác
              </Button>
            </div>
          </div>
        )}

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
          onSaved={() => loadGame(game.id)}
        />
      )}

      <GameEditSettingsSheet
        open={showEditSettings}
        onOpenChange={setShowEditSettings}
        courtOptions={COURT_OPTIONS}
        editCourts={editCourts}
        editMaxPlayers={editMaxPlayers}
        onEditMaxPlayersChange={setEditMaxPlayers}
        game={game}
        settingsError={settingsError}
        settingsSaving={settingsSaving}
        onToggleCourt={toggleEditCourt}
        onSave={handleSaveSettings}
      />

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
        onSave={handleRatePlayer}
      />
    </Dialog>
  )
}
