import type { GameDetail, MatchSummary } from "@/lib/api"
import { playerDisplayName } from "@/lib/player-display-name"

export function getMaxCourts(game: Pick<GameDetail, "courts">): number {
  return Math.max(1, game.courts?.length ?? 1)
}

export function countOngoingMatches(matches: MatchSummary[]): number {
  return matches.filter((m) => m.status === "ongoing").length
}

/** True when another match can start (ongoing count < configured courts). */
export function canStartAnotherMatch(
  matches: MatchSummary[],
  maxCourts: number,
): boolean {
  return countOngoingMatches(matches) < maxCourts
}

export function getOngoingBusyIds(matches: MatchSummary[]): Set<number> {
  return new Set(
    matches
      .filter((m) => m.status === "ongoing")
      .flatMap((m) => [...m.team_a, ...m.team_b].map((p) => p.id)),
  )
}

export function activeGamePlayerIds(game: Pick<GameDetail, "players">): Set<number> {
  return new Set((game.players ?? []).map((p) => p.id))
}

export function rosterPlayersGone(
  match: MatchSummary,
  activePlayerIds: Set<number>,
): MatchSummary["team_a"] {
  return [...match.team_a, ...match.team_b].filter((p) => !activePlayerIds.has(p.id))
}

export function isMatchStartable(
  match: MatchSummary,
  busyIds: Set<number>,
  activePlayerIds: Set<number>,
  playersNeeded = 4,
) {
  const roster = [...match.team_a, ...match.team_b]
  if (roster.length < playersNeeded) return false
  if (!roster.every((p) => activePlayerIds.has(p.id))) return false
  return roster.every((p) => !busyIds.has(p.id))
}

export function getPendingStartBlockReason(
  match: MatchSummary,
  game: GameDetail,
  matches: MatchSummary[],
  busyIds: Set<number>,
  activePlayerIds: Set<number>,
  playersNeeded: number,
): string | null {
  const maxCourts = getMaxCourts(game)
  const ongoing = matches.filter((m) => m.status === "ongoing")
  if (!canStartAnotherMatch(matches, maxCourts)) {
    return `Sân đầy (${ongoing.length}/${maxCourts}) — kết thúc trận trên sân trước`
  }
  const gone = rosterPlayersGone(match, activePlayerIds)
  if (gone.length > 0) {
    const who = [...new Set(gone.map((p) => playerDisplayName(p.name, p.id)))].join(", ")
    return `${who} đã rời buổi — sửa hoặc xóa trận chờ`
  }
  if (!isMatchStartable(match, busyIds, activePlayerIds, playersNeeded)) {
    const blockers = getMatchStartBlockers(match, ongoing)
    if (blockers.length > 0) {
      const who = [...new Set(blockers.map((b) => b.playerName))].join(", ")
      const on = [...new Set(blockers.map((b) => `#${b.ongoingMatchNumber}`))].join(", ")
      return `${who} đang đấu ${on}`
    }
    return `Chưa đủ ${playersNeeded} người trong trận`
  }
  return null
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
  activePlayerIds: Set<number>,
  playersNeeded: number,
) {
  return pending.filter((m) => isMatchStartable(m, busyIds, activePlayerIds, playersNeeded))
}

/** Next pending to put on court: ★ ready first, else FIFO ready, else earliest queued. */
export function pickNextPendingForQueue(
  pending: MatchSummary[],
  startablePending: MatchSummary[],
): MatchSummary {
  const startableIds = new Set(startablePending.map((m) => m.id))
  const priorityReady = pending.find((m) => m.priority && startableIds.has(m.id))
  if (priorityReady) return priorityReady
  const fifoReady = pending.find((m) => startableIds.has(m.id))
  if (fifoReady) return fifoReady
  return pending[0]!
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
