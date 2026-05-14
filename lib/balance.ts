import type { GamePlayer } from "./api"

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

export function hasWideSkillGap(players: GamePlayer[]): boolean {
  const tiers = players
    .map((p) => p.rank?.tier)
    .filter((t) => t != null)
    .map((t) => TIER_ORDER[t as string] ?? 0)

  if (tiers.length < 2) return false
  return Math.max(...tiers) - Math.min(...tiers) >= 3
}
