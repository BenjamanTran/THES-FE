import type { GameDetail, GamePlayer, MatchSummary } from "@/lib/api"
import { createMatch } from "@/lib/api"
import { balanceTeams, calcFairness, type BalanceResult } from "@/lib/balance"
import { computeScheduledCounts } from "@/lib/match-stats"

function combinations(arr: number[], size: number): number[][] {
  if (size === 0) return [[]]
  if (arr.length < size) return []
  const result: number[][] = []
  for (let i = 0; i <= arr.length - size; i++) {
    for (const rest of combinations(arr.slice(i + 1), size - 1)) {
      result.push([arr[i], ...rest])
    }
  }
  return result
}

function lineupKey(result: BalanceResult): string {
  return [...result.teamA, ...result.teamB].sort((a, b) => a - b).join(",")
}

/**
 * Pick `needed` players minimizing total queue slots (scheduled counts only).
 * Tie-break: better skill balance, then avoid repeating a recent 4-player set.
 */
function pickBatchRoster(
  players: GamePlayer[],
  scheduled: Record<number, number>,
  teamSize: number,
  avoidFourPlayerSets: Set<string>,
): number[] | null {
  const needed = teamSize * 2
  const ids = players.map((p) => p.id)
  if (ids.length < needed) return null

  const combos = ids.length === needed ? [ids] : combinations(ids, needed)

  let bestRoster: number[] | null = null
  let bestScore: [number, number, number] | null = null

  for (const roster of combos) {
    const fourKey = [...roster].sort((a, b) => a - b).join(",")
    const mcSum = roster.reduce((s, id) => s + (scheduled[id] ?? 0), 0)
    const subset = players.filter((p) => roster.includes(p.id))
    const pairing = balanceTeams(subset, teamSize, undefined, "any")
    if (pairing.teamA.length < teamSize || pairing.teamB.length < teamSize) continue

    const diff = calcFairness(pairing.teamA, pairing.teamB, players).diff
    const repeatPenalty = avoidFourPlayerSets.has(fourKey) ? 1 : 0
    const score: [number, number, number] = [mcSum, repeatPenalty, diff]

    if (
      bestScore === null ||
      score[0] < bestScore[0] ||
      (score[0] === bestScore[0] && score[1] < bestScore[1]) ||
      (score[0] === bestScore[0] && score[1] === bestScore[1] && score[2] < bestScore[2])
    ) {
      bestScore = score
      bestRoster = roster
    }
  }

  return bestRoster
}

/**
 * Fair batch queue: each match picks the 4 (or 2) with fewest scheduled slots,
 * then balances teams. Updates scheduled after each planned match.
 */
export async function generateMatchBatchFair(
  game: GameDetail,
  players: GamePlayer[],
  matches: MatchSummary[],
  count: number,
): Promise<{ created: number; errors: string[] }> {
  const teamSize = game.match_type === "singles" ? 1 : 2
  const needed = teamSize * 2
  if (players.length < needed) {
    return { created: 0, errors: ["Không đủ người cho một trận"] }
  }

  const scheduled = computeScheduledCounts(matches)
  const avoidFourPlayerSets = new Set<string>()
  const errors: string[] = []
  let created = 0

  for (let i = 0; i < count; i++) {
    const roster = pickBatchRoster(players, scheduled, teamSize, avoidFourPlayerSets)
    if (!roster) break

    const subset = players.filter((p) => roster.includes(p.id))
    const { teamA, teamB } = balanceTeams(subset, teamSize, undefined, "any")
    if (teamA.length < teamSize || teamB.length < teamSize) break

    avoidFourPlayerSets.add([...roster].sort((a, b) => a - b).join(","))

    try {
      await createMatch(game.id, { team_a: teamA, team_b: teamB })
      created += 1
      for (const id of roster) {
        scheduled[id] = (scheduled[id] ?? 0) + 1
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "Không thể tạo trận")
      break
    }
  }

  return { created, errors }
}
