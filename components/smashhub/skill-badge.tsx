"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type SkillLevel = 
  | "Newbie" 
  | "Yếu" 
  | "Yếu +" 
  | "Trung bình yếu" 
  | "Trung bình -" 
  | "Trung bình +" 
  | "Khá" 
  | "Bán chuyên" 
  | "Chuyên nghiệp"

interface SkillBadgeProps {
  level: string
  size?: "xs" | "sm" | "md"
  showIcon?: boolean
}

const skillColors: Record<string, { bg: string; text: string; border: string }> = {
  "Newbie": { bg: "bg-gray-500/20", text: "text-gray-400", border: "border-gray-500/30" },
  "Yếu": { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30" },
  "Yếu +": { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30" },
  "Trung bình yếu": { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
  "Trung bình -": { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
  "Trung bình +": { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30" },
  "Khá": { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" },
  "Bán chuyên": { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
  "Chuyên nghiệp": { bg: "bg-primary/20", text: "text-primary", border: "border-primary/30" },
}

const skillIcons: Record<string, string> = {
  "Newbie": "🌱",
  "Yếu": "🎾",
  "Yếu +": "🎾",
  "Trung bình yếu": "🏸",
  "Trung bình -": "🏸",
  "Trung bình +": "🏸",
  "Khá": "⚡",
  "Bán chuyên": "🔥",
  "Chuyên nghiệp": "👑",
}

export function SkillBadge({ level, size = "md", showIcon = true }: SkillBadgeProps) {
  const colors = skillColors[level] || skillColors["Newbie"]
  const icon = skillIcons[level] || "🏸"
  
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
      {level}
    </Badge>
  )
}
