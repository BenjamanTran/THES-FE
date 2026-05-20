"use client"

import { format } from "date-fns"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { SKILL_LABELS, type SkillLevel } from "../skill-badge"
import type { GameDetail } from "@/lib/api"

export function statusMeta(status: GameDetail["status"]) {
  switch (status) {
    case "open":
      return { label: "Đang mở", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" }
    case "full":
      return { label: "Đã đầy", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" }
    case "ongoing":
      return { label: "Đang diễn ra", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" }
    case "finished":
      return { label: "Đã kết thúc", className: "bg-neutral-500/20 text-neutral-300 border-neutral-500/30" }
    case "cancelled":
      return { label: "Đã huỷ", className: "bg-red-500/20 text-red-400 border-red-500/30" }
  }
}

export function fitMeta(fit: GameDetail["fit_level"]) {
  switch (fit) {
    case "good":
      return { label: "Phù hợp với trình độ", className: "text-emerald-400", Icon: CheckCircle2 }
    case "warning":
      return { label: "Có thể chưa phù hợp", className: "text-amber-400", Icon: AlertTriangle }
    case "hard":
      return { label: "Trình độ chênh lệch lớn", className: "text-red-400", Icon: AlertTriangle }
    default:
      return null
  }
}

export function generateFbPost(game: GameDetail): string {
  const start = new Date(game.start_time)
  const end = new Date(game.end_time)
  const timeRange = `${start.getHours()}h-${end.getHours()}h`
  const dateStr = format(start, "dd/MM/yyyy")

  const locationParts = game.location?.split(" - ") || []
  const locationLine = locationParts.length > 1
    ? `📍 Địa điểm: ${locationParts.slice(1).join(" - ")}\n(${locationParts[0]})`
    : game.location
      ? `📍 Địa điểm: ${game.location}`
      : ""

  const levelLabels: string[] = []
  if (game.min_tier) levelLabels.push(SKILL_LABELS[game.min_tier as SkillLevel] || game.min_tier)
  if (game.max_tier && game.max_tier !== game.min_tier) levelLabels.push(SKILL_LABELS[game.max_tier as SkillLevel] || game.max_tier)
  const levelLine = levelLabels.length > 0 ? `🏸 Trình độ: ${levelLabels.join(" + ")}` : ""

  const courts = game.courts?.length || 1
  const courtLine = `🏟️ ${courts} sân — tối đa ${game.max_players} người`
  const currentLine = game.players_count > 0 ? `📌 Hiện tại đã có ${game.players_count} người` : ""

  let priceLine = ""
  const minP = game.min_price ?? 0
  const maxP = game.max_price ?? 0
  if (minP > 0 || maxP > 0) {
    const fmtK = (v: number) => `${Math.round(v / 1000)}k`
    if (minP === maxP) priceLine = `💰 Phí: ${fmtK(maxP)}/buổi`
    else if (minP <= 0) priceLine = `💰 Phí: ~${fmtK(maxP)}/buổi`
    else priceLine = `💰 Phí dao động: ${fmtK(minP)} - ${fmtK(maxP)}/buổi`
  }

  const gameTitle = game.title || `Kèo cầu lông vãng lai ${dateStr}`
  const inviteUrl = game.invite_code
    ? `\n🔗 Tham gia ngay: ${typeof window !== "undefined" ? window.location.origin : ""}/join/${game.invite_code}`
    : ""

  const lines = [
    `🏸 ${gameTitle.toUpperCase()} ${timeRange} ${dateStr} 🏸`,
    "",
    locationLine,
    "👫 Nam nữ đều welcome",
    levelLine,
    "🪶 Cầu thay thoải mái",
    courtLine,
    currentLine,
    priceLine,
    "",
    "Không khí vui vẻ, ưu tiên giao lưu thoải mái, đánh vui là chính 😄",
    "Ai muốn tham gia ib mình nhé!",
    inviteUrl,
  ]

  return lines.filter(l => l !== "").join("\n")
}
