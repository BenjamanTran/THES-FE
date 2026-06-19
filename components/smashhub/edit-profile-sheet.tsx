"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
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
import type { Gender, SkillRadarAxisKey, SkillScores, Tier } from "@/lib/api"
import { SKILL_LABELS, type SkillLevel } from "./skill-badge"
import { computedStarsFromScores, overallScoreFromScores, scoresFromRadar } from "@/lib/skill-radar"
import { formatStars, StarRating } from "./star-rating"
import { InteractiveSkillRadar } from "./profile/interactive-skill-radar"

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
  const { user, updateProfile, updateSkillProfile } = useAuth()
  const [name, setName] = useState(user?.name ?? "")
  const [phone, setPhone] = useState(user?.phone ?? "")
  const [gender, setGender] = useState<Gender>(user?.gender ?? "unspecified")
  const [skillScores, setSkillScores] = useState<SkillScores>(() =>
    scoresFromRadar(user?.profile?.skill_radar?.axes),
  )
  const [tier, setTier] = useState<Tier>(
    user?.profile?.skill_radar?.declared_tier ?? user?.declared_rank?.tier ?? user?.rank?.tier ?? "newbie",
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const computedStars = computedStarsFromScores(skillScores)
  const overallScore = overallScoreFromScores(skillScores)

  // Reset local state whenever the sheet is reopened.
  const handleOpenChange = (next: boolean) => {
    if (next && user) {
      setName(user.name)
      setPhone(user.phone ?? "")
      setGender(user.gender ?? "unspecified")
      setSkillScores(scoresFromRadar(user.profile?.skill_radar?.axes))
      setTier(user.profile?.skill_radar?.declared_tier ?? user.declared_rank?.tier ?? user.rank?.tier ?? "newbie")
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
      })
      await updateSkillProfile({ tier, scores: skillScores })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cập nhật thất bại")
    } finally {
      setSubmitting(false)
    }
  }

  const setSkillScore = (key: SkillRadarAxisKey, score: number) => {
    setSkillScores((current) => ({
      ...current,
      [key]: Math.min(10, Math.max(1, score)),
    }))
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

          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Trình độ tự đánh giá</Label>
                <span className="text-[11px] text-muted-foreground">
                  Sao tự tính: {formatStars(computedStars)}/5
                </span>
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
            </div>

            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs">Tự đánh giá kỹ năng</Label>
              <div className="text-right text-[11px] text-muted-foreground">
                <div>Trung bình: {overallScore.toFixed(1)}/10</div>
                <div>Số sao: {formatStars(computedStars)}/5</div>
              </div>
            </div>
            <StarRating value={computedStars} sizeClassName="h-4 w-4" showValue />
            <div className="rounded-2xl border border-border/50 bg-secondary/20 px-2 py-3">
              <InteractiveSkillRadar
                scores={skillScores}
                onChange={setSkillScore}
                disabled={submitting}
              />
            </div>
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
