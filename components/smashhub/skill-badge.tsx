"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type SkillLevel =
  | "newbie"
  | "beginner_plus"
  | "lower_intermediate"
  | "intermediate"
  | "upper_intermediate"
  | "advanced"
  | "semi_pro"
  | "professional"

export const SKILL_LABELS: Record<SkillLevel, string> = {
  newbie: "Newbie",
  beginner_plus: "Yếu +",
  lower_intermediate: "Trung bình yếu",
  intermediate: "Trung bình -",
  upper_intermediate: "Trung bình +",
  advanced: "Khá",
  semi_pro: "Bán chuyên",
  professional: "Chuyên nghiệp",
}

interface SkillBadgeProps {
  level: string
  size?: "xs" | "sm" | "md"
  showIcon?: boolean
}

const skillColors: Record<string, { bg: string; text: string; border: string }> = {
  newbie: { bg: "bg-gray-500/20", text: "text-gray-400", border: "border-gray-500/30" },
  beginner_plus: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30" },
  lower_intermediate: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
  intermediate: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
  upper_intermediate: { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30" },
  advanced: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" },
  semi_pro: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
  professional: { bg: "bg-primary/20", text: "text-primary", border: "border-primary/30" },
}

const skillIcons: Record<string, string> = {
  newbie: "🌱",
  beginner_plus: "🎾",
  lower_intermediate: "🏸",
  intermediate: "🏸",
  upper_intermediate: "🏸",
  advanced: "⚡",
  semi_pro: "🔥",
  professional: "👑",
}

export function SkillBadge({ level, size = "md", showIcon = true }: SkillBadgeProps) {
  const colors = skillColors[level] || skillColors["newbie"]
  const icon = skillIcons[level] || "🏸"
  const label = SKILL_LABELS[level as SkillLevel] || level
  
  const sizeClasses = {
    xs: "text-[10px] px-1.5 py-0 h-5",
    sm: "text-xs px-2 py-0.5 h-6",
    md: "text-sm px-3 py-1 h-7",
  }

  return (
    <Badge 
      variant="outline"
      className={cn(
        colors.bg,
        colors.text,
        colors.border,
        sizeClasses[size],
        "font-semibold border rounded-full"
      )}
    >
      {showIcon && <span className="mr-1">{icon}</span>}
      {label}
    </Badge>
  )
}
