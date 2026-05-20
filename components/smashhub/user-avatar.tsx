"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { playerAvatarInitial } from "@/lib/player-display-name"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  name?: string | null
  avatarUrl?: string | null
  className?: string
  fallbackClassName?: string
}

export function UserAvatar({
  name,
  avatarUrl,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  return (
    <Avatar className={className}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name ?? "User"} /> : null}
      <AvatarFallback className={cn("bg-primary/20 text-primary font-bold", fallbackClassName)}>
        {playerAvatarInitial(name)}
      </AvatarFallback>
    </Avatar>
  )
}
