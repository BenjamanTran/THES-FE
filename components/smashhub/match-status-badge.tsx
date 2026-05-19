"use client"

import { Clock, Play, CheckCircle2, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { MatchSummary } from "@/lib/api"

export type MatchDisplayStatus = MatchSummary["status"]

export function getMatchStatusMeta(status: MatchDisplayStatus, hasWinner?: boolean) {
  if (status === "finished" && hasWinner) {
    return {
      label: "Thắng",
      Icon: Trophy,
      badgeClass: "bg-amber-500/25 text-amber-300 border-amber-500/50",
      cardClass: "border-l-4 border-l-amber-500 border-amber-500/30 bg-amber-500/10",
    }
  }
  switch (status) {
    case "ongoing":
      return {
        label: "Đang chơi",
        Icon: Play,
        badgeClass: "bg-primary/25 text-primary border-primary/50",
        cardClass: "border-l-4 border-l-primary border-primary/40 bg-primary/10 match-playing-pulse",
      }
    case "finished":
      return {
        label: "Kết thúc",
        Icon: CheckCircle2,
        badgeClass: "bg-muted text-foreground border-border",
        cardClass: "border-l-4 border-l-muted-foreground/40 border-border/50 bg-secondary/40",
      }
    default:
      return {
        label: "Chờ",
        Icon: Clock,
        badgeClass: "bg-slate-500/25 text-slate-200 border-slate-400/40",
        cardClass: "border-l-4 border-l-slate-400 border-slate-500/30 bg-slate-500/5",
      }
  }
}

export function MatchStatusBadge({
  status,
  hasWinner,
  compact,
  className,
}: {
  status: MatchDisplayStatus
  hasWinner?: boolean
  compact?: boolean
  className?: string
}) {
  const meta = getMatchStatusMeta(status, hasWinner)
  const Icon = meta.Icon
  if (compact) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "h-5 px-1.5 py-0 rounded-full gap-0.5 text-[10px] font-semibold",
          meta.badgeClass,
          className,
        )}
        title={meta.label}
      >
        <Icon className="w-2.5 h-2.5 shrink-0" aria-hidden />
        <span className="sr-only">{meta.label}</span>
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className={cn("text-[11px] px-2 py-0.5 rounded-full gap-1 font-semibold", meta.badgeClass, className)}
    >
      <Icon className="w-3 h-3 shrink-0" aria-hidden />
      {meta.label}
    </Badge>
  )
}
