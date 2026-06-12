import { request } from "./client"
import type {
  ExpenseLine,
  SettlementComputed,
  SettlementMode,
} from "@/lib/settlement/settlement-math"

export interface GameSettlementSectionRecord {
  id: string
  label: string
  mode: SettlementMode
  expense_lines: ExpenseLine[]
  desired_female_price: number
  fixed_male_price: number
  fixed_female_price: number
  participant_ids: number[]
}

export interface GameSettlementRecord {
  status: "draft" | "published"
  sections: GameSettlementSectionRecord[]
  published_at: string | null
  updated_at: string
}

export interface SettlementResponse {
  status: "none" | "draft" | "published"
  editable: boolean
  can_manage: boolean
  message?: string
  settlement: GameSettlementRecord | null
  computed: SettlementComputed | null
}

export interface UpsertSettlementSectionParams {
  id: string
  label: string
  mode: SettlementMode
  expense_lines: ExpenseLine[]
  desired_female_price: number
  fixed_male_price: number
  fixed_female_price: number
  participant_ids: number[]
}

export interface UpsertSettlementParams {
  sections: UpsertSettlementSectionParams[]
}

export function fetchGameSettlement(gameId: number) {
  return request<SettlementResponse>(`/api/v1/games/${gameId}/settlement`)
}

export function upsertGameSettlement(gameId: number, params: UpsertSettlementParams) {
  return request<SettlementResponse>(`/api/v1/games/${gameId}/settlement`, {
    method: "PUT",
    body: JSON.stringify(params),
  })
}

export function publishGameSettlement(gameId: number) {
  return request<SettlementResponse>(`/api/v1/games/${gameId}/settlement/publish`, {
    method: "POST",
  })
}
