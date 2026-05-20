"use client"

import { Edit2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SkillBadge } from "../skill-badge"
import { ratingToStars } from "@/lib/rating-stars"
import type { AuthUser } from "@/lib/api"
import { userStatsMock } from "./mock-data"

function avatarFallback(name: string | null | undefined): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  const last = parts[parts.length - 1] || name
  return last.charAt(0).toUpperCase()
}

interface ProfileHeaderProps {
  user: AuthUser
  onEdit: () => void
}

export function ProfileHeader({ user, onEdit }: ProfileHeaderProps) {
  const userStats = { ...userStatsMock, name: user.name, email: user.email }
  const declaredRank = user.declared_rank ?? user.rank

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20 ring-4 ring-primary/30">
                <AvatarImage src={userStats.avatar} alt={userStats.name} />
                <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                  {avatarFallback(userStats.name)}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full shadow-md"
                onClick={onEdit}
                aria-label="Chỉnh sửa hồ sơ"
              >
                <Edit2 className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold mb-1 truncate">{userStats.name}</h2>
              {userStats.email && (
                <p className="text-xs text-muted-foreground mb-2 truncate">{userStats.email}</p>
              )}
              {declaredRank ? (
                <>
                  <SkillBadge level={declaredRank.tier} size="sm" />
                  <div className="flex items-center gap-1.5 mt-1">
                    <p className="text-[11px] text-muted-foreground">{declaredRank.display_name}</p>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= ratingToStars(declaredRank.tier, declaredRank.rating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-[11px] text-muted-foreground italic">
                  Chưa khai báo trình độ
                </p>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full mt-2 -ml-2 h-7 px-3 text-xs text-primary"
                onClick={onEdit}
              >
                <Edit2 className="w-3 h-3 mr-1.5" />
                Chỉnh sửa hồ sơ
              </Button>
            </div>
          </div>
    </div>
  )
}
