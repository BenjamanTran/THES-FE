import type { GamePlayer, Gender } from "@/lib/api"

export const GENDER_STEP_VND = 1_000
/** Làm tròn chia tiền lên bội 500đ — tổng thu có thể cao hơn chi. */
export const SHARE_ROUND_VND = 500

export function ceilShareAmount(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 0
  return Math.ceil(raw / SHARE_ROUND_VND) * SHARE_ROUND_VND
}

export type SettlementMode = "split_evenly" | "fixed_price"
export type SettlementStatus = "none" | "draft" | "published"

export interface ExpenseLine {
  id: string
  label: string
  amount: number
  /** Số lượng × đơn giá (nghìn) → amount. Đơn vị hiển thị = label. */
  quantity: number
  unit_vnd: number
}

export function expenseLineAmount(quantity: number, unitVnd: number): number {
  const q = Math.max(0, Math.floor(quantity) || 0)
  const u = Math.max(0, unitVnd) || 0
  return q * u
}

export function expenseUnitLabel(label: string): string {
  const t = label.trim()
  return t ? t.toLowerCase() : "…"
}

export function normalizeExpenseLine(raw: Partial<ExpenseLine> & Record<string, unknown>): ExpenseLine {
  const id = String(raw.id ?? crypto.randomUUID())
  const lineLabel = String(raw.label ?? "")
  let quantity = Number(raw.quantity ?? raw.shuttle_count ?? 0)
  let unit_vnd = Number(raw.unit_vnd ?? raw.shuttle_unit_vnd ?? 0)
  const legacyAmount = Number(raw.amount ?? 0)

  if (quantity <= 0 && unit_vnd <= 0 && legacyAmount > 0) {
    quantity = 1
    unit_vnd = legacyAmount
  }

  return applyExpenseLinePatch({
    id,
    label: lineLabel,
    quantity: 0,
    unit_vnd: 0,
    amount: 0,
  }, { quantity, unit_vnd })
}

export interface SettlementPlayerInput {
  id: number
  name: string | null
  gender?: Gender
  arrived_at_court?: boolean
  isHost?: boolean
}

export interface PerPlayerAmount {
  id: number
  name: string | null
  gender?: Gender
  amount: number
}

export interface SettlementComputed {
  mode: SettlementMode
  total_expense: number
  revenue: number
  profit: number
  arrived_count: number
  male_count: number
  female_count: number
  male_unit: number | null
  female_unit: number | null
  per_player: PerPlayerAmount[]
  ungendered_players: { id: number; name: string | null }[]
  errors: string[]
  warnings: string[]
}

export interface SettlementDraft {
  mode: SettlementMode
  expense_lines: ExpenseLine[]
  gender_adjustment_steps: number
  fixed_male_price: number
  fixed_female_price: number
}

export const EXPENSE_PRESETS = ["Sân", "Cầu", "Nước", "Gửi xe"] as const

export function newExpenseLine(label = ""): ExpenseLine {
  return { id: crypto.randomUUID(), label, quantity: 0, unit_vnd: 0, amount: 0 }
}

export function applyExpenseLinePatch(line: ExpenseLine, patch: Partial<ExpenseLine>): ExpenseLine {
  const next = { ...line, ...patch }
  const quantity = Math.max(0, Math.floor(next.quantity ?? 0))
  const unit_vnd = Math.max(0, next.unit_vnd ?? 0)
  return {
    id: next.id,
    label: next.label,
    quantity,
    unit_vnd,
    amount: expenseLineAmount(quantity, unit_vnd),
  }
}

export function totalExpense(lines: ExpenseLine[]): number {
  return lines.reduce((sum, l) => sum + (Number.isFinite(l.amount) ? l.amount : 0), 0)
}

function arrivedPlayers(players: SettlementPlayerInput[]) {
  return players.filter((p) => p.arrived_at_court)
}

function genderedArrived(players: SettlementPlayerInput[]) {
  return arrivedPlayers(players).filter((p) => p.gender === "male" || p.gender === "female")
}

export function computeSettlement(
  players: SettlementPlayerInput[],
  draft: SettlementDraft,
): SettlementComputed {
  const arrived = arrivedPlayers(players)
  const gendered = genderedArrived(players)
  const males = gendered.filter((p) => p.gender === "male")
  const females = gendered.filter((p) => p.gender === "female")
  const ungendered = arrived.filter((p) => p.gender !== "male" && p.gender !== "female")
  const expense = totalExpense(draft.expense_lines)

  const base = {
    total_expense: expense,
    arrived_count: arrived.length,
    male_count: males.length,
    female_count: females.length,
    ungendered_players: ungendered.map((p) => ({ id: p.id, name: p.name })),
    errors: [] as string[],
    warnings: [] as string[],
  }

  if (draft.mode === "fixed_price") {
    const revenue =
      draft.fixed_male_price * males.length + draft.fixed_female_price * females.length
    const warnings = [...base.warnings]
    if (males.length === 0 && females.length === 0) {
      warnings.push("Chưa có người đã đến có giới tính")
    }
    return {
      ...base,
      mode: "fixed_price",
      revenue,
      profit: revenue - expense,
      male_unit: draft.fixed_male_price,
      female_unit: draft.fixed_female_price,
      per_player: [],
      warnings,
    }
  }

  return computeSplitEvenly(arrived, gendered, males, females, ungendered, expense, draft.gender_adjustment_steps)
}

function computeSplitEvenly(
  arrived: SettlementPlayerInput[],
  gendered: SettlementPlayerInput[],
  males: SettlementPlayerInput[],
  females: SettlementPlayerInput[],
  ungendered: SettlementPlayerInput[],
  expense: number,
  steps: number,
): SettlementComputed {
  const empty = (errors: string[], warnings: string[] = []): SettlementComputed => ({
    mode: "split_evenly",
    total_expense: expense,
    revenue: 0,
    profit: 0,
    arrived_count: arrived.length,
    male_count: males.length,
    female_count: females.length,
    male_unit: null,
    female_unit: null,
    per_player: [],
    ungendered_players: ungendered.map((p) => ({ id: p.id, name: p.name })),
    errors,
    warnings,
  })

  if (arrived.length === 0) return empty(["Chưa có người đã đến sân"])
  if (expense <= 0) return empty(["Tổng chi phải lớn hơn 0"])

  const nm = males.length
  const nf = females.length
  const pool = gendered.length > 0 ? gendered : arrived
  const warnings: string[] = []
  if (ungendered.length > 0) {
    warnings.push("Một số người đến chưa có giới tính — không tính vào chia tiền")
  }

  let perPlayer: PerPlayerAmount[]
  let displayMaleUnit: number | null = null
  let displayFemaleUnit: number | null = null

  if (nm > 0 && nf > 0 && steps !== 0) {
    const baseEven = expense / (nm + nf)
    const maleUnit = ceilShareAmount(baseEven + steps * GENDER_STEP_VND)
    if (maleUnit * nm > expense) {
      return empty(["Điều chỉnh nam quá cao — nữ âm tiền"], warnings)
    }
    const femaleUnit =
      nf > 0 ? ceilShareAmount((expense - maleUnit * nm) / nf) : 0

    displayMaleUnit = maleUnit
    displayFemaleUnit = femaleUnit
    perPlayer = assignGenderShares(pool, males, maleUnit, femaleUnit)
  } else {
    const unit = ceilShareAmount(expense / pool.length)
    perPlayer = pool.map((p) => ({
      id: p.id,
      name: p.name,
      gender: p.gender,
      amount: unit,
    }))
  }

  const revenue = perPlayer.reduce((s, p) => s + p.amount, 0)

  return {
    mode: "split_evenly",
    total_expense: expense,
    revenue,
    profit: revenue - expense,
    arrived_count: arrived.length,
    male_count: nm,
    female_count: nf,
    male_unit: nm > 0 && nf > 0 && steps !== 0 ? displayMaleUnit : null,
    female_unit: nm > 0 && nf > 0 && steps !== 0 ? displayFemaleUnit : null,
    per_player: perPlayer,
    ungendered_players: ungendered.map((p) => ({ id: p.id, name: p.name })),
    errors: [],
    warnings,
  }
}

function assignGenderShares(
  pool: SettlementPlayerInput[],
  males: SettlementPlayerInput[],
  maleUnit: number,
  femaleUnit: number,
): PerPlayerAmount[] {
  const maleIds = new Set(males.map((p) => p.id))
  return pool.map((p) => ({
    id: p.id,
    name: p.name,
    gender: p.gender,
    amount: maleIds.has(p.id) ? maleUnit : femaleUnit,
  }))
}

export function maxGenderSteps(
  expense: number,
  maleCount: number,
  femaleCount: number,
): number {
  if (maleCount < 1 || femaleCount < 1 || expense <= 0) return 0
  const baseEven = expense / (maleCount + femaleCount)
  let steps = 0
  while (true) {
    const next = steps + 1
    const maleUnit = ceilShareAmount(baseEven + next * GENDER_STEP_VND)
    if (maleUnit * maleCount > expense) return steps
    const femaleUnit = ceilShareAmount((expense - maleUnit * maleCount) / femaleCount)
    if (femaleUnit <= 0 && expense - maleUnit * maleCount < 0) return steps
    steps = next
    if (steps > 500) return steps
  }
}
