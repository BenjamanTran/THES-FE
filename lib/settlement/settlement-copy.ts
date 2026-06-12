import { formatVnd } from "@/lib/format"
import type { SettlementComputed } from "./settlement-math"

export function formatSettlementCopy(computed: SettlementComputed, gameTitle?: string): string {
  const header = gameTitle ? `💰 Tính tiền — ${gameTitle}` : "💰 Tính tiền buổi đấu"
  const lines = [header, ""]

  const hasMultipleSections = computed.sections.length > 1

  computed.sections.forEach((sec) => {
    if (hasMultipleSections) {
      lines.push(`📍 ${sec.label} (${sec.participant_count} người)`)
    }
    if (sec.male_unit != null && sec.female_unit != null && (sec.male_count > 0 || sec.female_count > 0)) {
      const parts: string[] = []
      if (sec.male_count > 0) parts.push(`Nam ${formatVnd(sec.male_unit)} × ${sec.male_count}`)
      if (sec.female_count > 0) parts.push(`Nữ ${formatVnd(sec.female_unit)} × ${sec.female_count}`)
      if (parts.length > 0) lines.push(parts.join(" · "))
    }
    if (hasMultipleSections) {
      sec.per_player.forEach((p) => {
        lines.push(`  • ${p.name || `#${p.id}`}: ${formatVnd(p.amount)}`)
      })
      lines.push(`  Chi: ${formatVnd(sec.total_expense)} · Thu: ${formatVnd(sec.revenue)}`)
      lines.push("")
    }
  })

  if (hasMultipleSections) {
    lines.push("💵 Tổng cộng:")
  }
  computed.per_player.forEach((p) => {
    lines.push(`• ${p.name || `#${p.id}`}: ${formatVnd(p.amount)}`)
  })

  lines.push("")
  lines.push(
    `Tổng chi: ${formatVnd(computed.total_expense)}`,
    `Tổng thu: ${formatVnd(computed.revenue)}`,
  )
  if (computed.profit !== 0) {
    lines.push(`Chênh lệch: ${computed.profit > 0 ? "+" : ""}${formatVnd(computed.profit)}`)
  }

  return lines.join("\n")
}
