import { request } from "./client"
import type { AuthUser, Gender, InviteResponse, Tier } from "./types"

export function fetchInvite(code: string) {
  return request<InviteResponse>(`/api/v1/games/invite/${code}`)
}

export function joinViaInvite(
  code: string,
  params: { name: string; gender: Gender; tier: Tier; stars: number },
) {
  return request<{ user: AuthUser; game_id: number }>(`/api/v1/games/invite/${code}/join`, {
    method: "POST",
    body: JSON.stringify(params),
  })
}
