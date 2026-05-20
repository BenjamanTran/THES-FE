"use client"

import { format } from "date-fns"
import { Clock, MapPin, Users, Swords, X, ChevronRight, Wallet } from "lucide-react"
import { formatPriceRange } from "@/lib/format"
import { tierLabel, type GameGroup } from "./utils"

interface MapGroupBottomSheetProps {
  group: GameGroup
  onClose: () => void
  onOpenGame?: (id: number) => void
}

export function MapGroupBottomSheet({ group, onClose, onOpenGame }: MapGroupBottomSheetProps) {
  return (
    <div className="absolute bottom-4 left-4 right-4 z-10">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-border/30 overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border/30">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
              <h3 className="font-bold text-sm truncate">
                {group.games[0]?.location || 'Địa điểm này'}
              </h3>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {group.games.length} trận đấu
              {' · '}
              {group.lat.toFixed(5)}, {group.lng.toFixed(5)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[60dvh] overflow-y-auto divide-y divide-border/30">
          {group.games.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => onOpenGame?.(g.id)}
              className="w-full text-left p-3 hover:bg-secondary/40 transition-colors flex gap-3 items-start"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  g.match_type === 'doubles' ? 'bg-orange-500/15' : 'bg-blue-500/15'
                }`}
              >
                <span className="text-base">🏸</span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">
                    {g.match_type === 'singles' ? 'Đơn (1v1)' : 'Đôi (2v2)'}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                      g.status === 'open'
                        ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                        : g.status === 'full'
                          ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                          : 'bg-neutral-500/20 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {g.status === 'open'
                      ? 'Đang mở'
                      : g.status === 'full'
                        ? 'Đã đầy'
                        : g.status === 'ongoing'
                          ? 'Đang diễn ra'
                          : g.status === 'finished'
                            ? 'Đã kết thúc'
                            : 'Đã huỷ'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(g.start_time), 'HH:mm dd/MM')} – {format(new Date(g.end_time), 'HH:mm')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {g.players_count}/{g.max_players}
                  </span>
                  <span className="flex items-center gap-1">
                    <Swords className="w-3 h-3" />
                    {tierLabel(g.min_tier)}
                    {g.max_tier && g.max_tier !== g.min_tier ? ` – ${tierLabel(g.max_tier)}` : ''}
                  </span>
                  {(g.min_price > 0 || g.max_price > 0) && (
                    <span className="flex items-center gap-1">
                      <Wallet className="w-3 h-3" />
                      {formatPriceRange(g.min_price ?? 0, g.max_price ?? 0)}
                    </span>
                  )}
                </div>

                {g.host?.name && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Host: <span className="text-foreground font-medium">{g.host.name}</span>
                  </p>
                )}
              </div>

              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
