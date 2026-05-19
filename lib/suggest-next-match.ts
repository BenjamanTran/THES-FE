import type { GameDetail, GamePlayer, MatchSummary } from "@/lib/api"
import { balanceTeams } from "@/lib/balance"
import { compositeFairnessCounts } from "@/lib/match-stats"

export type NextMatchSuggestion =
  | {
      kind: "start"
      match: MatchSummary
      label: string
      reason: string
    }
  | {
      kind: "create"
      teamA: number[]
      teamB: number[]
      label: string
      reason: string
    }
  | {
      kind: "queue"
      teamA: number[]
      teamB: number[]
      label: string
      reason: string
    }
  | {
      kind: "wait_court"
      match?: MatchSummary
      label: string
      reason: string
    }
  | {
      kind: "wait_players"
      match: MatchSummary
      label: string
      reason: string
    }
  | {
      kind: "batch"
      label: string
      reason: string
    }

function shortName(name: string | null, id: number) {
  if (!name) return `#${id}`
  const parts = name.trim().split(/\s+/)
  return parts[parts.length - 1] || name
}

export function formatMatchLabel(match: MatchSummary) {
  const names = [...match.team_a, ...match.team_b].map((p) => shortName(p.name, p.id))
  return `Trận ${match.match_number}: ${names.join(" · ")}`
}

function formatTeamsLabel(
  teamAIds: number[],
  teamBIds: number[],
  players: GamePlayer[],
) {
  const name = (id: number) => {
    const p = players.find((pl) => pl.id === id)
    return shortName(p?.name ?? null, id)
  }
  const a = teamAIds.map(name).join(" & ")
  const b = teamBIds.map(name).join(" & ")
  return `${a} vs ${b}`
}

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

/** Lower is fairer. Prioritises min-played + least queued load. */
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

function findPendingWithLineup(
  pending: MatchSummary[],
  teamA: number[],
  teamB: number[],
) {
  const key = lineupKey(teamA, teamB)
  return pending.find((m) => matchLineupKey(m) === key) ?? null
}

function pickFairestPending(
  pending: MatchSummary[],
  fairness: Record<number, number>,
  allPlayerIds: number[],
) {
  return pending.reduce((best, m) => {
    const sb = scoreLineupFairness(
      best.team_a.map((p) => p.id),
      best.team_b.map((p) => p.id),
      fairness,
      allPlayerIds,
    )
    const sm = scoreLineupFairness(
      m.team_a.map((p) => p.id),
      m.team_b.map((p) => p.id),
      fairness,
      allPlayerIds,
    )
    return compareLineupFairness(sm, sb) < 0 ? m : best
  })
}

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

/** Pending match that frees up soonest (fewest players still on court). */
function pickNearestPending(
  pending: MatchSummary[],
  busyIds: Set<number>,
  fairness: Record<number, number>,
  allPlayerIds: number[],
) {
  const minBusy = Math.min(...pending.map((m) => busyCountInMatch(m, busyIds)))
  const candidates = pending.filter((m) => busyCountInMatch(m, busyIds) === minBusy)
  return pickFairestPending(candidates, fairness, allPlayerIds)
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
      playerName: shortName(p.name, p.id),
      ongoingMatchNumber: onCourt.match_number,
    })
  }
  return blockers
}

function formatMatchStartBlockReason(
  match: MatchSummary,
  ongoing: MatchSummary[],
  maxCourts: number,
) {
  const blockers = getMatchStartBlockers(match, ongoing)
  if (blockers.length === 0) return "Đợi người trên sân rảnh"

  const byOngoing = new Map<number, string[]>()
  for (const b of blockers) {
    const list = byOngoing.get(b.ongoingMatchNumber) ?? []
    list.push(b.playerName)
    byOngoing.set(b.ongoingMatchNumber, list)
  }
  const who = [...byOngoing.entries()]
    .map(([num, names]) => `${names.join(", ")} đang đấu #${num}`)
    .join("; ")
  const freeCourts = Math.max(0, maxCourts - ongoing.length)
  return `${who} — còn ${freeCourts} sân trống (${ongoing.length}/${maxCourts} sân đang dùng)`
}

function filterStartablePending(
  pending: MatchSummary[],
  busyIds: Set<number>,
  playersNeeded: number,
) {
  return pending.filter((m) => isMatchStartable(m, busyIds, playersNeeded))
}

function idealLineup(
  players: GamePlayer[],
  teamSize: number,
  fairness: Record<number, number>,
) {
  const { teamA, teamB } = balanceTeams(players, teamSize, fairness)
  if (teamA.length < teamSize || teamB.length < teamSize) return null
  return { teamA, teamB }
}

function fairnessReason(
  teamA: number[],
  teamB: number[],
  players: GamePlayer[],
  fairness: Record<number, number>,
) {
  const loads = lineupFairnessLoads(teamA, teamB, fairness)
  const minLoad = Math.min(...loads)
  const ids = [...teamA, ...teamB]
  const names = ids
    .filter((id) => (fairness[id] ?? 0) === minLoad)
    .map((id) => shortName(players.find((p) => p.id === id)?.name ?? null, id))
    .slice(0, 3)
  if (names.length === 0) return "Cân bằng lượt chơi trong buổi"
  return `Ưu tiên ${names.join(", ")}`
}

function fairnessReasonForMatch(
  match: MatchSummary,
  players: GamePlayer[],
  fairness: Record<number, number>,
) {
  return fairnessReason(
    match.team_a.map((p) => p.id),
    match.team_b.map((p) => p.id),
    players,
    fairness,
  )
}

export function suggestNextMatch(
  game: GameDetail,
  players: GamePlayer[],
  matches: MatchSummary[],
): NextMatchSuggestion | null {
  const teamSize = game.match_type === "singles" ? 1 : 2
  const needed = teamSize * 2
  if (players.length < needed) return null

  const fairness = compositeFairnessCounts(players, matches)
  const allPlayerIds = players.map((p) => p.id)
  const ongoing = matches.filter((m) => m.status === "ongoing")
  const pending = matches
    .filter((m) => m.status === "pending")
    .sort((a, b) => a.match_number - b.match_number)

  const maxCourts = Math.max(1, game.courts?.length ?? 1)
  const canStartMore = ongoing.length < maxCourts
  const busyIds = new Set(
    ongoing.flatMap((m) => [...m.team_a, ...m.team_b].map((p) => p.id)),
  )
  const freePlayers = players.filter((p) => !busyIds.has(p.id))
  const ideal = idealLineup(freePlayers, teamSize, fairness)
  const startablePending = filterStartablePending(pending, busyIds, needed)

  // Hàng chờ có trận → ưu tiên bắt đầu từ hàng chờ; nếu không ai rảnh đủ đội thì gợi ý người bench lên sân.
  if (pending.length > 0) {
    if (canStartMore && startablePending.length > 0) {
      const priorityStartable = startablePending.filter((m) => m.priority)
      const pool = priorityStartable.length > 0 ? priorityStartable : startablePending
      const match = pickFairestPending(pool, fairness, allPlayerIds)
      return {
        kind: "start",
        match,
        label: formatMatchLabel(match),
        reason: fairnessReasonForMatch(match, players, fairness),
      }
    }

    // Còn sân + đủ người rảnh nhưng mọi trận chờ đều trùng người đang đấu → lấp sân bằng đội bench.
    if (canStartMore && startablePending.length === 0 && freePlayers.length >= needed && ideal) {
      const { teamA, teamB } = ideal
      return {
        kind: "create",
        teamA,
        teamB,
        label: formatTeamsLabel(teamA, teamB, players),
        reason: `0/${pending.length} trận chờ sẵn sàng (đều cần người trên sân). ${freePlayers.length} người rảnh — gợi ý lên sân ngay, không cần đợi hàng chờ.`,
      }
    }

    const next = pickNearestPending(pending, busyIds, fairness, allPlayerIds)
    const blockers = getMatchStartBlockers(next, ongoing)
    const freeCourts = Math.max(0, maxCourts - ongoing.length)

    if (!canStartMore) {
      return {
        kind: "wait_court",
        match: next,
        label: formatMatchLabel(next),
        reason: `Sân đầy (${ongoing.length}/${maxCourts}) — kết thúc trận trên sân rồi bắt đầu Trận ${next.match_number}`,
      }
    }

    const queueSummary = `${startablePending.length}/${pending.length} trận chờ bắt đầu được ngay`
    const nextDetail =
      blockers.length > 0
        ? `Trận #${next.match_number} lên sớm nhất khi ${blockers.map((b) => b.playerName).join(", ")} xong (đang #${blockers[0]!.ongoingMatchNumber})`
        : `Trận #${next.match_number} sắp sẵn sàng`
    return {
      kind: "wait_players",
      match: next,
      label: formatMatchLabel(next),
      reason: `${queueSummary}. ${nextDetail} — còn ${freeCourts} sân trống (${ongoing.length}/${maxCourts}).`,
    }
  }

  // Hàng chờ trống — có thể tạo / bắt đầu trận mới.
  if (!ideal) {
    return {
      kind: "batch",
      label: "Xếp sẵn 10–15 trận vào hàng chờ",
      reason: "Không ghép được đội — thử xếp hàng loạt hoặc thêm người",
    }
  }

  const { teamA, teamB } = ideal
  const label = formatTeamsLabel(teamA, teamB, players)
  const reason = fairnessReason(teamA, teamB, players, fairness)

  if (canStartMore && freePlayers.length >= needed) {
    return { kind: "create", teamA, teamB, label, reason }
  }

  const benchCount = freePlayers.length
  const onCourtInLineup = [...teamA, ...teamB].filter((id) => busyIds.has(id)).length
  return {
    kind: "queue",
    teamA,
    teamB,
    label,
    reason:
      !canStartMore
        ? `Sân đang bận — thêm vào hàng chờ${onCourtInLineup > 0 ? ` (${onCourtInLineup} người đang đấu sẽ luân sau)` : ""}`
        : benchCount < needed
          ? `Chỉ ${benchCount} người rảnh (cần ${needed}) — ${reason}`
          : reason,
  }
}
