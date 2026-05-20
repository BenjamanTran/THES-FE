import type { MatchSummary } from "@/lib/api"
import { playerDisplayName } from "@/lib/player-display-name"

export function getOngoingBusyIds(matches: MatchSummary[]): Set<number> {
  return new Set(
    matches
      .filter((m) => m.status === "ongoing")
      .flatMap((m) => [...m.team_a, ...m.team_b].map((p) => p.id)),
  )
}

export function isMatchStartable(
  match: MatchSummary,
  busyIds: Set<number>,
  playersNeeded = 4,
) {
  const roster = [...match.team_a, ...match.team_b]
  if (roster.length < playersNeeded) return false
  return roster.every((p) => !busyIds.has(p.id))
}

function busyCountInMatch(match: MatchSummary, busyIds: Set<number>) {
  return [...match.team_a, ...match.team_b].filter((p) => busyIds.has(p.id)).length
}

export function getMatchStartBlockers(
  match: MatchSummary,
  ongoing: MatchSummary[],
): Array<{ playerName: string; ongoingMatchNumber: number }> {
  const seen = new Set<number>()
  const blockers: Array<{ playerName: string; ongoingMatchNumber: number }> = []
  for (const p of [...match.team_a, ...match.team_b]) {
    if (seen.has(p.id)) continue
    const onCourt = ongoing.find((m) =>
      [...m.team_a, ...m.team_b].some((x) => x.id === p.id),
    )
    if (!onCourt) continue
    seen.add(p.id)
    blockers.push({
      playerName: playerDisplayName(p.name, p.id),
      ongoingMatchNumber: onCourt.match_number,
    })
  }
  return blockers
}

export function filterStartablePending(
  pending: MatchSummary[],
  busyIds: Set<number>,
  playersNeeded: number,
) {
  return pending.filter((m) => isMatchStartable(m, busyIds, playersNeeded))
}

/** Pending match that frees up soonest (fewest players still on court). */
export function pickNearestPending(
  pending: MatchSummary[],
  busyIds: Set<number>,
  fairness: Record<number, number>,
  allPlayerIds: number[],
  pickFairest: (
    pending: MatchSummary[],
    fairness: Record<number, number>,
    allPlayerIds: number[],
  ) => MatchSummary,
) {
  const minBusy = Math.min(...pending.map((m) => busyCountInMatch(m, busyIds)))
  const candidates = pending.filter((m) => busyCountInMatch(m, busyIds) === minBusy)
  return pickFairest(candidates, fairness, allPlayerIds)
}
