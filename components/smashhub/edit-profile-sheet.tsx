"use client"

import { useState } from "react"
import { Loader2, Star } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { SKILL_LABELS, type SkillLevel } from "./skill-badge"
import type { Gender, Tier } from "@/lib/api"
import { ratingToStars } from "@/lib/rating-stars"

interface EditProfileSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const GENDER_OPTIONS: Array<{ value: Gender; label: string }> = [
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "other", label: "Khác" },
  { value: "unspecified", label: "Chưa rõ" },
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

export function EditProfileSheet({ open, onOpenChange }: EditProfileSheetProps) {
  const { user, updateProfile } = useAuth()
  const [name, setName] = useState(user?.name ?? "")
  const [phone, setPhone] = useState(user?.phone ?? "")
  const [gender, setGender] = useState<Gender>(user?.gender ?? "unspecified")
  const [tier, setTier] = useState<Tier>(user?.rank?.tier ?? "newbie")
  const [stars, setStars] = useState(() => {
    const r = user?.rank
    return r ? ratingToStars(r.tier, r.rating) : 3
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset local state whenever the sheet is reopened.
  const handleOpenChange = (next: boolean) => {
    if (next && user) {
      setName(user.name)
      setPhone(user.phone ?? "")
      setGender(user.gender ?? "unspecified")
      setTier(user.rank?.tier ?? "newbie")
      setStars(user.rank ? ratingToStars(user.rank.tier, user.rank.rating) : 3)
      setError(null)
    }
    onOpenChange(next)
  }

  if (!user) return null

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await updateProfile({
        name: name.trim(),
        gender,
        phone: phone.trim(),
        tier,
        stars,
      })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cập nhật thất bại")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-4 sm:px-6 max-h-[92dvh] overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle>Thông tin cá nhân</SheetTitle>
          <SheetDescription>
            Cập nhật thông tin để người chơi khác hiểu rõ hơn về bạn.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="space-y-5 pb-6">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name" className="text-xs">
              Tên hiển thị
            </Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              required
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Giới tính</Label>
            <div className="grid grid-cols-4 gap-2">
              {GENDER_OPTIONS.map((opt) => {
                const active = gender === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setGender(opt.value)}
                    className={
                      "py-2 rounded-xl text-xs font-medium border transition-colors " +
                      (active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/50 text-foreground border-border hover:bg-secondary")
                    }
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profile-phone" className="text-xs">
              Số điện thoại
            </Label>
            <Input
              id="profile-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="VD: 0987 123 456"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Trình độ tự đánh giá</Label>
              {user.rank && (
                <span className="text-[11px] text-muted-foreground">
                  Hiện tại: {user.rank.display_name}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TIER_ORDER.map((t) => {
                const active = tier === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTier(t)}
                    className={
                      "py-2 rounded-xl text-xs font-medium border transition-colors text-left px-3 " +
                      (active
                        ? "bg-primary/15 text-primary border-primary/50"
                        : "bg-secondary/50 text-foreground border-border hover:bg-secondary")
                    }
                  >
                    {SKILL_LABELS[t as SkillLevel] || t}
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Hệ thống sẽ tự điều chỉnh điểm rating theo trận đấu bạn tham gia.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Tự đánh giá (sao)</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStars(s)}
                  className="p-1 transition-colors"
                >
                  <Star
                    className={`w-6 h-6 ${
                      s <= stars
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              1 sao = mới lên, 5 sao = sắp lên tier trên.
            </p>
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-full"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Huỷ
            </Button>
            <Button type="submit" className="flex-1 rounded-full" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
