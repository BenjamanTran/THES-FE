"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { updatePlayerGender, type GamePlayer, type Gender } from "@/lib/api"

const GENDER_OPTIONS: Array<{ value: Gender; label: string }> = [
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "other", label: "Khác" },
]

interface PlayerGenderSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameId: number
  player: GamePlayer | null
  onSaved: () => void
}

export function PlayerGenderSheet({
  open,
  onOpenChange,
  gameId,
  player,
  onSaved,
}: PlayerGenderSheetProps) {
  const [gender, setGender] = useState<Gender>("male")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !player) return
    setGender((player.gender as Gender) || "male")
    setError(null)
  }, [open, player])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!player) return

    setSaving(true)
    setError(null)
    try {
      await updatePlayerGender(gameId, { user_id: player.id, gender })
      onSaved()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-w-md mx-auto">
        <SheetHeader>
          <SheetTitle className="text-base">Sửa giới tính</SheetTitle>
          {player?.name && (
            <p className="text-xs text-muted-foreground text-left">{player.name}</p>
          )}
        </SheetHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-4 pb-6">
          <div className="space-y-1.5">
            <Label className="text-xs">Giới tính</Label>
            <div className="grid grid-cols-3 gap-2">
              {GENDER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGender(opt.value)}
                  className={
                    "py-2 rounded-xl text-xs font-medium border transition-colors " +
                    (gender === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/50 text-foreground border-border hover:bg-secondary")
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button type="submit" className="w-full rounded-full" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Lưu thay đổi
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
