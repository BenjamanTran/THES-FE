const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';


export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { headers: customHeaders, body, ...rest } = options || {};
  const headers: Record<string, string> = { ...(customHeaders as Record<string, string>) };
  if (body !== undefined && body !== null) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: 'include',
    ...(body !== undefined ? { body } : {}),
    headers,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    const message = errBody?.errors?.join(', ') || errBody?.error || `API error: ${res.status}`;
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface PlayerRank {
  tier: Tier;
  division: number | null;
  rating: number;
  display_name: string;
}

export interface ParticipantSummary {
  gender: Gender;
  tier: Tier | null;
}

export interface Game {
  id: number;
  start_time: string;
  end_time: string;
  status: 'open' | 'full' | 'ongoing' | 'finished' | 'cancelled';
  match_type: 'singles' | 'doubles';
  players_count: number;
  max_players: number;
  lat: number | null;
  lng: number | null;
  location: string | null;
  description: string | null;
  courts: number[] | null;
  min_tier: string | null;
  max_tier: string | null;
  min_price: number;
  max_price: number;
  host: { id: number; name: string | null } | null;
  fit_level?: 'good' | 'warning' | 'hard';
  distance_km?: number;
  participants_summary?: ParticipantSummary[];
}

export interface GamePlayer {
  id: number;
  name: string | null;
  gender?: Gender;
  rank?: PlayerRank | null;
}

export interface GameDetail extends Game {
  players: GamePlayer[];
}

export interface JoinResponse {
  status: 'joined';
  warning?: string;
}

export interface CreateGameParams {
  start_time: string;
  end_time: string;
  lat?: number;
  lng?: number;
  match_type: 'singles' | 'doubles';
  min_tier?: string;
  max_tier?: string;
  max_players: number;
  courts?: number[];
  description?: string;
  min_price?: number;
  max_price?: number;
}

interface GamesIndexResponse {
  games: Game[];
  meta: { page: number; per_page: number; total: number; total_pages: number };
}

interface GamesSearchResponse {
  games: Game[];
  meta?: {
    page: number;
    per_page: number;
    has_more: boolean;
    total?: number;
    total_pages?: number;
  };
}

export function fetchGames(params?: Record<string, string>) {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  return request<GamesIndexResponse>(`/api/v1/games${query}`);
}

export function fetchMyGames(
  time: 'upcoming' | 'past',
  extraParams?: Record<string, string>,
) {
  const params = new URLSearchParams({ mine: 'true', time, ...(extraParams || {}) });
  return request<GamesIndexResponse>(`/api/v1/games?${params}`);
}

export function fetchGamesSearch(params: Record<string, string>) {
  const query = `?${new URLSearchParams(params)}`;
  return request<GamesSearchResponse>(`/api/v1/games/search${query}`);
}

export function fetchGame(id: number) {
  return request<GameDetail>(`/api/v1/games/${id}`);
}

export function joinGame(id: number) {
  return request<JoinResponse>(`/api/v1/games/${id}/join`, { method: 'POST' });
}

export function leaveGame(id: number) {
  return request<{ status: 'left' }>(`/api/v1/games/${id}/leave`, { method: 'POST' });
}

export function createGame(params: CreateGameParams) {
  return request<Game>('/api/v1/games', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// --- Auth -------------------------------------------------------------

export type Gender = 'unspecified' | 'male' | 'female' | 'other';

export type Tier =
  | 'newbie'
  | 'beginner_plus'
  | 'lower_intermediate'
  | 'intermediate'
  | 'upper_intermediate'
  | 'advanced'
  | 'semi_pro'
  | 'professional';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  gender: Gender;
  phone: string | null;
  rank: PlayerRank | null;
}

export interface UpdateProfileParams {
  name?: string;
  gender?: Gender;
  phone?: string;
  tier?: Tier;
}

interface AuthResponse {
  user: AuthUser;
}

export function signup(params: {
  email: string;
  name: string;
  password: string;
  password_confirmation: string;
}) {
  return request<AuthResponse>('/api/v1/signup', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function login(params: { email: string; password: string }) {
  return request<AuthResponse>('/api/v1/login', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function logout() {
  return request<{ status: 'signed_out' }>('/api/v1/logout', { method: 'DELETE' });
}

export function fetchMe() {
  return request<AuthResponse>('/api/v1/me');
}

export function updateProfile(params: UpdateProfileParams) {
  return request<AuthResponse>('/api/v1/me', {
    method: 'PATCH',
    body: JSON.stringify(params),
  });
}
