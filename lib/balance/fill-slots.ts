import type { GamePlayer } from "../api"
import type { PairBalanceOptions } from "../player-pairs"
import { pairSplitPenalty } from "../player-pairs"
import type { BalanceResult, BalanceTier, DoublesGenderMode, ScoredOption } from "./types"
import { pickByBalanceTier } from "./balance-teams"
import { calcFairness } from "./fairness"
import { getRating } from "./rating"
import {
  bestSumFor,
  combinations,
  filterPoolByGender,
  selectByFewestMatches,
  teamMatchesGenderMode,
} from "./utils"

function findBestAssignment(
  teamA: number[],
  teamB: number[],
  picked: number[],
  slotsA: number,
  slotsB: number,
  ratingMap: Map<number, number>,
  allPlayers: GamePlayer[],
  teamSize: number,
  genderMode: DoublesGenderMode,
): { a: number[]; b: number[] } {
  const assignCombos = combinations(picked, slotsA).filter((forA) => {
    const newA = [...teamA, ...forA]
    if (!teamMatchesGenderMode(newA, allPlayers, teamSize, genderMode)) return false
    if (slotsB === 0) return true
    const forASet = new Set(forA)
    const forB = picked.filter((id) => !forASet.has(id)).slice(0, slotsB)
    const newB = [...teamB, ...forB]
    return teamMatchesGenderMode(newB, allPlayers, teamSize, genderMode)
  })

  let bestA = [...teamA]
  let bestB = [...teamB]
  let bestDiff = Infinity

  for (const forA of assignCombos) {
    const forASet = new Set(forA)
    const forB = picked.filter((id) => !forASet.has(id)).slice(0, slotsB)
    if (forB.length < slotsB) continue
    const newA = [...teamA, ...forA]
    const newB = [...teamB, ...forB]
    const diff = Math.abs(bestSumFor(newA, ratingMap) - bestSumFor(newB, ratingMap))
    if (diff < bestDiff) {
      bestDiff = diff
      bestA = newA
      bestB = newB
    }
  }

  return { a: bestA, b: bestB }
}

/**
 * Fill empty slots in partially-assigned teams.
 * Keeps existing members, picks candidate(s) with fewest matches played,
 * then among those picks the one(s) that best balance the two teams by rating.
 */
export function fillSlots(
  teamA: number[],
  teamB: number[],
  teamSize: number,
  candidates: GamePlayer[],
  allPlayers: GamePlayer[],
  matchCounts?: Record<number, number>,
  genderMode: DoublesGenderMode = "any",
  tier: BalanceTier = 0,
  exclude?: BalanceResult,
  pairOptions?: PairBalanceOptions,
): BalanceResult {
  const pairs = pairOptions?.pairs ?? []
  const requirePairs = pairOptions?.pairPolicy === "require"
  const slotsA = teamSize - teamA.length
  const slotsB = teamSize - teamB.length
  const totalSlots = slotsA + slotsB
  if (totalSlots === 0) return { teamA: [...teamA], teamB: [...teamB] }
  if (candidates.length === 0) return { teamA: [...teamA], teamB: [...teamB] }

  const filteredCandidates =
    teamSize === 2 && genderMode !== "any"
      ? filterPoolByGender(candidates, genderMode)
      : candidates

  const pool = matchCounts
    ? selectByFewestMatches(
        filteredCandidates,
        Math.max(totalSlots, Math.min(filteredCandidates.length, totalSlots + 4)),
        matchCounts,
      )
    : filteredCandidates

  const ratingMap = new Map(allPlayers.map((p) => [p.id, getRating(p)]))
  const candidateIds = pool.map((c) => c.id)

  const pickCombos = combinations(candidateIds, Math.min(totalSlots, candidateIds.length))
  const scored: ScoredOption[] = []

  for (const picked of pickCombos) {
    const mcSum = matchCounts ? picked.reduce((s, id) => s + (matchCounts[id] ?? 0), 0) : 0

    let newA: number[]
    let newB: number[]

    if (slotsA === 0) {
      newA = [...teamA]
      newB = [...teamB, ...picked.slice(0, slotsB)]
    } else if (slotsB === 0) {
      newA = [...teamA, ...picked.slice(0, slotsA)]
      newB = [...teamB]
    } else {
      const best = findBestAssignment(
        teamA,
        teamB,
        picked,
        slotsA,
        slotsB,
        ratingMap,
        allPlayers,
        teamSize,
        genderMode,
      )
      newA = best.a
      newB = best.b
    }

    if (
      genderMode !== "any" &&
      teamSize === 2 &&
      (!teamMatchesGenderMode(newA, allPlayers, teamSize, genderMode) ||
        !teamMatchesGenderMode(newB, allPlayers, teamSize, genderMode))
    ) {
      continue
    }

    const diff = calcFairness(newA, newB, allPlayers).diff
    const pairPen = pairSplitPenalty(newA, newB, pairs)
    if (requirePairs && pairPen > 0) continue
    scored.push({ result: { teamA: newA, teamB: newB }, mcSum, diff, pairPenalty: pairPen })
  }

  if (scored.length === 0) return { teamA: [...teamA], teamB: [...teamB] }

  scored.sort(
    (a, b) =>
      a.mcSum - b.mcSum ||
      (a.pairPenalty ?? 0) - (b.pairPenalty ?? 0) ||
      a.diff - b.diff,
  )
  return pickByBalanceTier(scored, tier, exclude)
}
