import { request } from "./client"
import type {
  CreateGameParams,
  Game,
  GameDetail,
  GamePlayer,
  JoinResponse,
  PlaceholderPlayerParams,
  Tier,
  UpdateGameSettingsParams,
} from "./types"

interface GamesIndexResponse {
  games: Game[]
  meta: { page: number; per_page: number; total: number; total_pages: number }
}

interface GamesSearchResponse {
  games: Game[]
  meta?: {
    page: number
    per_page: number
    has_more: boolean
    total?: number
    total_pages?: number
  }
}

export function fetchGames(params?: Record<string, string>) {
  const query = params ? `?${new URLSearchParams(params)}` : ""
  return request<GamesIndexResponse>(`/api/v1/games${query}`)
}

export function fetchMyGames(time: "upcoming" | "past", extraParams?: Record<string, string>) {
  const params = new URLSearchParams({ mine: "true", time, ...(extraParams || {}) })
  return request<GamesIndexResponse>(`/api/v1/games?${params}`)
}

export function fetchGamesSearch(params: Record<string, string>) {
  const query = `?${new URLSearchParams(params)}`
  return request<GamesSearchResponse>(`/api/v1/games/search${query}`)
}

export function fetchGame(id: number) {
  return request<GameDetail>(`/api/v1/games/${id}`)
}

export function updateGameSettings(id: number, params: UpdateGameSettingsParams) {
  return request<GameDetail>(`/api/v1/games/${id}`, {
    method: "PATCH",
    body: JSON.stringify(params),
  })
}

export function joinGame(id: number) {
  return request<JoinResponse>(`/api/v1/games/${id}/join`, { method: "POST" })
}

export function leaveGame(id: number) {
  return request<{ status: "left" }>(`/api/v1/games/${id}/leave`, { method: "POST" })
}

export function createPlaceholder(gameId: number, params: PlaceholderPlayerParams) {
  return request<GamePlayer>(`/api/v1/games/${gameId}/placeholders`, {
    method: "POST",
    body: JSON.stringify(params),
  })
}

export function updatePlaceholder(
  gameId: number,
  userId: number,
  params: Partial<PlaceholderPlayerParams>,
) {
  return request<GamePlayer>(`/api/v1/games/${gameId}/placeholders/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(params),
  })
}

export function deletePlaceholder(gameId: number, userId: number) {
  return request<{ status: "deleted"; user_id: number }>(
    `/api/v1/games/${gameId}/placeholders/${userId}`,
    { method: "DELETE" },
  )
}

export function createGame(params: CreateGameParams) {
  return request<Game>("/api/v1/games", {
    method: "POST",
    body: JSON.stringify(params),
  })
}

export function promoteCoHost(gameId: number, userId: number) {
  return request<{ user_id: number; role: "player" | "co_host" }>(`/api/v1/games/${gameId}/promote`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  })
}

export function kickPlayer(gameId: number, userId: number) {
  return request<{ status: "kicked"; user_id: number }>(`/api/v1/games/${gameId}/kick`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  })
}

export function ratePlayer(
  gameId: number,
  params: { user_id: number; tier: Tier; stars: number; note?: string },
) {
  return request<GamePlayer>(`/api/v1/games/${gameId}/rate_player`, {
    method: "PATCH",
    body: JSON.stringify(params),
  })
}
