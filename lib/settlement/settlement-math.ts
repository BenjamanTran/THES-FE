import type { Gender } from "@/lib/api"
import type { ShuttleSettings } from "./shuttle-expense"
import {
  applyShuttleToLine,
  DEFAULT_SHUTTLE_SETTINGS,
  isShuttleLine,
} from "./shuttle-expense"

/** Làm tròn chia tiền lên bội 500đ — tổng thu có thể cao hơn chi. */
export const SHARE_ROUND_VND = 500

export function ceilShareAmount(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 0
  return Math.ceil(raw / SHARE_ROUND_VND) * SHARE_ROUND_VND
}

export type SettlementMode = "split_evenly" | "fixed_price"
export type SettlementStatus = "none" | "draft" | "published"

export type ExpenseLineKind = "generic" | "shuttle"

export interface ExpenseLine {
  id: string
  label: string
  amount: number
  quantity: number
  unit_vnd: number
  included: boolean
  kind?: ExpenseLineKind
  shuttle_tube_vnd?: number
  shuttle_per_tube?: number
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
    included: true,
    kind: raw.kind === "shuttle" || /^cầu/i.test(lineLabel) ? "shuttle" : "generic",
    shuttle_tube_vnd: Number(raw.shuttle_tube_vnd ?? DEFAULT_SHUTTLE_SETTINGS.tube_vnd),
    shuttle_per_tube: Number(raw.shuttle_per_tube ?? DEFAULT_SHUTTLE_SETTINGS.per_tube),
  }, {
    quantity,
    unit_vnd,
    included: raw.included,
  })
}

export interface SettlementPlayerInput {
  id: number
  name: string | null
  gender?: Gender
  arrived_at_court?: boolean
  isHost?: boolean
}

export interface PerPlayerSectionAmount {
  section_id: string
  label: string
  amount: number
}

export interface PerPlayerAmount {
  id: number
  name: string | null
  gender?: Gender
  amount: number
  sections: PerPlayerSectionAmount[]
}

export interface SettlementSection {
  id: string
  label: string
  mode: SettlementMode
  expense_lines: ExpenseLine[]
  desired_female_price: number
  fixed_male_price: number
  fixed_female_price: number
  participant_ids: number[]
  shuttle_settings?: ShuttleSettings
}

export interface SectionComputed {
  id: string
  label: string
  mode: SettlementMode
  total_expense: number
  revenue: number
  profit: number
  participant_count: number
  male_count: number
  female_count: number
  male_unit: number | null
  female_unit: number | null
  per_player: { id: number; name: string | null; gender?: Gender; amount: number }[]
  ungendered_players: { id: number; name: string | null }[]
  errors: string[]
  warnings: string[]
}

export interface SettlementComputed {
  total_expense: number
  revenue: number
  profit: number
  arrived_count: number
  sections: SectionComputed[]
  per_player: PerPlayerAmount[]
  errors: string[]
  warnings: string[]
}

export interface SettlementDraft {
  sections: SettlementSection[]
}

export const EXPENSE_PRESETS = ["Sân", "Cầu", "Nước", "Gửi xe"] as const

export function newExpenseLine(label = ""): ExpenseLine {
  return { id: crypto.randomUUID(), label, quantity: 0, unit_vnd: 0, amount: 0, included: true }
}

export function newSection(label = "Phần 1", participantIds: number[] = []): SettlementSection {
  return {
    id: crypto.randomUUID(),
    label,
    mode: "split_evenly",
    expense_lines: [newExpenseLine("Sân"), newExpenseLine("Cầu")],
    desired_female_price: 0,
    fixed_male_price: 0,
    fixed_female_price: 0,
    participant_ids: participantIds,
  }
}

export function applyExpenseLinePatch(line: ExpenseLine, patch: Partial<ExpenseLine>): ExpenseLine {
  const next = { ...line, ...patch }
  const included = next.included !== false

  if (isShuttleLine(next)) {
    const settings: ShuttleSettings = {
      name: (patch.label ?? next.label).trim() || DEFAULT_SHUTTLE_SETTINGS.name,
      tube_vnd: next.shuttle_tube_vnd ?? DEFAULT_SHUTTLE_SETTINGS.tube_vnd,
      per_tube: next.shuttle_per_tube ?? DEFAULT_SHUTTLE_SETTINGS.per_tube,
    }
    return applyShuttleToLine(
      { ...next, quantity: Math.max(0, Math.floor(next.quantity ?? 0)) },
      settings,
    )
  }

  const quantity = Math.max(0, Math.floor(next.quantity ?? 0))
  const unit_vnd = Math.max(0, next.unit_vnd ?? 0)
  return {
    id: next.id,
    label: next.label,
    quantity,
    unit_vnd,
    amount: expenseLineAmount(quantity, unit_vnd),
    included,
    kind: "generic",
  }
}

export function totalExpense(lines: ExpenseLine[]): number {
  return lines.reduce(
    (sum, l) => sum + (l.included !== false && Number.isFinite(l.amount) ? l.amount : 0),
    0,
  )
}

export function computeSection(
  section: SettlementSection,
  allPlayers: SettlementPlayerInput[],
): SectionComputed {
  const participantIds = new Set(section.participant_ids)
  const pool = allPlayers.filter((p) => participantIds.has(p.id))
  const gendered = pool.filter((p) => p.gender === "male" || p.gender === "female")
  const males = gendered.filter((p) => p.gender === "male")
  const females = gendered.filter((p) => p.gender === "female")
  const ungendered = pool.filter((p) => p.gender !== "male" && p.gender !== "female")
  const expense = totalExpense(section.expense_lines)

  const base = {
    id: section.id,
    label: section.label,
    mode: section.mode,
    total_expense: expense,
    participant_count: pool.length,
    male_count: males.length,
    female_count: females.length,
    ungendered_players: ungendered.map((p) => ({ id: p.id, name: p.name })),
  }

  if (section.mode === "fixed_price") {
    return computeFixedPriceSection(section, base, males, females, pool)
  }
  return computeSplitEvenlySection(section, base, males, females, gendered, pool)
}

type SectionBase = {
  id: string
  label: string
  mode: SettlementMode
  total_expense: number
  participant_count: number
  male_count: number
  female_count: number
  ungendered_players: { id: number; name: string | null }[]
}

function computeSplitEvenlySection(
  section: SettlementSection,
  base: SectionBase,
  males: SettlementPlayerInput[],
  females: SettlementPlayerInput[],
  gendered: SettlementPlayerInput[],
  pool: SettlementPlayerInput[],
): SectionComputed {
  const empty = (errors: string[], warnings: string[] = []): SectionComputed => ({
    ...base,
    revenue: 0,
    profit: -base.total_expense,
    male_unit: null,
    female_unit: null,
    per_player: [],
    errors,
    warnings,
  })

  if (pool.length === 0) return empty([])
  if (base.total_expense <= 0) return empty(["Tổng chi phải lớn hơn 0"])

  const computePool = gendered.length > 0 ? gendered : pool
  const warnings: string[] = []
  if (gendered.length > 0 && pool.length !== gendered.length) {
    warnings.push("Một số người chưa có giới tính — không tính vào chia tiền")
  }

  const nm = males.length
  const nf = females.length
  const desired = section.desired_female_price

  let perPlayer: { id: number; name: string | null; gender?: Gender; amount: number }[]
  let maleUnit = 0
  let femaleUnit = 0

  if (nm > 0 && nf > 0 && desired > 0) {
    femaleUnit = ceilShareAmount(desired)
    const remaining = base.total_expense - femaleUnit * nf
    maleUnit = remaining > 0 ? ceilShareAmount(remaining / nm) : 0
    perPlayer = assignGenderShares(computePool, males, maleUnit, femaleUnit)
  } else {
    const unit = ceilShareAmount(base.total_expense / computePool.length)
    maleUnit = unit
    femaleUnit = unit
    perPlayer = computePool.map((p) => ({
      id: p.id,
      name: p.name,
      gender: p.gender,
      amount: unit,
    }))
  }

  const revenue = perPlayer.reduce((s, p) => s + p.amount, 0)

  return {
    ...base,
    revenue,
    profit: revenue - base.total_expense,
    male_unit: maleUnit,
    female_unit: femaleUnit,
    per_player: perPlayer,
    errors: [],
    warnings,
  }
}

function computeFixedPriceSection(
  section: SettlementSection,
  base: SectionBase,
  males: SettlementPlayerInput[],
  females: SettlementPlayerInput[],
  pool: SettlementPlayerInput[],
): SectionComputed {
  const nm = males.length
  const nf = females.length
  const malePrice = section.fixed_male_price
  const femalePrice = section.fixed_female_price
  const perPlayer = pool.map((p) => ({
    id: p.id,
    name: p.name,
    gender: p.gender,
    amount: p.gender === "male" ? malePrice : p.gender === "female" ? femalePrice : 0,
  }))
  const revenue = malePrice * nm + femalePrice * nf
  const warnings: string[] = []
  if (nm === 0 && nf === 0 && pool.length > 0) {
    warnings.push("Chưa có người có giới tính")
  }
  return {
    ...base,
    revenue,
    profit: revenue - base.total_expense,
    male_unit: malePrice,
    female_unit: femalePrice,
    per_player: perPlayer,
    errors: [],
    warnings,
  }
}

function assignGenderShares(
  pool: SettlementPlayerInput[],
  males: SettlementPlayerInput[],
  maleUnit: number,
  femaleUnit: number,
): { id: number; name: string | null; gender?: Gender; amount: number }[] {
  const maleIds = new Set(males.map((p) => p.id))
  return pool.map((p) => ({
    id: p.id,
    name: p.name,
    gender: p.gender,
    amount: maleIds.has(p.id) ? maleUnit : femaleUnit,
  }))
}

export function computeSettlement(
  players: SettlementPlayerInput[],
  draft: SettlementDraft,
): SettlementComputed {
  const sections = draft.sections.map((s) => computeSection(s, players))

  const perUser = new Map<number, PerPlayerAmount>()
  sections.forEach((sec) => {
    sec.per_player.forEach((row) => {
      const entry = perUser.get(row.id) ?? {
        id: row.id,
        name: row.name,
        gender: row.gender,
        amount: 0,
        sections: [],
      }
      entry.name = row.name ?? entry.name
      entry.gender = entry.gender ?? row.gender
      entry.amount += row.amount
      entry.sections.push({ section_id: sec.id, label: sec.label, amount: row.amount })
      perUser.set(row.id, entry)
    })
  })

  const total_expense = sections.reduce((s, sec) => s + sec.total_expense, 0)
  const revenue = sections.reduce((s, sec) => s + sec.revenue, 0)
  const errors = sections.flatMap((sec) => sec.errors)
  const warningSet = new Set<string>()
  sections.forEach((sec) => sec.warnings.forEach((w) => warningSet.add(w)))

  return {
    total_expense,
    revenue,
    profit: revenue - total_expense,
    arrived_count: players.filter((p) => p.arrived_at_court).length,
    sections,
    per_player: Array.from(perUser.values()),
    errors,
    warnings: Array.from(warningSet),
  }
}
