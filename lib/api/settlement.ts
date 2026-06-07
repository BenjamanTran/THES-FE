import { request } from "./client"
import type { ExpenseLine, SettlementComputed, SettlementMode } from "@/lib/settlement/settlement-math"
import type { ShuttleSettings } from "@/lib/settlement/shuttle-expense"

export interface GameSettlementRecord {
  mode: SettlementMode
  status: "draft" | "published"
  expense_lines: ExpenseLine[]
  gender_adjustment_steps: number
  fixed_male_price: number
  fixed_female_price: number
  shuttle_settings?: ShuttleSettings | null
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

export interface UpsertSettlementParams {
  mode: SettlementMode
  expense_lines: ExpenseLine[]
  gender_adjustment_steps: number
  fixed_male_price: number
  fixed_female_price: number
  shuttle_settings?: ShuttleSettings
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
