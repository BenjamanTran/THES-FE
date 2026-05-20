import type { GameDetail, GamePlayer, MatchSummary } from "@/lib/api"
import { balanceTeams } from "@/lib/balance"
import { compositeFairnessCounts, sessionPlayedSpread } from "@/lib/match-stats"
import { playerDisplayName } from "@/lib/player-display-name"
import { formatMatchLabel, formatTeamsLabel } from "./labels"
import { pickFairestPending, pickFairestPendingToStart } from "./lineup-fairness"
import { rotationFairnessCounts } from "@/lib/match-stats"
import {
  filterStartablePending,
  getMatchStartBlockers,
  getOngoingBusyIds,
  pickNearestPending,
} from "./start-rules"
import type { NextMatchSuggestion } from "./types"

/** Prefer "Tạo & bắt đầu" over hàng chờ when min/max played in player list differs by at least this much. */
const CREATE_OVER_QUEUE_MIN_SPREAD = 3

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
  const loads = [...teamA, ...teamB].map((id) => fairness[id] ?? 0)
  const minLoad = Math.min(...loads)
  const ids = [...teamA, ...teamB]
  const names = ids
    .filter((id) => (fairness[id] ?? 0) === minLoad)
    .map((id) => playerDisplayName(players.find((p) => p.id === id)?.name, id))
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
  const startFairness = rotationFairnessCounts(players, matches)
  const allPlayerIds = players.map((p) => p.id)
  const ongoing = matches.filter((m) => m.status === "ongoing")
  const pending = matches
    .filter((m) => m.status === "pending")
    .sort((a, b) => a.match_number - b.match_number)

  const maxCourts = Math.max(1, game.courts?.length ?? 1)
  const canStartMore = ongoing.length < maxCourts
  const busyIds = getOngoingBusyIds(matches)
  const freePlayers = players.filter((p) => !busyIds.has(p.id))
  const idealCreate =
    freePlayers.length >= needed ? idealLineup(freePlayers, teamSize, startFairness) : null
  const idealQueue =
    freePlayers.length >= needed ? idealLineup(freePlayers, teamSize, fairness) : null
  const startablePending = filterStartablePending(pending, busyIds, needed)
  const playedSpread = sessionPlayedSpread(players, matches)
  const preferCreateOverQueue = playedSpread >= CREATE_OVER_QUEUE_MIN_SPREAD

  if (pending.length > 0) {
    const priorityStartable = startablePending.filter((m) => m.priority)

    if (canStartMore && priorityStartable.length > 0) {
      const match = pickFairestPendingToStart(priorityStartable, players, matches)
      return {
        kind: "start",
        match,
        label: formatMatchLabel(match),
        reason: fairnessReasonForMatch(match, players, startFairness),
      }
    }

    // Lệch ≥ 3 trận: ghép người rảnh thay vì chỉ dùng hàng chờ
    if (canStartMore && idealCreate && preferCreateOverQueue) {
      const { teamA, teamB } = idealCreate
      const fairReason = fairnessReason(teamA, teamB, players, startFairness)
      return {
        kind: "create",
        teamA,
        teamB,
        label: formatTeamsLabel(teamA, teamB, players),
        reason:
          startablePending.length > 0
            ? `Lệch ${playedSpread} trận — ghép ${needed} người rảnh theo lượt đã đấu. ${fairReason}`
            : `0/${pending.length} trận chờ sẵn sàng. ${freePlayers.length} người rảnh — ${fairReason}`,
      }
    }

    if (canStartMore && startablePending.length > 0) {
      const match = pickFairestPendingToStart(startablePending, players, matches)
      const matchReason = fairnessReasonForMatch(match, players, startFairness)
      return {
        kind: "start",
        match,
        label: formatMatchLabel(match),
        reason:
          playedSpread < CREATE_OVER_QUEUE_MIN_SPREAD
            ? `Lệch ${playedSpread} trận (dưới ${CREATE_OVER_QUEUE_MIN_SPREAD}) — bắt đầu từ hàng chờ. ${matchReason}`
            : matchReason,
      }
    }

    const next = pickNearestPending(
      pending,
      busyIds,
      startFairness,
      allPlayerIds,
      pickFairestPending,
    )
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

  if (!idealCreate && !idealQueue) {
    return {
      kind: "batch",
      label: "Xếp sẵn 10 trận vào hàng chờ",
      reason: "Không ghép được đội — thử xếp hàng loạt hoặc thêm người",
    }
  }

  if (canStartMore && idealCreate) {
    const { teamA, teamB } = idealCreate
    return {
      kind: "create",
      teamA,
      teamB,
      label: formatTeamsLabel(teamA, teamB, players),
      reason: fairnessReason(teamA, teamB, players, startFairness),
    }
  }

  if (!idealQueue) {
    return {
      kind: "batch",
      label: "Xếp sẵn 10 trận vào hàng chờ",
      reason: "Không ghép được đội — thử xếp hàng loạt hoặc thêm người",
    }
  }

  const { teamA, teamB } = idealQueue
  const label = formatTeamsLabel(teamA, teamB, players)
  const reason = fairnessReason(teamA, teamB, players, fairness)

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
