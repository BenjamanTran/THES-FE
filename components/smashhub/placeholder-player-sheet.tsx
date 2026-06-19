"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { SKILL_LABELS, type SkillLevel } from "./skill-badge"
import { StarRating, formatStars } from "./star-rating"
import {
  createPlaceholder,
  updatePlaceholder,
  type GamePlayer,
  type Gender,
  type Tier,
} from "@/lib/api"

const GENDER_OPTIONS: Array<{ value: Gender; label: string }> = [
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "other", label: "Khác" },
]

const TIER_ORDER: Tier[] = [
  "newbie",
  "beginner_plus",
  "lower_intermediate",
  "intermediate",
  "upper_intermediate",
  "advanced",
  "semi_pro",
  "professional",
]

interface PlaceholderPlayerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameId: number
  player: GamePlayer | null
  onSaved: () => void
}

export function PlaceholderPlayerSheet({
  open,
  onOpenChange,
  gameId,
  player,
  onSaved,
}: PlaceholderPlayerSheetProps) {
  const isEdit = player != null
  const [name, setName] = useState("")
  const [gender, setGender] = useState<Gender>("male")
  const [tier, setTier] = useState<Tier>("intermediate")
  const [stars, setStars] = useState(2.5)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(player?.name || "")
    setGender((player?.gender as Gender) || "male")
    if (!player) {
      setTier("intermediate")
      setStars(2.5)
    }
    setError(null)
  }, [open, player])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    setSaving(true)
    setError(null)
    try {
      if (isEdit && player) {
        await updatePlaceholder(gameId, player.id, { name: trimmed, gender })
      } else {
        await createPlaceholder(gameId, { name: trimmed, gender, tier, stars })
      }
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
          <SheetTitle className="text-base">
            {isEdit ? "Sửa thông tin" : "Thêm người"}
          </SheetTitle>
        </SheetHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-4 pb-6">
          <div className="space-y-1.5">
            <Label htmlFor="ph-name" className="text-xs">
              Tên hiển thị
            </Label>
            <Input
              id="ph-name"
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Bạn Minh"
              className="rounded-xl"
            />
          </div>

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

          {!isEdit && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Trình độ</Label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {TIER_ORDER.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTier(t)}
                      className={
                        "py-2 rounded-xl text-xs font-medium border transition-colors text-left px-3 " +
                        (tier === t
                          ? "bg-primary/15 text-primary border-primary/50"
                          : "bg-secondary/50 text-foreground border-border hover:bg-secondary")
                      }
                    >
                      {SKILL_LABELS[t as SkillLevel] || t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="ph-stars" className="text-xs">Số sao</Label>
                  <StarRating value={stars} sizeClassName="h-4 w-4" showValue />
                </div>
                <Input
                  id="ph-stars"
                  type="range"
                  min={0.5}
                  max={5}
                  step={0.5}
                  value={stars}
                  onChange={(e) => setStars(Number(e.target.value))}
                  aria-label={`Số sao ${formatStars(stars)}`}
                  className="h-2 cursor-pointer rounded-full p-0 accent-amber-400"
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button type="submit" className="w-full rounded-full" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isEdit ? "Lưu thay đổi" : "Thêm vào danh sách"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
