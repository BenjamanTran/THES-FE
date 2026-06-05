import { formatVnd } from "@/lib/format"
import type { SettlementComputed } from "./settlement-math"

export function formatSettlementCopy(computed: SettlementComputed, gameTitle?: string): string {
  const header = gameTitle ? `💰 Tính tiền — ${gameTitle}` : "💰 Tính tiền buổi đấu"
  const lines = [header, ""]

  if (computed.mode === "split_evenly") {
    lines.push(`Tổng chi: ${formatVnd(computed.total_expense)}`)
    if (computed.male_unit != null && computed.female_unit != null) {
      lines.push(
        `Nam ${formatVnd(computed.male_unit)} × ${computed.male_count}`,
        `Nữ ${formatVnd(computed.female_unit)} × ${computed.female_count}`,
      )
    }
    lines.push("")
    for (const p of computed.per_player) {
      lines.push(`• ${p.name || `#${p.id}`}: ${formatVnd(p.amount)}`)
    }
  } else {
    lines.push(
      `Tổng chi: ${formatVnd(computed.total_expense)}`,
      `Tổng thu: ${formatVnd(computed.revenue)}`,
      `Lợi nhuận: ${formatVnd(computed.profit)}`,
      "",
      `Nam ${formatVnd(computed.male_unit ?? 0)} × ${computed.male_count}`,
      `Nữ ${formatVnd(computed.female_unit ?? 0)} × ${computed.female_count}`,
    )
  }

  return lines.join("\n")
}
