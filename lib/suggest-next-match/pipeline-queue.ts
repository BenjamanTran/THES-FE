import type { GameDetail, GamePlayer, MatchSummary } from "@/lib/api"
import { canAddPendingMatch } from "@/lib/match-queue-capacity"
import { balanceTeams } from "@/lib/balance"
import { rotationFairnessCounts } from "@/lib/match-stats"
import { getOngoingBusyIds } from "./start-rules"
import { formatTeamsLabel } from "./labels"

export type PipelineQueueLineup = {
  teamA: number[]
  teamB: number[]
  label: string
  reason: string
}

function idsInOtherPending(matches: MatchSummary[] | undefined): Set<number> {
  return new Set(
    (matches ?? [])
      .filter((m) => m.status === "pending")
      .flatMap((m) => [...m.team_a, ...m.team_b].map((p) => p.id)),
  )
}

/** Player pool for a new pending slot: prefer free players, then relax; exclude other pending rosters. */
export function poolForNewPendingSlot(
  players: GamePlayer[],
  matches: MatchSummary[] | undefined,
  needed: number,
): { pool: GamePlayer[]; preferFree: boolean } | null {
  const inOtherPending = idsInOtherPending(matches)
  const busyOnCourt = getOngoingBusyIds(matches ?? [])

  const free = players.filter(
    (p) => !busyOnCourt.has(p.id) && !inOtherPending.has(p.id),
  )
  if (free.length >= needed) {
    return { pool: free, preferFree: true }
  }

  const relaxed = players.filter((p) => !inOtherPending.has(p.id))
  if (relaxed.length >= needed) {
    return { pool: relaxed, preferFree: false }
  }

  return null
}

/**
 * Suggest a pending-queue lineup: fewest matches played first, then skill balance.
 * When not enough free players, may include on-court players (starts when they are free).
 */
export function suggestPipelineQueueLineup(
  game: GameDetail,
  players: GamePlayer[],
  matches: MatchSummary[] | undefined,
): PipelineQueueLineup | null {
  const teamSize = game.match_type === "singles" ? 1 : 2
  const needed = teamSize * 2
  if (players.length < needed) return null
  if (!canAddPendingMatch(game, matches)) return null

  const poolPick = poolForNewPendingSlot(players, matches, needed)
  if (!poolPick) return null

  const { pool, preferFree } = poolPick
  const fairness = rotationFairnessCounts(pool, matches)
  const { teamA, teamB } = balanceTeams(pool, teamSize, fairness)
  if (teamA.length < teamSize || teamB.length < teamSize) return null

  const pending = (matches ?? []).filter((m) => m.status === "pending")
  if (lineupExistsInPending(pending, teamA, teamB)) {
    return null
  }

  const busyOnCourt = getOngoingBusyIds(matches ?? [])
  const overlap = [...teamA, ...teamB].filter((id) => busyOnCourt.has(id)).length
  const maxCourts = Math.max(1, game.courts?.length ?? 1)
  const fairNote = "Ưu tiên ít trận, cân trình độ"

  let reason: string
  if (preferFree && overlap === 0) {
    reason =
      pending.length > 0
        ? `${fairNote} — ${needed} người rảnh, slot hàng chờ ${pending.length + 1}/${maxCourts}`
        : `${fairNote} — ${needed} người rảnh`
  } else if (overlap > 0) {
    reason = `${fairNote} — ${overlap}/${needed} người đang trên sân, bắt đầu khi rảnh`
    if (pending.length > 0) {
      reason += ` (slot ${pending.length + 1}/${maxCourts})`
    }
  } else {
    reason = `${fairNote} — ghép từ ${pool.length} người có thể xếp`
    if (pending.length > 0) {
      reason += `, slot ${pending.length + 1}/${maxCourts}`
    }
  }

  return {
    teamA,
    teamB,
    label: formatTeamsLabel(teamA, teamB, players),
    reason,
  }
}

function lineupExistsInPending(
  pending: MatchSummary[],
  teamA: number[],
  teamB: number[],
): boolean {
  const key = (ids: number[]) => [...ids].sort((a, b) => a - b).join(",")
  const kA = key(teamA)
  const kB = key(teamB)
  return pending.some((m) => {
    const a = key(m.team_a.map((p) => p.id))
    const b = key(m.team_b.map((p) => p.id))
    return (a === kA && b === kB) || (a === kB && b === kA)
  })
}
