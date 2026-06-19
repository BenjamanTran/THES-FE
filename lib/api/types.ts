export type Gender = "unspecified" | "male" | "female" | "other"

export type Tier =
  | "newbie"
  | "beginner_plus"
  | "lower_intermediate"
  | "intermediate"
  | "upper_intermediate"
  | "advanced"
  | "semi_pro"
  | "professional"

export interface PlayerRank {
  tier: Tier
  division: number | null
  rating: number
  display_name: string
  wins?: number
  losses?: number
  matches_count?: number
  play_time_seconds?: number
  host_rating_count?: number
  host_base_rating?: number | null
  match_points?: number
}

export interface WeeklyGr {
  delta: number
  wins: number
  losses: number
  matches: number
  win_points: number
  loss_points: number
}

export interface UserStats {
  weekly_gr: WeeklyGr
  global_rank: number | null
  win_rate: number | null
  favorite_venue?: string | null
}

export interface AchievementProgress {
  current: number
  target: number
}

export interface Achievement {
  id: string
  name: string
  icon: string
  unlocked: boolean
  progress?: AchievementProgress | null
}

export type RecentActivityType = "match_win" | "match_loss" | "game_join" | "achievement"

export interface RecentActivityItem {
  type: RecentActivityType
  title: string
  subtitle?: string | null
  gr_delta?: number | null
  occurred_at: string
  game_id?: number | null
  badge?: string | null
}

export interface RecentActivityResponse {
  recent_activity: RecentActivityItem[]
  has_more: boolean
  next_offset: number
}

export type SkillRadarAxisKey =
  | "attack"
  | "defense"
  | "technique"
  | "agility"
  | "footwork"
  | "stamina"

export interface SkillRadarAxis {
  key: SkillRadarAxisKey
  label: string
  score: number
}

export interface SkillRadarSnapshot {
  month: string
  overall_score: number
  declared_tier: Tier
  computed_stars: number
  declared_rating: number
  axes: SkillRadarAxis[]
}

export type SkillScores = Record<SkillRadarAxisKey, number>

export interface UpdateSkillProfileParams {
  tier: Tier
  scores: SkillScores
}

export interface UserProfile {
  achievements: Achievement[]
  recent_activity: RecentActivityItem[]
  recent_activity_has_more?: boolean
  skill_radar?: SkillRadarSnapshot | null
  skill_history?: SkillRadarSnapshot[]
}

export interface ParticipantSummary {
  gender: Gender
  tier: Tier | null
}

export interface Game {
  id: number
  start_time: string
  end_time: string
  status: "open" | "full" | "ongoing" | "finished" | "cancelled"
  match_type: "singles" | "doubles"
  players_count: number
  max_players: number
  lat: number | null
  lng: number | null
  location: string | null
  title: string | null
  description: string | null
  courts: number[] | null
  min_tier: string | null
  max_tier: string | null
  min_price: number
  max_price: number
  host: { id: number; name: string | null } | null
  fit_level?: "good" | "warning" | "hard"
  distance_km?: number
  participants_summary?: ParticipantSummary[]
  matches_count?: number
  matches_finished?: number
  invite_code?: string
}

export interface GamePlayer {
  id: number
  name: string | null
  avatar_url?: string | null
  gender?: Gender
  rank?: PlayerRank | null
  declared_rank?: PlayerRank | null
  role?: "player" | "co_host"
  placeholder?: boolean
  host_rated_tier?: Tier | null
  host_rated_stars?: number | null
  host_rating_note?: string | null
  session_matches?: { played: number; wins: number; losses: number }
  arrived_at_court?: boolean
}

export interface GameMatchCounts {
  pending: number
  ongoing: number
  finished: number
}

export interface MatchPlayer {
  id: number
  name: string | null
  avatar_url?: string | null
  gender?: Gender
  rank?: PlayerRank | null
  host_rated_tier?: Tier | null
  host_rated_stars?: number | null
}

export interface MatchSummary {
  id: number
  match_number: number
  status: "pending" | "ongoing" | "finished"
  team_a_score: number | null
  team_b_score: number | null
  winner_team: "team_a" | "team_b" | null
  started_at?: string | null
  finished_at?: string | null
  priority?: boolean
  court_number?: number | null
  team_a: MatchPlayer[]
  team_b: MatchPlayer[]
}

export interface MatchDetail extends MatchSummary {
  started_at: string | null
  finished_at: string | null
  team_a: MatchDetailPlayer[]
  team_b: MatchDetailPlayer[]
}

export interface MatchDetailPlayer {
  id: number
  name: string | null
  gender?: Gender
  rank?: PlayerRank | null
  winner: boolean
}

export interface FinishMatchParams {
  team_a_score?: number
  team_b_score?: number
  winner_team?: "team_a" | "team_b"
}

export interface FinishMatchParticipant {
  user_id: number
  name: string
  team: "team_a" | "team_b"
  winner: boolean
  rating_change: number
}

export interface FinishMatchResponse {
  match: MatchDetail
  participants: FinishMatchParticipant[]
}

export interface CreateMatchParams {
  team_a: number[]
  team_b: number[]
  /** Host pair-arrange match — keeps pairs on sides, counts toward quota */
  arranged_as_pairs?: boolean
}

export interface GamePlayerPair {
  id: number
  user_a_id: number
  user_b_id: number
  status: "active" | "dissolved"
  /** Pair-arranged matches used (pair-arrange feature), per pair */
  matches_used?: number
}

export interface GameDetail extends Game {
  players: GamePlayer[]
  matches: MatchSummary[]
  match_counts?: GameMatchCounts
  priority_match?: MatchSummary | null
  /** null = unlimited pair-arranged matches per registered pair */
  pair_matches_limit?: number | null
  player_pairs?: GamePlayerPair[]
}

export interface JoinResponse {
  status: "joined"
  warning?: string
}

export interface CreateGameParams {
  start_time: string
  end_time: string
  lat?: number
  lng?: number
  match_type: "singles" | "doubles"
  min_tier?: string
  max_tier?: string
  max_players: number
  courts?: number[]
  title?: string
  description?: string
  min_price?: number
  max_price?: number
  venue_id?: number
}

export interface Venue {
  id: number
  name: string
  address: string | null
  city: string | null
  district: string | null
  lat: number | null
  lng: number | null
  verified: boolean
  games_count?: number
}

export interface UpdateGameSettingsParams {
  start_time?: string
  end_time?: string
  max_players?: number
  courts?: number[]
  /** null or omit with "unlimited" = no cap; positive integer = max pair-arranged matches */
  pair_matches_limit?: number | null | "unlimited"
}

export interface PlaceholderPlayerParams {
  name: string
  gender: Gender
  tier: Tier
  stars: number
}

/** Host/co-host game with live session — used to deep-link on app open. */
export interface ActiveManageGame {
  id: number
  title: string | null
}

export interface AuthUser {
  id: number
  email: string | null
  name: string
  avatar_url?: string | null
  gender: Gender
  phone: string | null
  guest?: boolean
  email_verified?: boolean
  rank: PlayerRank | null
  declared_rank?: PlayerRank | null
  stats?: UserStats
  profile?: UserProfile
  active_manage_game?: ActiveManageGame | null
}

export interface UpdateProfileParams {
  name?: string
  gender?: Gender
  phone?: string
}

export type GameDetailScreenVariant = "legacy" | "simple"

export interface ExperimentsPayload {
  game_detail_screen: GameDetailScreenVariant
}

export interface AuthResponse {
  user: AuthUser
  stats?: UserStats
  profile?: UserProfile
  experiments?: ExperimentsPayload
  active_manage_game?: ActiveManageGame | null
}

export type InviteGameMode = "join" | "live" | "closed"

export interface InviteGameInfo {
  id: number
  description: string | null
  match_type: string
  status: string
  players_count: number
  max_players: number
  start_time: string
  end_time: string
  location: string | null
  host_name: string | null
  courts?: number[] | null
  mode: InviteGameMode
}

export interface InviteLivePlayer {
  id: number
  name: string | null
  avatar_url?: string | null
  gender?: Gender
  rank?: PlayerRank | null
  host_rated_tier?: Tier | null
  host_rated_stars?: number | null
  session_matches: { played: number; wins: number; losses: number }
}

export interface InviteLiveMatch {
  id: number
  match_number: number
  status: "pending" | "ongoing" | "finished"
  priority?: boolean
  court_number?: number | null
  winner_team?: "team_a" | "team_b" | null
  team_a_score?: number | null
  team_b_score?: number | null
  team_a: Array<{ id: number; name: string | null; avatar_url?: string | null }>
  team_b: Array<{ id: number; name: string | null; avatar_url?: string | null }>
}

export interface InviteResponse {
  game: InviteGameInfo
  players?: InviteLivePlayer[]
  matches?: InviteLiveMatch[]
  match_counts?: GameMatchCounts
}
