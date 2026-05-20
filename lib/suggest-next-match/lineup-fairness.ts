import type { GamePlayer, MatchSummary } from "@/lib/api"
import { pendingSlotCounts, rotationFairnessCounts } from "@/lib/match-stats"

function lineupKey(teamA: number[], teamB: number[]) {
  return [...teamA, ...teamB].sort((a, b) => a - b).join(",")
}

function matchLineupKey(match: MatchSummary) {
  return lineupKey(
    match.team_a.map((p) => p.id),
    match.team_b.map((p) => p.id),
  )
}

function lineupFairnessLoads(
  teamA: number[],
  teamB: number[],
  fairness: Record<number, number>,
) {
  return [...teamA, ...teamB].map((id) => fairness[id] ?? 0)
}

function sessionMinFairness(playerIds: number[], fairness: Record<number, number>) {
  if (playerIds.length === 0) return 0
  return Math.min(...playerIds.map((id) => fairness[id] ?? 0))
}

function scoreLineupFairness(
  teamA: number[],
  teamB: number[],
  fairness: Record<number, number>,
  allPlayerIds: number[],
) {
  const counts = lineupFairnessLoads(teamA, teamB, fairness)
  const minSession = sessionMinFairness(allPlayerIds, fairness)
  const includesMin = counts.some((c) => c === minSession)
  const maxR = Math.max(...counts)
  const minR = Math.min(...counts)
  const sumR = counts.reduce((s, c) => s + c, 0)
  return { includesMin, maxR, spread: maxR - minR, sumR }
}

function compareLineupFairness(
  a: ReturnType<typeof scoreLineupFairness>,
  b: ReturnType<typeof scoreLineupFairness>,
) {
  if (a.includesMin !== b.includesMin) return a.includesMin ? -1 : 1
  if (a.maxR !== b.maxR) return a.maxR - b.maxR
  if (a.spread !== b.spread) return a.spread - b.spread
  return a.sumR - b.sumR
}

export function findPendingWithLineup(
  pending: MatchSummary[],
  teamA: number[],
  teamB: number[],
) {
  const key = lineupKey(teamA, teamB)
  return pending.find((m) => matchLineupKey(m) === key) ?? null
}

function pickBestFromPool(
  pending: MatchSummary[],
  fairness: Record<number, number>,
  allPlayerIds: number[],
  pendingSlots: Record<number, number>,
) {
  if (pending.length === 0) {
    throw new Error("pickBestFromPool: empty pool")
  }
  if (pending.length === 1) return pending[0]!

  let bestPool: MatchSummary[] = [pending[0]!]
  let bestScore = scoreLineupFairness(
    pending[0]!.team_a.map((p) => p.id),
    pending[0]!.team_b.map((p) => p.id),
    fairness,
    allPlayerIds,
  )

  for (let i = 1; i < pending.length; i++) {
    const m = pending[i]!
    const sm = scoreLineupFairness(
      m.team_a.map((p) => p.id),
      m.team_b.map((p) => p.id),
      fairness,
      allPlayerIds,
    )
    const cmp = compareLineupFairness(sm, bestScore)
    if (cmp < 0) {
      bestScore = sm
      bestPool = [m]
    } else if (cmp === 0) {
      bestPool.push(m)
    }
  }

  if (bestPool.length === 1) return bestPool[0]!

  return bestPool.reduce((best, m) => {
    const sumPending = (match: MatchSummary) =>
      [...match.team_a, ...match.team_b].reduce(
        (s, p) => s + (pendingSlots[p.id] ?? 0),
        0,
      )
    const pBest = sumPending(best)
    const pM = sumPending(m)
    if (pM !== pBest) return pM > pBest ? m : best
    return m.match_number > best.match_number ? m : best
  })
}

export function pickFairestPending(
  pending: MatchSummary[],
  fairness: Record<number, number>,
  allPlayerIds: number[],
) {
  return pickBestFromPool(pending, fairness, allPlayerIds, {})
}

/** Pick pending match to start — rotation (played) first, same spirit as create & start. */
export function pickFairestPendingToStart(
  pending: MatchSummary[],
  players: GamePlayer[],
  matches: MatchSummary[],
) {
  const fairness = rotationFairnessCounts(players, matches)
  const allPlayerIds = players.map((p) => p.id)
  const pendingSlots = pendingSlotCounts(matches)
  return pickBestFromPool(pending, fairness, allPlayerIds, pendingSlots)
}
