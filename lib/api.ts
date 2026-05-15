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
  title: string | null;
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
  matches_count?: number;
  matches_finished?: number;
  invite_code?: string;
}

export interface GamePlayer {
  id: number;
  name: string | null;
  gender?: Gender;
  rank?: PlayerRank | null;
  role?: 'player' | 'co_host';
  host_rated_tier?: Tier | null;
  host_rated_stars?: number | null;
  host_rating_note?: string | null;
}

export interface MatchPlayer {
  id: number;
  name: string | null;
  rank?: PlayerRank | null;
}

export interface MatchSummary {
  id: number;
  match_number: number;
  status: 'pending' | 'ongoing' | 'finished';
  team_a_score: number | null;
  team_b_score: number | null;
  winner_team: 'team_a' | 'team_b' | null;
  team_a: MatchPlayer[];
  team_b: MatchPlayer[];
}

export interface MatchDetail extends MatchSummary {
  started_at: string | null;
  finished_at: string | null;
  team_a: MatchDetailPlayer[];
  team_b: MatchDetailPlayer[];
}

export interface MatchDetailPlayer {
  id: number;
  name: string | null;
  gender?: Gender;
  rank?: PlayerRank | null;
  winner: boolean;
}

export interface FinishMatchParams {
  team_a_score?: number;
  team_b_score?: number;
  winner_team?: 'team_a' | 'team_b';
}

export interface FinishMatchParticipant {
  user_id: number;
  name: string;
  team: 'team_a' | 'team_b';
  winner: boolean;
  rating_change: number;
}

export interface FinishMatchResponse {
  match: MatchDetail;
  participants: FinishMatchParticipant[];
}

export interface CreateMatchParams {
  team_a: number[];
  team_b: number[];
}

export interface GameDetail extends Game {
  players: GamePlayer[];
  matches: MatchSummary[];
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
  title?: string;
  description?: string;
  min_price?: number;
  max_price?: number;
  venue_id?: number;
}

// --- Venues ---------------------------------------------------------------

export interface Venue {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  district: string | null;
  lat: number | null;
  lng: number | null;
  verified: boolean;
}

export function fetchVenues(params?: { city?: string; q?: string }) {
  const qs = new URLSearchParams();
  if (params?.city) qs.set('city', params.city);
  if (params?.q) qs.set('q', params.q);
  const query = qs.toString();
  return request<{ venues: Venue[] }>(`/api/v1/venues${query ? `?${query}` : ''}`);
}

export function createVenue(params: { name: string; address?: string; city?: string; district?: string; lat?: number; lng?: number }) {
  return request<{ venue: Venue }>('/api/v1/venues', {
    method: 'POST',
    body: JSON.stringify(params),
  });
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

// --- Matches ----------------------------------------------------------

export function fetchMatches(gameId: number) {
  return request<{ matches: MatchDetail[] }>(`/api/v1/games/${gameId}/matches`);
}

export function createMatch(gameId: number, params: CreateMatchParams) {
  return request<MatchDetail>(`/api/v1/games/${gameId}/matches`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function startMatch(gameId: number, matchId: number) {
  return request<MatchDetail>(`/api/v1/games/${gameId}/matches/${matchId}/start`, { method: 'POST' });
}

export function finishMatch(gameId: number, matchId: number, params?: FinishMatchParams) {
  return request<FinishMatchResponse>(`/api/v1/games/${gameId}/matches/${matchId}/finish`, {
    method: 'POST',
    body: JSON.stringify(params ?? {}),
  });
}

export function deleteMatch(gameId: number, matchId: number) {
  return request<{ message: string }>(`/api/v1/games/${gameId}/matches/${matchId}`, {
    method: 'DELETE',
  });
}

// --- Co-host / Kick ---------------------------------------------------

export function promoteCoHost(gameId: number, userId: number) {
  return request<{ user_id: number; role: 'player' | 'co_host' }>(`/api/v1/games/${gameId}/promote`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  });
}

export function kickPlayer(gameId: number, userId: number) {
  return request<{ status: 'kicked'; user_id: number }>(`/api/v1/games/${gameId}/kick`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  });
}

export function ratePlayer(gameId: number, params: { user_id: number; tier: Tier; stars: number; note?: string }) {
  return request<GamePlayer>(`/api/v1/games/${gameId}/rate_player`, {
    method: 'PATCH',
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
  email: string | null;
  name: string;
  gender: Gender;
  phone: string | null;
  guest?: boolean;
  rank: PlayerRank | null;
}

export interface UpdateProfileParams {
  name?: string;
  gender?: Gender;
  phone?: string;
  tier?: Tier;
  stars?: number;
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

// --- Invite (public, no auth) -------------------------------------------

export interface InviteGameInfo {
  id: number;
  description: string | null;
  match_type: string;
  status: string;
  players_count: number;
  max_players: number;
  start_time: string;
  end_time: string;
  location: string | null;
  host_name: string | null;
}

export function fetchInvite(code: string) {
  return request<{ game: InviteGameInfo }>(`/api/v1/games/invite/${code}`);
}

export function joinViaInvite(code: string, params: { name: string; gender: Gender; tier: Tier; stars: number }) {
  return request<{ user: AuthUser; game_id: number }>(`/api/v1/games/invite/${code}/join`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function upgradeGuest(params: { email: string; password: string; password_confirmation: string }) {
  return request<AuthResponse>('/api/v1/me', {
    method: 'PATCH',
    body: JSON.stringify(params),
  });
}
