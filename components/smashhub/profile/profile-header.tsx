"use client"

import { Camera, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "../user-avatar"
import { SkillBadge } from "../skill-badge"
import { ratingToStars } from "@/lib/rating-stars"
import type { AuthUser } from "@/lib/api"
import { StarRating } from "../star-rating"

interface ProfileHeaderProps {
  user: AuthUser
  onEdit: () => void
  onEditAvatar: () => void
}

export function ProfileHeader({ user, onEdit, onEditAvatar }: ProfileHeaderProps) {
  const declaredRank = user.declared_rank ?? user.rank

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-start gap-4">
        <div className="relative">
          <UserAvatar
            name={user.name}
            avatarUrl={user.avatar_url}
            className="w-20 h-20 ring-4 ring-primary/30"
            fallbackClassName="text-2xl"
          />
          <Button
            size="icon"
            variant="secondary"
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full shadow-md"
            onClick={onEditAvatar}
            aria-label="Đổi ảnh đại diện"
          >
            <Camera className="w-3 h-3" />
          </Button>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold mb-1 truncate">{user.name}</h2>
          {user.email && (
            <p className="text-xs text-muted-foreground mb-2 truncate">{user.email}</p>
          )}
          {declaredRank ? (
            <>
              <SkillBadge level={declaredRank.tier} size="sm" />
              <div className="flex items-center gap-1.5 mt-1">
                <p className="text-[11px] text-muted-foreground">{declaredRank.display_name}</p>
                <StarRating value={ratingToStars(declaredRank.tier, declaredRank.rating)} sizeClassName="h-3 w-3" />
              </div>
            </>
          ) : (
            <p className="text-[11px] text-muted-foreground italic">Chưa khai báo trình độ</p>
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
