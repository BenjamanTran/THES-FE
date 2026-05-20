import type { GamePlayer } from "../api"
import { ratingFromTierAndStars, ratingToStars } from "../rating-stars"

export const DEFAULT_RATING = 200 // 3★ newbie

/** Same skill points as badges (tier + stars), not raw global rating alone. */
export function getRating(player: GamePlayer): number {
  if (player.host_rated_tier && player.host_rated_stars != null) {
    return ratingFromTierAndStars(player.host_rated_tier, player.host_rated_stars)
  }
  if (player.placeholder && player.declared_rank) {
    const { tier, rating } = player.declared_rank
    return ratingFromTierAndStars(tier, ratingToStars(tier, rating))
  }
  if (player.rank) {
    const { tier, rating } = player.rank
    return ratingFromTierAndStars(tier, ratingToStars(tier, rating))
  }
  return DEFAULT_RATING
}

export function effectiveTierKey(player: GamePlayer): string | null {
  if (player.host_rated_tier) return player.host_rated_tier
  if (player.placeholder && player.declared_rank) return player.declared_rank.tier
  return player.rank?.tier ?? null
}
