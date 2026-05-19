import type { GameDetail, GamePlayer, MatchSummary } from "@/lib/api"
import { createMatch } from "@/lib/api"
import { balanceTeams } from "@/lib/balance"
import { compositeFairnessCounts, computeScheduledCounts } from "@/lib/match-stats"

/**
 * Fair batch queue: balanceTeams with composite counts, then bump scheduled after each create.
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
  const errors: string[] = []
  let created = 0

  for (let i = 0; i < count; i++) {
    const fairness = compositeFairnessCounts(players, matches, scheduled)
    const { teamA, teamB } = balanceTeams(players, teamSize, fairness, "any")
    if (teamA.length < teamSize || teamB.length < teamSize) break

    try {
      await createMatch(game.id, { team_a: teamA, team_b: teamB })
      created += 1
      for (const id of [...teamA, ...teamB]) {
        scheduled[id] = (scheduled[id] ?? 0) + 1
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "Không thể tạo trận")
      break
    }
  }

  return { created, errors }
}
