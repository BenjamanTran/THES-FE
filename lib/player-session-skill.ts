import type { GamePlayer, MatchPlayer, Tier } from "./api"

type SessionSkillFields = Pick<GamePlayer, "host_rated_tier" | "host_rated_stars">

export function hasHostSessionSkill(
  player: SessionSkillFields | null | undefined,
): player is SessionSkillFields & { host_rated_tier: Tier; host_rated_stars: number } {
  return player?.host_rated_tier != null && player.host_rated_stars != null
}

/** In-game skill badge tier — host session rating only. */
export function sessionSkillTier(player: SessionSkillFields | null | undefined): Tier | null {
  return player?.host_rated_tier ?? null
}

/** In-game skill stars — host session rating only. */
export function sessionSkillStars(player: SessionSkillFields | null | undefined): number | null {
  if (!hasHostSessionSkill(player)) return null
  return player.host_rated_stars
}

/** Resolve session skill from match roster entry + game player list. */
export function sessionSkillFromMatchPlayer(
  mp: MatchPlayer,
  gamePlayers: GamePlayer[] | undefined,
): SessionSkillFields {
  const gp = gamePlayers?.find((p) => p.id === mp.id)
  if (hasHostSessionSkill(gp)) {
    return {
      host_rated_tier: gp.host_rated_tier,
      host_rated_stars: gp.host_rated_stars,
    }
  }
  return {
    host_rated_tier: mp.host_rated_tier ?? null,
    host_rated_stars: mp.host_rated_stars ?? null,
  }
}
