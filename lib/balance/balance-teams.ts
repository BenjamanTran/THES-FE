import type { GamePlayer } from "../api"
import type { PairBalanceOptions } from "../player-pairs"
import { filterValidPairings, pairSplitPenalty } from "../player-pairs"
import type { BalanceResult, BalanceTier, DoublesGenderMode, ScoredOption } from "./types"
import { calcFairness } from "./fairness"
import {
  combinations,
  filterPoolByGender,
  greedyPartition,
  isValidMixedRoster,
  lineupKey,
  pickRandom,
  selectByFewestMatches,
  shuffle,
  teamMatchesGenderMode,
} from "./utils"

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

function pickByBalanceTier(
  options: ScoredOption[],
  _tier: BalanceTier,
  exclude?: BalanceResult,
): BalanceResult {
  if (options.length === 0) return { teamA: [], teamB: [] }

  const minMc = options[0].mcSum
  const pool = options.filter((o) => o.mcSum === minMc)

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

function compareScored(a: ScoredOption, b: ScoredOption): number {
  return (
    a.mcSum - b.mcSum ||
    (a.pairPenalty ?? 0) - (b.pairPenalty ?? 0) ||
    a.diff - b.diff
  )
}

function collectBalanceOptions(
  pool: GamePlayer[],
  teamSize: number,
  genderMode: DoublesGenderMode,
  allPlayers: GamePlayer[],
  matchCounts?: Record<number, number>,
  mixedOnly = false,
  pairOptions?: PairBalanceOptions,
): ScoredOption[] {
  const pairs = pairOptions?.pairs ?? []
  const requirePairs = pairOptions?.pairPolicy === "require"
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
      const pairPen = pairSplitPenalty(pairing.teamA, pairing.teamB, pairs)
      if (requirePairs && pairPen > 0) continue
      scored.push({
        result: pairing,
        mcSum,
        diff: calcFairness(pairing.teamA, pairing.teamB, allPlayers).diff,
        pairPenalty: pairPen,
      })
    }
  }

  return scored.sort(compareScored)
}

/**
 * Select players and balance into two teams.
 * When more players than needed: prioritize those with fewest matches played.
 * Then balance by rating (brute-force for small N, greedy for large N).
 */
export function balanceTeams(
  players: GamePlayer[],
  teamSize: number,
  matchCounts?: Record<number, number>,
  genderMode: DoublesGenderMode = "any",
  tier: BalanceTier = 0,
  exclude?: BalanceResult,
  pairOptions?: PairBalanceOptions,
): BalanceResult {
  const pairs = pairOptions?.pairs ?? []
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
      pairOptions,
    )
    const picked = pickByBalanceTier(options, tier, exclude)
    if (picked.teamA.length >= teamSize && picked.teamB.length >= teamSize) return picked
  }

  if (genderMode === "mixed" && teamSize === 2) {
    const selected = selectMixedDoublesFour(pool, matchCounts)
    if (!selected || selected.length < totalNeeded) return { teamA: [], teamB: [] }
    const options = collectBalanceOptions(
      selected,
      teamSize,
      genderMode,
      players,
      matchCounts,
      true,
      pairOptions,
    )
    return pickByBalanceTier(options, tier, exclude)
  }

  const selected =
    pool.length > totalNeeded
      ? matchCounts
        ? selectByFewestMatches(pool, totalNeeded, matchCounts)
        : shuffle(pool).slice(0, totalNeeded)
      : pool

  if (selected.length === 0) return { teamA: [], teamB: [] }

  const options = collectBalanceOptions(
    selected,
    teamSize,
    genderMode,
    players,
    matchCounts,
    false,
    pairOptions,
  )
  if (options.length > 0) return pickByBalanceTier(options, tier, exclude)

  const greedy = greedyPartition(selected, teamSize, genderMode, players)
  if (pairs.length === 0) return greedy
  if (pairOptions?.pairPolicy === "require" && pairSplitPenalty(greedy.teamA, greedy.teamB, pairs) > 0) {
    const valid = filterValidPairings([greedy], pairs)
    if (valid.length > 0) return valid[0]
    return { teamA: [], teamB: [] }
  }
  return greedy
}

export { pickByBalanceTier }
