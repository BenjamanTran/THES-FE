/** Settlement inputs use thousands of VND (1 → 1.000đ, 31,5 → 31.500đ). */
export const SETTLEMENT_VND_UNIT = 1_000

const MAX_DECIMALS = 3

/** Allow digits and one decimal separator (, or .). Keeps the separator the user typed. */
export function sanitizeThousandsInput(raw: string): string {
  let out = ""
  let hasSep = false
  let decCount = 0

  for (const ch of raw) {
    if (ch >= "0" && ch <= "9") {
      if (hasSep) {
        if (decCount >= MAX_DECIMALS) continue
        decCount += 1
      }
      out += ch
      continue
    }
    if ((ch === "," || ch === ".") && !hasSep) {
      out += ch
      hasSep = true
    }
  }

  return out
}

function normalizeDecimalString(raw: string): string {
  return raw.trim().replace(",", ".")
}

export function vndToThousandsField(vnd: number): string {
  if (!vnd) return ""
  const thousands = vnd / SETTLEMENT_VND_UNIT
  if (Number.isInteger(thousands)) return String(thousands)
  const s = String(parseFloat(thousands.toFixed(MAX_DECIMALS)))
  return s.replace(".", ",")
}

export function thousandsFieldToVnd(raw: string): number {
  let trimmed = raw.trim()
  if (!trimmed || trimmed === "," || trimmed === ".") return 0
  if (trimmed.endsWith(",") || trimmed.endsWith(".")) {
    trimmed = trimmed.slice(0, -1)
  }
  if (!trimmed) return 0
  const n = Number(normalizeDecimalString(trimmed))
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.round(n * SETTLEMENT_VND_UNIT)
}
