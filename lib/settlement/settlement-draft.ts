import {
  newExpenseLine,
  normalizeExpenseLine,
  type ExpenseLine,
  type SettlementDraft,
  type SettlementMode,
} from "./settlement-math"
import type { GameDetail } from "@/lib/api"
import type { GameSettlementRecord } from "@/lib/api/settlement"

export function defaultSettlementDraft(game?: GameDetail | null): SettlementDraft {
  const suggest = game?.min_price && game.min_price > 0 ? game.min_price : 0
  return {
    mode: "split_evenly",
    expense_lines: [newExpenseLine("Sân")],
    gender_adjustment_steps: 0,
    fixed_male_price: suggest,
    fixed_female_price: suggest,
  }
}

export function draftFromSettlementRecord(
  record: GameSettlementRecord,
): SettlementDraft {
  return {
    mode: record.mode,
    expense_lines: record.expense_lines.map((l) =>
      normalizeExpenseLine(l as Parameters<typeof normalizeExpenseLine>[0]),
    ),
    gender_adjustment_steps: record.gender_adjustment_steps,
    fixed_male_price: record.fixed_male_price,
    fixed_female_price: record.fixed_female_price,
  }
}

export function draftFromSettlementRecordOrDefault(
  record: GameSettlementRecord | null | undefined,
  game?: GameDetail | null,
): SettlementDraft {
  if (!record) return defaultSettlementDraft(game)
  return draftFromSettlementRecord(record)
}

export function settlementDraftSnapshot(draft: SettlementDraft): string {
  return JSON.stringify({
    mode: draft.mode,
    gender_adjustment_steps: draft.gender_adjustment_steps,
    fixed_male_price: draft.fixed_male_price,
    fixed_female_price: draft.fixed_female_price,
    expense_lines: draft.expense_lines.map((l) => ({
      id: l.id,
      label: l.label,
      quantity: l.quantity,
      unit_vnd: l.unit_vnd,
      included: l.included !== false,
    })),
  })
}

export function settlementDraftsEqual(a: SettlementDraft, b: SettlementDraft): boolean {
  return settlementDraftSnapshot(a) === settlementDraftSnapshot(b)
}

export function draftToUpsertParams(draft: SettlementDraft) {
  return {
    mode: draft.mode as SettlementMode,
    expense_lines: draft.expense_lines.map((l) => ({
      ...l,
      included: l.included !== false,
    })) satisfies ExpenseLine[],
    gender_adjustment_steps: draft.gender_adjustment_steps,
    fixed_male_price: draft.fixed_male_price,
    fixed_female_price: draft.fixed_female_price,
  }
}
