export const TIER_RANGES: Record<string, [number, number]> = {
  newbie: [0, 399], beginner_plus: [400, 799], lower_intermediate: [800, 1199],
  intermediate: [1200, 1499], upper_intermediate: [1500, 1799], advanced: [1800, 2099],
  semi_pro: [2100, 2399], professional: [2400, 2800],
}

export function ratingToStars(tier: string, rating: number): number {
  const bounds = TIER_RANGES[tier] || [0, 399]
  const [low, high] = bounds
  const range = high - low
  if (range === 0) return 1
  const raw = Math.round(((rating - low) / range) * 4) + 1
  return Math.max(1, Math.min(5, raw))
}

export function ratingFromTierAndStars(tier: string, stars: number): number {
  const bounds = TIER_RANGES[tier] || [0, 399]
  const [low, high] = bounds
  const s = Math.max(1, Math.min(5, stars))
  return Math.round(low + ((s - 1) * (high - low)) / 4)
}
