import type { GamePlayer } from "../api"
import type { FairnessLevel, FairnessResult, LineupSkillGapInfo } from "./types"
import { DEFAULT_RATING, effectiveTierKey, getRating } from "./rating"

const TIER_ORDER: Record<string, number> = {
  newbie: 0,
  beginner_plus: 1,
  lower_intermediate: 2,
  intermediate: 3,
  upper_intermediate: 4,
  advanced: 5,
  semi_pro: 6,
  professional: 7,
}

export function calcFairness(
  teamAIds: number[],
  teamBIds: number[],
  players: GamePlayer[],
): FairnessResult {
  const ratingMap = new Map(players.map((p) => [p.id, getRating(p)]))

  const ratingsA = teamAIds.map((id) => ratingMap.get(id) ?? DEFAULT_RATING)
  const ratingsB = teamBIds.map((id) => ratingMap.get(id) ?? DEFAULT_RATING)

  const avgA = ratingsA.length > 0 ? Math.round(ratingsA.reduce((a, b) => a + b, 0) / ratingsA.length) : 0
  const avgB = ratingsB.length > 0 ? Math.round(ratingsB.reduce((a, b) => a + b, 0) / ratingsB.length) : 0
  const diff = Math.abs(avgA - avgB)

  let level: FairnessLevel = "good"
  if (diff > 300) level = "poor"
  else if (diff >= 100) level = "moderate"

  return { avgA, avgB, diff, level }
}

/** Warn only for players in this match lineup (not the whole lobby). */
export function lineupSkillGap(
  teamAIds: number[],
  teamBIds: number[],
  players: GamePlayer[],
): LineupSkillGapInfo {
  const ids = [...teamAIds, ...teamBIds]
  if (ids.length < 2) {
    return { showWarning: false, tierSpread: 0, ratingSpread: 0, minTier: null, maxTier: null }
  }

  const selected = ids
    .map((id) => players.find((p) => p.id === id))
    .filter((p): p is GamePlayer => p != null)

  const tierIndices = selected
    .map((p) => effectiveTierKey(p))
    .filter((t): t is string => t != null)
    .map((t) => TIER_ORDER[t] ?? 0)

  const ratings = selected.map((p) => getRating(p))

  const tierSpread =
    tierIndices.length >= 2 ? Math.max(...tierIndices) - Math.min(...tierIndices) : 0
  const ratingSpread =
    ratings.length >= 2 ? Math.max(...ratings) - Math.min(...ratings) : 0

  const minIdx = tierIndices.length ? Math.min(...tierIndices) : 0
  const maxIdx = tierIndices.length ? Math.max(...tierIndices) : 0
  const tierName = (idx: number) =>
    Object.entries(TIER_ORDER).find(([, v]) => v === idx)?.[0] ?? null

  return {
    showWarning: tierSpread >= 3 || ratingSpread > 1200,
    tierSpread,
    ratingSpread,
    minTier: tierName(minIdx),
    maxTier: tierName(maxIdx),
  }
}

/** @deprecated Use lineupSkillGap for match editor warnings. */
export function hasWideSkillGap(players: GamePlayer[]): boolean {
  return lineupSkillGap([], [], players).showWarning
}
