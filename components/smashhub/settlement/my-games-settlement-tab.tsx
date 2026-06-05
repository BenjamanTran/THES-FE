"use client"

import { Clock, MapPin, Wallet } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Game } from "@/lib/api"

interface MyGamesSettlementTabProps {
  games: Game[]
  userId: number
  onOpenSettlement: (gameId: number) => void
}

function formatTime(game: Game) {
  const start = new Date(game.start_time)
  return {
    date: format(start, "EEE, dd/MM", { locale: vi }),
    time: format(start, "HH:mm"),
  }
}

function statusMeta(status: Game["status"]) {
  switch (status) {
    case "ongoing":
      return { label: "Đang diễn ra", className: "bg-amber-500/20 text-amber-400" }
    case "finished":
      return { label: "Đã kết thúc", className: "bg-neutral-500/20 text-neutral-300" }
    case "open":
      return { label: "Đang mở", className: "bg-emerald-500/20 text-emerald-400" }
    case "full":
      return { label: "Đã đầy", className: "bg-blue-500/20 text-blue-400" }
    default:
      return { label: status, className: "bg-muted text-muted-foreground" }
  }
}

export function MyGamesSettlementTab({
  games,
  userId,
  onOpenSettlement,
}: MyGamesSettlementTabProps) {
  const eligible = games.filter(
    (g) =>
      g.status === "ongoing" ||
      g.status === "finished" ||
      g.status === "open" ||
      g.status === "full",
  )

  if (eligible.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <Wallet className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Chưa có buổi nào để tính tiền. Mở tab Trận để xem các buổi sắp tới.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 animate-stagger">
      <p className="text-[11px] text-muted-foreground px-0.5">
        Quyết toán chi phí buổi đấu — tách khỏi chi tiết trận, không bị làm mới liên tục.
      </p>
      {eligible.map((game) => {
        const { date, time } = formatTime(game)
        const isHost = game.host?.id === userId
        const status = statusMeta(game.status)
        return (
          <Card
            key={game.id}
            className="p-4 rounded-2xl border-border/50 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold text-sm truncate">
                    {game.title || `Game #${game.id}`}
                  </h3>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${status.className}`}>
                    {status.label}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {isHost ? "Bạn host" : "Tham gia"}
                  {game.host?.name ? ` · ${game.host.name}` : ""}
                </p>
                {game.location && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1.5">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{game.location}</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {date} · {time}
                </p>
              </div>
              <Button
                size="sm"
                className="rounded-full text-xs h-8 px-3 shrink-0"
                onClick={() => onOpenSettlement(game.id)}
              >
                <Wallet className="w-3.5 h-3.5 mr-1" />
                {isHost ? "Tính tiền" : "Xem"}
              </Button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
