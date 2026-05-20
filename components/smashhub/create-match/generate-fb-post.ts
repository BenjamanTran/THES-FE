import type { Game } from "@/lib/api"
import { SKILL_LABELS, type SkillLevel } from "../skill-badge"
import { formatCourtList } from "./constants"

export function generateCreateMatchFbPost(
  game: Game,
  options: {
    venueName?: string
    venueAddress?: string
    courts: number[]
    levels: SkillLevel[]
  },
): string {
  const start = new Date(game.start_time)
  const end = new Date(game.end_time)
  const timeRange = `${start.getHours()}h-${end.getHours()}h`
  const dateStr = start.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  const venueName = options.venueName || ""
  const venueAddr = options.venueAddress || ""
  const locationLine = venueAddr
    ? `📍 Địa điểm: ${venueAddr}\n(${venueName})`
    : `📍 Địa điểm: ${venueName}`

  const levelLabels = options.levels.map((l) => SKILL_LABELS[l])
  const levelLine = levelLabels.length > 0 ? `🏸 Trình độ: ${levelLabels.join(" + ")}` : ""

  const courts = game.courts?.length ? game.courts : options.courts
  const courtLine = `🏟️ ${formatCourtList(courts)} — tối đa ${game.max_players} người`

  let priceLine = ""
  if (game.min_price > 0 || game.max_price > 0) {
    const fmtK = (v: number) => `${Math.round(v / 1000)}k`
    if (game.min_price === game.max_price) {
      priceLine = `💰 Phí: ${fmtK(game.max_price)}/buổi`
    } else if (game.min_price <= 0) {
      priceLine = `💰 Phí: ~${fmtK(game.max_price)}/buổi`
    } else {
      priceLine = `💰 Phí dao động: ${fmtK(game.min_price)} - ${fmtK(game.max_price)}/buổi`
    }
  }

  const gameTitle = game.title || `Kèo cầu lông vãng lai ${dateStr}`
  const inviteUrl = game.invite_code
    ? `\n🔗 Tham gia ngay: ${window.location.origin}/join/${game.invite_code}`
    : ""

  const lines = [
    `🏸 ${gameTitle.toUpperCase()} ${timeRange} ${dateStr} 🏸`,
    "",
    locationLine,
    "👫 Nam nữ đều welcome",
    levelLine,
    "🪶 Cầu thay thoải mái",
    courtLine,
    priceLine,
    "",
    "Không khí vui vẻ, ưu tiên giao lưu thoải mái, đánh vui là chính 😄",
    "Ai muốn tham gia ib mình nhé!",
    inviteUrl,
  ]

  return lines.filter((l) => l !== "").join("\n")
}
