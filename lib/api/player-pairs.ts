import { request } from "./client"
import type { GamePlayerPair } from "./types"

export function createPlayerPair(gameId: number, userAId: number, userBId: number) {
  return request<GamePlayerPair>(`/api/v1/games/${gameId}/player_pairs`, {
    method: "POST",
    body: JSON.stringify({ user_a_id: userAId, user_b_id: userBId }),
  })
}

export function deletePlayerPair(gameId: number, pairId: number) {
  return request<{ status: "deleted"; id: number }>(
    `/api/v1/games/${gameId}/player_pairs/${pairId}`,
    { method: "DELETE" },
  )
}
