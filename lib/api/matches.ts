import { request } from "./client"
import type {
  CreateMatchParams,
  FinishMatchParams,
  FinishMatchResponse,
  MatchDetail,
  MatchSummary,
} from "./types"

export function fetchMatches(gameId: number, status?: MatchSummary["status"]) {
  const query = status ? `?status=${status}` : ""
  return request<{ matches: MatchDetail[] }>(`/api/v1/games/${gameId}/matches${query}`)
}

export function createMatch(gameId: number, params: CreateMatchParams) {
  return request<MatchDetail>(`/api/v1/games/${gameId}/matches`, {
    method: "POST",
    body: JSON.stringify(params),
  })
}

export function updateMatch(gameId: number, matchId: number, params: CreateMatchParams) {
  return request<MatchDetail>(`/api/v1/games/${gameId}/matches/${matchId}`, {
    method: "PATCH",
    body: JSON.stringify(params),
  })
}

export function startMatch(gameId: number, matchId: number) {
  return request<MatchDetail>(`/api/v1/games/${gameId}/matches/${matchId}/start`, { method: "POST" })
}

export function toggleMatchPriority(gameId: number, matchId: number) {
  return request<MatchDetail>(`/api/v1/games/${gameId}/matches/${matchId}/priority`, {
    method: "POST",
  })
}

export function finishMatch(gameId: number, matchId: number, params?: FinishMatchParams) {
  return request<FinishMatchResponse>(`/api/v1/games/${gameId}/matches/${matchId}/finish`, {
    method: "POST",
    body: JSON.stringify(params ?? {}),
  })
}

export function undoFinishMatch(gameId: number, matchId: number) {
  return request<{ match: MatchDetail }>(
    `/api/v1/games/${gameId}/matches/${matchId}/undo_finish`,
    { method: "POST" },
  )
}

export function deleteMatch(gameId: number, matchId: number) {
  return request<{ message: string }>(`/api/v1/games/${gameId}/matches/${matchId}`, {
    method: "DELETE",
  })
}

export function deletePendingMatches(gameId: number) {
  return request<{ deleted_count: number; match_ids: number[] }>(
    `/api/v1/games/${gameId}/matches/pending`,
    { method: "DELETE" },
  )
}

