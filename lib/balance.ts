import type { GamePlayer } from "./api"
import { ratingFromTierAndStars } from "./rating-stars"

const DEFAULT_RATING = 200 // 3★ newbie

export type DoublesGenderMode = "any" | "mens" | "mixed" | "womens"

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

/** @deprecated Always balanced-first; kept for API compatibility */
export type BalanceTier = 0 | 1

interface ScoredOption {
  result: BalanceResult
  mcSum: number
  diff: number
}

function getRating(player: GamePlayer): number {
  if (player.host_rated_tier && player.host_rated_stars) {
    return ratingFromTierAndStars(player.host_rated_tier, player.host_rated_stars)
  }
  if (player.placeholder && player.declared_rank) {
    return player.declared_rank.rating
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
function filterPoolByGender(players: GamePlayer[], mode: DoublesGenderMode): GamePlayer[] {
  if (mode === "any") return players
  if (mode === "mens") return players.filter((p) => p.gender === "male")
  if (mode === "womens") return players.filter((p) => p.gender === "female")
  return players.filter((p) => p.gender === "male" || p.gender === "female")
}

function teamMatchesGenderMode(
  ids: number[],
  players: GamePlayer[],
  teamSize: number,
  mode: DoublesGenderMode,
): boolean {
  if (mode === "any" || teamSize !== 2) return true
  const genders = ids.map((id) => players.find((p) => p.id === id)?.gender)
  if (mode === "mens") return genders.every((g) => g === "male")
  if (mode === "womens") return genders.every((g) => g === "female")
  return genders.length === 2 && genders.includes("male") && genders.includes("female")
}

function selectMixedDoublesFour(
  players: GamePlayer[],
  matchCounts?: Record<number, number>,
): GamePlayer[] | null {
  const males = players.filter((p) => p.gender === "male")
  const females = players.filter((p) => p.gender === "female")
  if (males.length < 2 || females.length < 2) return null

  const pickTwo = (pool: GamePlayer[]) =>
    matchCounts ? selectByFewestMatches(pool, 2, matchCounts) : shuffle(pool).slice(0, 2)

  return [...pickTwo(males), ...pickTwo(females)]
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function lineupKey(result: BalanceResult): string {
  return [...result.teamA, ...result.teamB].sort((a, b) => a - b).join(",")
}

function pickByBalanceTier(
  options: ScoredOption[],
  _tier: BalanceTier,
  exclude?: BalanceResult,
): BalanceResult {
  if (options.length === 0) return { teamA: [], teamB: [] }

  const minMc = options[0].mcSum
  let pool = options.filter((o) => o.mcSum === minMc)

  const balanced = pool.filter((o) => o.diff < 100)
  const moderate = pool.filter((o) => o.diff >= 100 && o.diff < 300)
  const acceptable = pool.filter((o) => o.diff < 300)

  const pickFrom = (candidates: ScoredOption[]) => {
    if (candidates.length === 0) return null
    if (exclude) {
      const exKey = lineupKey(exclude)
      const alt = candidates.filter((o) => lineupKey(o.result) !== exKey)
      if (alt.length > 0) return pickRandom(alt).result
    }
    return pickRandom(candidates).result
  }

  const balancedPick = pickFrom(balanced)
  if (balancedPick) return balancedPick

  const moderatePick = pickFrom(moderate)
  if (moderatePick) return moderatePick

  return (acceptable[0] ?? pool[0]).result
}

function pairingOptionsForSubset(
  subset: GamePlayer[],
  teamSize: number,
  genderMode: DoublesGenderMode,
  allPlayers: GamePlayer[],
  mixedOnly: boolean,
): BalanceResult[] {
  if (mixedOnly && teamSize === 2) {
    const males = subset.filter((p) => p.gender === "male")
    const females = subset.filter((p) => p.gender === "female")
    if (males.length !== 2 || females.length !== 2) return []
    const [m1, m2] = males
    const [f1, f2] = females
    return [
      { teamA: [m1.id, f1.id], teamB: [m2.id, f2.id] },
      { teamA: [m1.id, f2.id], teamB: [m2.id, f1.id] },
    ]
  }

  if (teamSize === 1 && subset.length === 2) {
    return [{ teamA: [subset[0].id], teamB: [subset[1].id] }]
  }

  const ids = subset.map((p) => p.id)
  const results: BalanceResult[] = []
  for (const a of combinations(ids, teamSize)) {
    if (!teamMatchesGenderMode(a, allPlayers, teamSize, genderMode)) continue
    const aSet = new Set(a)
    const b = ids.filter((id) => !aSet.has(id))
    if (b.length !== teamSize) continue
    if (!teamMatchesGenderMode(b, allPlayers, teamSize, genderMode)) continue
    results.push({ teamA: a, teamB: b })
  }
  return results
}

function collectBalanceOptions(
  pool: GamePlayer[],
  teamSize: number,
  genderMode: DoublesGenderMode,
  allPlayers: GamePlayer[],
  matchCounts?: Record<number, number>,
  mixedOnly = false,
): ScoredOption[] {
  const totalNeeded = teamSize * 2
  const ids = pool.map((p) => p.id)
  const rosterCombos = pool.length === totalNeeded ? [ids] : combinations(ids, totalNeeded)
  const scored: ScoredOption[] = []

  for (const rosterIds of rosterCombos) {
    if (mixedOnly && !isValidMixedRoster(rosterIds, allPlayers)) continue

    const mcSum = matchCounts
      ? rosterIds.reduce((s, id) => s + (matchCounts[id] ?? 0), 0)
      : 0

    const subset = pool.filter((p) => rosterIds.includes(p.id))
    for (const pairing of pairingOptionsForSubset(
      subset,
      teamSize,
      genderMode,
      allPlayers,
      mixedOnly,
    )) {
      if (pairing.teamA.length < teamSize || pairing.teamB.length < teamSize) continue
      scored.push({
        result: pairing,
        mcSum,
        diff: calcFairness(pairing.teamA, pairing.teamB, allPlayers).diff,
      })
    }
  }

  return scored.sort((a, b) => a.mcSum - b.mcSum || a.diff - b.diff)
}

export function balanceTeams(
  players: GamePlayer[],
  teamSize: number,
  matchCounts?: Record<number, number>,
  genderMode: DoublesGenderMode = "any",
  tier: BalanceTier = 0,
  exclude?: BalanceResult,
): BalanceResult {
  if (players.length === 0) return { teamA: [], teamB: [] }

  const pool =
    teamSize === 2 && genderMode !== "any" ? filterPoolByGender(players, genderMode) : players

  const totalNeeded = teamSize * 2

  if (pool.length >= totalNeeded) {
    const options = collectBalanceOptions(
      pool,
      teamSize,
      genderMode,
      players,
      matchCounts,
      genderMode === "mixed" && teamSize === 2,
    )
    const picked = pickByBalanceTier(options, tier, exclude)
    if (picked.teamA.length >= teamSize && picked.teamB.length >= teamSize) return picked
  }

  if (genderMode === "mixed" && teamSize === 2) {
    const selected = selectMixedDoublesFour(pool, matchCounts)
    if (!selected || selected.length < totalNeeded) return { teamA: [], teamB: [] }
    const options = collectBalanceOptions(selected, teamSize, genderMode, players, matchCounts, true)
    return pickByBalanceTier(options, tier, exclude)
  }

  const selected = pool.length > totalNeeded
    ? (matchCounts ? selectByFewestMatches(pool, totalNeeded, matchCounts) : shuffle(pool).slice(0, totalNeeded))
    : pool

  if (selected.length === 0) return { teamA: [], teamB: [] }

  const options = collectBalanceOptions(selected, teamSize, genderMode, players, matchCounts)
  if (options.length > 0) return pickByBalanceTier(options, tier, exclude)

  return greedyPartition(selected, teamSize, genderMode, players)
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

function isValidMixedRoster(rosterIds: number[], allPlayers: GamePlayer[]): boolean {
  let males = 0
  let females = 0
  for (const id of rosterIds) {
    const g = allPlayers.find((p) => p.id === id)?.gender
    if (g === "male") males += 1
    else if (g === "female") females += 1
  }
  return males === 2 && females === 2
}

function greedyPartition(
  players: GamePlayer[],
  teamSize: number,
  genderMode: DoublesGenderMode,
  allPlayers: GamePlayer[],
): BalanceResult {
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
  genderMode: DoublesGenderMode = "any",
  tier: BalanceTier = 0,
  exclude?: BalanceResult,
): BalanceResult {
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
    scored.push({ result: { teamA: newA, teamB: newB }, mcSum, diff })
  }

  if (scored.length === 0) return { teamA: [...teamA], teamB: [...teamB] }

  scored.sort((a, b) => a.mcSum - b.mcSum || a.diff - b.diff)
  return pickByBalanceTier(scored, tier, exclude)
}

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
