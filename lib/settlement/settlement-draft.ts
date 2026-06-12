import type { GameSettlementRecord, GameSettlementSectionRecord } from "@/lib/api/settlement"
import {
  newSection,
  normalizeExpenseLine,
  type SettlementDraft,
  type SettlementMode,
  type SettlementSection,
} from "./settlement-math"

export function defaultSettlementDraft(arrivedPlayerIds: number[] = []): SettlementDraft {
  return {
    sections: [newSection("Phần 1", arrivedPlayerIds)],
  }
}

function sectionFromRecord(record: GameSettlementSectionRecord): SettlementSection {
  return {
    id: record.id,
    label: record.label,
    mode: record.mode,
    expense_lines: (record.expense_lines ?? []).map((l) =>
      normalizeExpenseLine(l as Parameters<typeof normalizeExpenseLine>[0]),
    ),
    desired_female_price: record.desired_female_price ?? 0,
    fixed_male_price: record.fixed_male_price ?? 0,
    fixed_female_price: record.fixed_female_price ?? 0,
    participant_ids: record.participant_ids ?? [],
  }
}

export function draftFromSettlementRecord(
  record: GameSettlementRecord,
): SettlementDraft {
  return {
    sections: (record.sections ?? []).map(sectionFromRecord),
  }
}

export function draftFromSettlementRecordOrDefault(
  record: GameSettlementRecord | null | undefined,
  arrivedPlayerIds: number[] = [],
): SettlementDraft {
  if (!record || (record.sections ?? []).length === 0) {
    return defaultSettlementDraft(arrivedPlayerIds)
  }
  return draftFromSettlementRecord(record)
}

export function settlementDraftSnapshot(draft: SettlementDraft): string {
  return JSON.stringify({
    sections: draft.sections.map((s) => ({
      id: s.id,
      label: s.label,
      mode: s.mode,
      desired_female_price: s.desired_female_price,
      fixed_male_price: s.fixed_male_price,
      fixed_female_price: s.fixed_female_price,
      participant_ids: [...s.participant_ids].sort((a, b) => a - b),
      expense_lines: s.expense_lines.map((l) => ({
        id: l.id,
        label: l.label,
        quantity: l.quantity,
        unit_vnd: l.unit_vnd,
        included: l.included !== false,
        kind: l.kind,
        shuttle_tube_vnd: l.shuttle_tube_vnd,
        shuttle_per_tube: l.shuttle_per_tube,
      })),
    })),
  })
}

export function settlementDraftsEqual(a: SettlementDraft, b: SettlementDraft): boolean {
  return settlementDraftSnapshot(a) === settlementDraftSnapshot(b)
}

export function draftToUpsertParams(draft: SettlementDraft) {
  return {
    sections: draft.sections.map((s) => ({
      id: s.id,
      label: s.label,
      mode: s.mode as SettlementMode,
      expense_lines: s.expense_lines.map((l) => ({
        ...l,
        included: l.included !== false,
      })),
      desired_female_price: s.desired_female_price,
      fixed_male_price: s.fixed_male_price,
      fixed_female_price: s.fixed_female_price,
      participant_ids: s.participant_ids,
    })),
  }
}
