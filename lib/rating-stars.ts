/**
 * 1★ = tier base; +100 per star; 5★ = base+400; +100 promotion → next tier at base+500.
 */
export const STAR_STEP = 100
export const STAR_SPAN = STAR_STEP * 4
export const TIER_SPAN = 500

const TIER_ORDER = [
  "newbie",
  "beginner_plus",
  "lower_intermediate",
  "intermediate",
  "upper_intermediate",
  "advanced",
  "semi_pro",
  "professional",
] as const

export const TIER_BASE: Record<string, number> = Object.fromEntries(
  TIER_ORDER.map((tier, i) => [tier, i * TIER_SPAN]),
)

export const TIER_RANGES: Record<string, [number, number]> = Object.fromEntries(
  Object.entries(TIER_BASE).map(([tier, base]) => [
    tier,
    [base, base + STAR_SPAN] as [number, number],
  ]),
)

export function ratingFromTierAndStars(tier: string, stars: number): number {
  const base = TIER_BASE[tier] ?? 0
  const s = Math.max(0.5, Math.min(5, stars))
  return Math.round(base + (s - 1) * STAR_STEP)
}

export function ratingToStars(tier: string, rating: number): number {
  const base = TIER_BASE[tier] ?? 0
  const offset = Math.max(rating - base, 0)
  return Math.max(0.5, Math.min(5, Math.round((offset / STAR_STEP + 1) * 100) / 100))
}
