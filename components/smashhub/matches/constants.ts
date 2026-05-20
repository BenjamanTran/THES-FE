import type { SkillLevel } from "../skill-badge"

export const TIER_OPTIONS: SkillLevel[] = [
  "newbie",
  "beginner_plus",
  "lower_intermediate",
  "intermediate",
  "upper_intermediate",
  "advanced",
  "semi_pro",
  "professional",
]

export const RADIUS_OPTIONS = [3, 5, 10, 20]

export const PRICE_OPTIONS: Array<{ label: string; value: number }> = [
  { label: "Không giới hạn", value: 0 },
  { label: "≤ 50K", value: 50000 },
  { label: "≤ 80K", value: 80000 },
  { label: "≤ 120K", value: 120000 },
  { label: "≤ 200K", value: 200000 },
  { label: "≤ 500K", value: 500000 },
]

export type MatchTypeFilter = "any" | "singles" | "doubles"

export interface Filters {
  tier: SkillLevel | null
  radiusKm: number
  matchType: MatchTypeFilter
  notFull: boolean
  useLocation: boolean
  priceMax: number
}

export const ALL_FILTERS: Filters = {
  tier: null,
  radiusKm: 5,
  matchType: "any",
  notFull: false,
  useLocation: false,
  priceMax: 0,
}

export const PER_PAGE = 15
