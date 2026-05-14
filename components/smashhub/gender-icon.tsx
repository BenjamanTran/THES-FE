"use client"

import { Mars, Venus, Transgender, PersonStanding, type LucideProps } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Gender } from "@/lib/api"

const genderConfig: Record<Gender, { Icon: React.FC<LucideProps>; className: string; label: string }> = {
  male: { Icon: Mars, className: "text-blue-400", label: "Nam" },
  female: { Icon: Venus, className: "text-pink-400", label: "Nữ" },
  other: { Icon: Transgender, className: "text-purple-400", label: "Khác" },
  unspecified: { Icon: PersonStanding, className: "text-muted-foreground", label: "Chưa rõ" },
}

interface GenderIconProps {
  gender: Gender
  size?: "sm" | "md"
  showLabel?: boolean
  className?: string
}

export function GenderIcon({ gender, size = "sm", showLabel = false, className }: GenderIconProps) {
  const config = genderConfig[gender] ?? genderConfig.unspecified
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"

  return (
    <span className={cn("inline-flex items-center gap-1", className)} title={config.label}>
      <config.Icon className={cn(iconSize, config.className)} />
      {showLabel && (
        <span className={cn("text-xs", config.className)}>{config.label}</span>
      )}
    </span>
  )
}
