import type { GamePlayer } from "./api"
import { ratingFromTierAndStars } from "./rating-stars"

const DEFAULT_RATING = 600

export type FairnessLevel = "good" | "moderate" | "poor"

export interface FairnessResult {
  avgA: number
  avgB: number
  diff: number
  level: FairnessLevel
}

export interface BalanceResult {
  teamA: number[]
  teamB: number[]
}

function getRating(player: GamePlayer): number {
  if (player.host_rated_tier && player.host_rated_stars) {
    return ratingFromTierAndStars(player.host_rated_tier, player.host_rated_stars)
  }
  return player.rank?.rating ?? DEFAULT_RATING
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function combinations(arr: number[], size: number): number[][] {
  if (size === 0) return [[]]
  if (arr.length < size) return []
  const result: number[][] = []
  for (let i = 0; i <= arr.length - size; i++) {
    const rest = combinations(arr.slice(i + 1), size - 1)
    for (const combo of rest) {
      result.push([arr[i], ...combo])
    }
  }
  return result
}

/**
 * Select players and balance into two teams.
 * When more players than needed: prioritize those with fewest matches played.
 * Then balance by rating (brute-force for small N, greedy for large N).
 *
 * @param matchCounts - map of player id → number of matches played in this game session
 */
export function balanceTeams(
  players: GamePlayer[],
  teamSize: number,
  matchCounts?: Record<number, number>,
): BalanceResult {
  if (players.length === 0) return { teamA: [], teamB: [] }

  const totalNeeded = teamSize * 2
  let selected = players

  if (players.length > totalNeeded && matchCounts) {
    selected = selectByFewestMatches(players, totalNeeded, matchCounts)
  }

  if (selected.length === 0) return { teamA: [], teamB: [] }
  if (teamSize === 1 && selected.length === 2) {
    return { teamA: [selected[0].id], teamB: [selected[1].id] }
  }

  if (selected.length <= totalNeeded && selected.length >= 2) {
    return bruteForcePairing(selected, teamSize)
  }

  return greedyPartition(selected, teamSize)
}

function selectByFewestMatches(
  players: GamePlayer[],
  count: number,
  matchCounts: Record<number, number>,
): GamePlayer[] {
  const grouped = new Map<number, GamePlayer[]>()
  for (const p of players) {
    const mc = matchCounts[p.id] ?? 0
    if (!grouped.has(mc)) grouped.set(mc, [])
    grouped.get(mc)!.push(p)
  }

  const sortedKeys = [...grouped.keys()].sort((a, b) => a - b)
  const result: GamePlayer[] = []
  for (const key of sortedKeys) {
    const group = shuffle(grouped.get(key)!)
    for (const p of group) {
      if (result.length >= count) break
      result.push(p)
    }
    if (result.length >= count) break
  }
  return result
}

function bruteForcePairing(players: GamePlayer[], teamSize: number): BalanceResult {
  const ids = shuffle(players.map((p) => p.id))
  const ratingMap = new Map(players.map((p) => [p.id, getRating(p)]))

  const teamACombos = combinations(ids, teamSize)

  let bestPairs: { a: number[]; b: number[] }[] = []
  let bestDiff = Infinity

  for (const a of teamACombos) {
    const aSet = new Set(a)
    const b = ids.filter((id) => !aSet.has(id))
    if (b.length > teamSize) continue

    const sumA = a.reduce((s, id) => s + (ratingMap.get(id) ?? DEFAULT_RATING), 0)
    const sumB = b.reduce((s, id) => s + (ratingMap.get(id) ?? DEFAULT_RATING), 0)
    const diff = Math.abs(sumA - sumB)

    if (diff < bestDiff) {
      bestDiff = diff
      bestPairs = [{ a, b }]
    } else if (diff === bestDiff) {
      bestPairs.push({ a, b })
    }
  }

  const pick = bestPairs[Math.floor(Math.random() * bestPairs.length)]
  return { teamA: pick?.a ?? [], teamB: pick?.b ?? [] }
}

function greedyPartition(players: GamePlayer[], teamSize: number): BalanceResult {
  const shuffled = shuffle(players)
  const sorted = shuffled.sort((a, b) => getRating(b) - getRating(a))

  const teamA: number[] = []
  const teamB: number[] = []
  let sumA = 0
  let sumB = 0

  for (const p of sorted) {
    if (teamA.length >= teamSize && teamB.length >= teamSize) break

    if (teamA.length >= teamSize) {
      teamB.push(p.id)
      sumB += getRating(p)
    } else if (teamB.length >= teamSize) {
      teamA.push(p.id)
      sumA += getRating(p)
    } else if (sumA <= sumB) {
      teamA.push(p.id)
      sumA += getRating(p)
    } else {
      teamB.push(p.id)
      sumB += getRating(p)
    }
  }

  return { teamA, teamB }
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
): BalanceResult {
  const slotsA = teamSize - teamA.length
  const slotsB = teamSize - teamB.length
  const totalSlots = slotsA + slotsB
  if (totalSlots === 0) return { teamA: [...teamA], teamB: [...teamB] }
  if (candidates.length === 0) return { teamA: [...teamA], teamB: [...teamB] }

  const pool = matchCounts
    ? selectByFewestMatches(candidates, Math.max(totalSlots, Math.min(candidates.length, totalSlots + 4)), matchCounts)
    : candidates

  const ratingMap = new Map(allPlayers.map((p) => [p.id, getRating(p)]))
  const candidateIds = pool.map((c) => c.id)

  const pickCombos = combinations(candidateIds, Math.min(totalSlots, candidateIds.length))

  let bestA = [...teamA]
  let bestB = [...teamB]
  let bestDiff = Infinity
  let bestMatchSum = Infinity

  for (const picked of pickCombos) {
    const mcSum = matchCounts ? picked.reduce((s, id) => s + (matchCounts[id] ?? 0), 0) : 0

    if (mcSum > bestMatchSum) continue

    let newA: number[]
    let newB: number[]

    if (slotsA === 0) {
      newA = [...teamA]
      newB = [...teamB, ...picked.slice(0, slotsB)]
    } else if (slotsB === 0) {
      newA = [...teamA, ...picked.slice(0, slotsA)]
      newB = [...teamB]
    } else {
      const best = findBestAssignment(teamA, teamB, picked, slotsA, slotsB, ratingMap)
      newA = best.a
      newB = best.b
    }

    const sumA = bestSumFor(newA, ratingMap)
    const sumB = bestSumFor(newB, ratingMap)
    const diff = Math.abs(sumA - sumB)

    if (mcSum < bestMatchSum || (mcSum === bestMatchSum && diff < bestDiff)) {
      bestMatchSum = mcSum
      bestDiff = diff
      bestA = newA
      bestB = newB
    }
  }

  return { teamA: bestA, teamB: bestB }
}

function findBestAssignment(
  teamA: number[], teamB: number[], picked: number[],
  slotsA: number, slotsB: number,
  ratingMap: Map<number, number>,
): { a: number[]; b: number[] } {
  const assignCombos = combinations(picked, slotsA)
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
    if (diff < bestDiff) { bestDiff = diff; bestA = newA; bestB = newB }
  }

  return { a: bestA, b: bestB }
}

function bestSumFor(ids: number[], ratingMap: Map<number, number>): number {
  return ids.reduce((s, id) => s + (ratingMap.get(id) ?? DEFAULT_RATING), 0)
}

export function hasWideSkillGap(players: GamePlayer[]): boolean {
  const tiers = players
    .map((p) => p.rank?.tier)
    .filter((t) => t != null)
    .map((t) => TIER_ORDER[t as string] ?? 0)

  if (tiers.length < 2) return false
  return Math.max(...tiers) - Math.min(...tiers) >= 3
}
