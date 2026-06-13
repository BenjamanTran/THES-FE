"use client"

import { Loader2, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { GameDetail } from "@/lib/api"

interface GameEditSettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courtOptions: number[]
  editCourts: number[]
  editMaxPlayers: number
  editStartTime: string
  editEndTime: string
  onEditStartTimeChange: (value: string) => void
  onEditEndTimeChange: (value: string) => void
  onEditMaxPlayersChange: (value: number | ((prev: number) => number)) => void
  game: GameDetail | null
  settingsError: string | null
  settingsSaving: boolean
  onToggleCourt: (court: number) => void
  onSave: () => void
}

export function GameEditSettingsSheet({
  open,
  onOpenChange,
  courtOptions,
  editCourts,
  editMaxPlayers,
  editStartTime,
  editEndTime,
  onEditStartTimeChange,
  onEditEndTimeChange,
  onEditMaxPlayersChange,
  game,
  settingsError,
  settingsSaving,
  onToggleCourt,
  onSave,
}: GameEditSettingsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-w-md mx-auto">
        <SheetHeader>
          <SheetTitle className="text-base">Sửa giờ, sân & số người</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 pt-4 pb-6">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Thời gian chơi</Label>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="game-start-time" className="text-[10px] text-muted-foreground">
                  Bắt đầu
                </Label>
                <Input
                  id="game-start-time"
                  type="datetime-local"
                  value={editStartTime}
                  onChange={(e) => onEditStartTimeChange(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="game-end-time" className="text-[10px] text-muted-foreground">
                  Kết thúc
                </Label>
                <Input
                  id="game-end-time"
                  type="datetime-local"
                  value={editEndTime}
                  onChange={(e) => onEditEndTimeChange(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Chọn sân (bấm để bật/tắt)</Label>
            <div className="grid grid-cols-4 gap-2">
              {courtOptions.map((court) => {
                const selected = editCourts.includes(court)
                return (
                  <Button
                    key={court}
                    type="button"
                    variant={selected ? "default" : "outline"}
                    size="sm"
                    className="rounded-xl h-9 text-xs"
                    onClick={() => onToggleCourt(court)}
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
                  onEditMaxPlayersChange((n) => Math.max(game?.players_count ?? 2, n - 1))
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
                onClick={() => onEditMaxPlayersChange((n) => n + 1)}
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
            onClick={onSave}
            disabled={settingsSaving || editCourts.length === 0}
          >
            {settingsSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Lưu thay đổi
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
