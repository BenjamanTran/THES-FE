import type { GamePlayer } from "../api"
import { ratingFromTierAndStars } from "../rating-stars"
import { hasHostSessionSkill } from "../player-session-skill"

export const DEFAULT_RATING = 200 // 3★ newbie

/** In-game balance: host session rating only (not global rank). */
export function getRating(player: GamePlayer): number {
  if (hasHostSessionSkill(player)) {
    return ratingFromTierAndStars(player.host_rated_tier, player.host_rated_stars)
  }
  return DEFAULT_RATING
}

export function effectiveTierKey(player: GamePlayer): string | null {
  if (player.host_rated_tier) return player.host_rated_tier
  return null
}
