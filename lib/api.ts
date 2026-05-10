const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
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
  min_tier: string | null;
  max_tier: string | null;
  host: { id: number; name: string | null } | null;
  fit_level?: 'good' | 'warning' | 'hard';
  distance_km?: number;
}

interface GamesIndexResponse {
  games: Game[];
  meta: { page: number; per_page: number; total: number; total_pages: number };
}

interface GamesSearchResponse {
  games: Game[];
}

export function fetchGames(params?: Record<string, string>) {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  return request<GamesIndexResponse>(`/api/v1/games${query}`);
}

export function fetchGamesSearch(params: Record<string, string>) {
  const query = `?${new URLSearchParams(params)}`;
  return request<GamesSearchResponse>(`/api/v1/games/search${query}`);
}

export function fetchGame(id: number) {
  return request<Game>(`/api/v1/games/${id}`);
}
