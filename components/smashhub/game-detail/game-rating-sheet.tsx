"use client"

import { Loader2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { SkillBadge, SKILL_LABELS, type SkillLevel } from "../skill-badge"
import type { GamePlayer, Tier } from "@/lib/api"
import { ratingToStars } from "@/lib/rating-stars"

interface GameRatingSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  player: GamePlayer | null
  rateTier: Tier
  onRateTierChange: (tier: Tier) => void
  rateStars: number
  onRateStarsChange: (stars: number) => void
  rateNote: string
  onRateNoteChange: (note: string) => void
  rateSaving: boolean
  onSave: () => void
}

export function GameRatingSheet({
  open,
  onOpenChange,
  player,
  rateTier,
  onRateTierChange,
  rateStars,
  onRateStarsChange,
  rateNote,
  onRateNoteChange,
  rateSaving,
  onSave,
}: GameRatingSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-w-md mx-auto">
        <SheetHeader>
          <SheetTitle className="text-base">
            Đánh giá trình độ – {player?.name || ""}
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-4 pt-4 pb-6">
          {player?.declared_rank && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Tự khai:</span>
              <SkillBadge level={player.declared_rank.tier} size="xs" compact />
              <span className="flex items-center gap-0.5 text-amber-400">
                {ratingToStars(player.declared_rank.tier, player.declared_rank.rating)}
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Trình độ thực tế</Label>
            <Select value={rateTier} onValueChange={(v) => onRateTierChange(v as Tier)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(SKILL_LABELS) as [SkillLevel, string][]).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
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
                  onClick={() => onRateStarsChange(s)}
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
              onChange={(e) => onRateNoteChange(e.target.value)}
              maxLength={200}
              placeholder="VD: Chơi tốt hơn trình tự khai…"
              className="rounded-xl text-sm"
            />
          </div>

          <Button className="w-full rounded-full" onClick={onSave} disabled={rateSaving}>
            {rateSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Lưu đánh giá
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
