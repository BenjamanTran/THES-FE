import type { GamePlayer } from "../api"
import { ratingFromTierAndStars } from "../rating-stars"
import { hasHostSessionSkill, sessionSkillStars, sessionSkillTier } from "../player-session-skill"

export const DEFAULT_RATING = 200 // 3★ newbie

/** In-game balance: host session rating first, self-declared/stored rank fallback. */
export function getRating(player: GamePlayer): number {
  if (hasHostSessionSkill(player)) {
    return ratingFromTierAndStars(player.host_rated_tier, player.host_rated_stars)
  }
  const tier = sessionSkillTier(player)
  const stars = sessionSkillStars(player)
  if (tier != null && stars != null) {
    return ratingFromTierAndStars(tier, stars)
  }
  return DEFAULT_RATING
}

export function effectiveTierKey(player: GamePlayer): string | null {
  return sessionSkillTier(player)
}
