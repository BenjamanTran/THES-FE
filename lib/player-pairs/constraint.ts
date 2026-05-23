import type { BalanceResult } from "@/lib/balance"
import type { PlayerPair } from "./types"

export function isPairSplit(
  teamA: number[],
  teamB: number[],
  userA: number,
  userB: number,
): boolean {
  const aOnA = teamA.includes(userA)
  const aOnB = teamB.includes(userA)
  const bOnA = teamA.includes(userB)
  const bOnB = teamB.includes(userB)

  if (!(aOnA || aOnB) || !(bOnA || bOnB)) return false
  return (aOnA && bOnB) || (aOnB && bOnA)
}

export function violatesPairs(
  teamA: number[],
  teamB: number[],
  pairs: PlayerPair[],
): boolean {
  return pairs.some((p) => isPairSplit(teamA, teamB, p.userA, p.userB))
}

export function countSplitPairs(
  teamA: number[],
  teamB: number[],
  pairs: PlayerPair[],
): number {
  return pairs.filter((p) => isPairSplit(teamA, teamB, p.userA, p.userB)).length
}

export function filterValidPairings(
  options: BalanceResult[],
  pairs: PlayerPair[],
): BalanceResult[] {
  if (pairs.length === 0) return options
  return options.filter((o) => !violatesPairs(o.teamA, o.teamB, pairs))
}

/** Penalty for prefer mode: lower is better */
export function pairSplitPenalty(
  teamA: number[],
  teamB: number[],
  pairs: PlayerPair[],
): number {
  return countSplitPairs(teamA, teamB, pairs) * 10_000
}
