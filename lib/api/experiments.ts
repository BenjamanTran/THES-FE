import { request } from "./client"

export type GameDetailScreenVariant = "legacy" | "simple"

export interface ExperimentsPayload {
  game_detail_screen: GameDetailScreenVariant
}

export function fetchExperiments() {
  return request<{ experiments: ExperimentsPayload }>("/api/v1/experiments")
}
